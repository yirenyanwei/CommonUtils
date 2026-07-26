import { GameplayEffectSpec, GameplayAbilitySpec, AttributeSetConfig, AttributeName } from '../../data/config-types';
import { gasRegistry } from '../../data/gas-registry';
import { AttributeSet } from './attribute/attribute-set';
import { GameplayTagContainer } from './tag/gameplay-tag-container';
import { ActiveGameplayEffect } from './effect/active-gameplay-effect';
import { AbilitySpec } from './ability/ability-spec';
import { AbilityTask } from './task/ability-task';
import { buildTask } from './task/task-builder';
import { BattleEventType } from '../event/battle-event';
import type { BattleWorld } from '../core/battle-world';
import type { CharacterEntity } from '../entity/character-entity';

// ============================================================
// AbilitySystemComponent（ASC）
// 对齐 UE UAbilitySystemComponent，是 GAS 的唯一管理入口。
//
// 持有：
//   - AttributeSet：属性（HP/MP/ATK/DEF/MoveSpeed）
//   - GameplayTagContainer：当前持有的状态 Tag
//   - ActiveGameplayEffects：运行中的 GE 实例列表
//   - GrantedAbilities：已授予的技能（含 CD 状态）
//
// 核心 API：
//   tryActivateAbility  —— 技能激活（GAS 标准流程）
//   applyGameplayEffect —— 施加 Buff/Debuff
//   removeGameplayEffect—— 驱散 Buff
//   tickActiveEffects   —— 每 tick 维护 GE 生命周期（由 TagTickSystem 调用）
//   advanceActiveAbility—— 每 tick 推进执行中的技能 Task（由 AbilitySystem 调用）
// ============================================================

export interface ActiveAbility {
    spec: GameplayAbilitySpec;
    taskIndex: number;
    tasks: AbilityTask[];
}

export class AbilitySystemComponent {
    readonly attributes: AttributeSet;
    readonly tags: GameplayTagContainer;

    private readonly activeEffects: ActiveGameplayEffect[] = [];
    private readonly grantedAbilities = new Map<string, AbilitySpec>();

    /** 当前正在执行的技能（同一时间只允许一个） */
    private activeAbility: ActiveAbility | null = null;

    /** 此 ASC 所属的实体（在 activate 时需要 caster 引用） */
    owner!: CharacterEntity;

    constructor(attrConfig: AttributeSetConfig) {
        this.attributes = new AttributeSet(attrConfig);
        this.tags = new GameplayTagContainer();
    }

    // ─── 技能授予 ─────────────────────────────────────────────

    grantAbility(abilityId: string): void {
        if (!this.grantedAbilities.has(abilityId)) {
            this.grantedAbilities.set(abilityId, new AbilitySpec(abilityId));
        }
    }

    // ─── 技能激活（GAS 标准 9 步流程）─────────────────────────

    /**
     * 尝试激活技能。
     * 返回 true 表示激活成功，false 表示被阻止（CD/Tag/MP 不足等）。
     */
    tryActivateAbility(abilityId: string, world: BattleWorld): boolean {
        const spec = this.grantedAbilities.get(abilityId);
        if (!spec) return false;

        const gaSpec = gasRegistry.getAbilitySpec(abilityId);

        // 1. 检查 RequiredTags
        if (gaSpec.requiredTags?.length && !this.tags.hasAll(gaSpec.requiredTags)) return false;

        // 2. 检查 BlockedTags
        if (gaSpec.blockedTags?.length && this.tags.hasAny(gaSpec.blockedTags)) return false;

        // 3. 检查 CD
        if (spec.isOnCooldown) return false;

        // 4. 检查 MP
        if (this.attributes.getValue('mp') < gaSpec.costMp) return false;

        // 5. 扣 MP
        if (gaSpec.costMp > 0) {
            this.attributes.modifyCurrent('mp', -gaSpec.costMp);
            world.eventBus.emit({
                type: BattleEventType.ATTRIBUTE_CHANGE,
                tick: world.tick,
                entityId: this.owner.id,
                attribute: 'mp',
                value: this.attributes.getValue('mp'),
                maxValue: this.attributes.getValue('maxMp'),
            });
        }

        // 6. 设置 CD
        spec.remainingCooldownTicks = gaSpec.cooldownTicks;

        // 7. 附加激活中 Tag
        for (const tag of gaSpec.activationOwnedTags ?? []) {
            this.tags.addTag(tag);
            world.eventBus.emit({ type: BattleEventType.TAG_CHANGED, tick: world.tick, entityId: this.owner.id, tag, added: true });
        }

        // 8. 构建 Task 链
        const tasks = gaSpec.tasks.map(buildTask);

        // 9. 启动 ActiveAbility
        this.activeAbility = { spec: gaSpec, taskIndex: 0, tasks };
        return true;
    }

    // ─── Task 推进（每 tick 由 AbilitySystem 调用）────────────

    advanceActiveAbility(world: BattleWorld): void {
        if (!this.activeAbility) return;

        const ab = this.activeAbility;
        const ctx = { world, caster: this.owner, abilityId: ab.spec.id };

        // 执行当前 task
        const done = ab.tasks[ab.taskIndex].tick(ctx);

        if (done) {
            ab.taskIndex++;
            // 所有 task 完成 → 技能结束
            if (ab.taskIndex >= ab.tasks.length) {
                this.endActiveAbility(world);
            }
        }
    }

    hasActiveAbility(): boolean {
        return this.activeAbility !== null;
    }

    private endActiveAbility(world: BattleWorld): void {
        if (!this.activeAbility) return;
        const ab = this.activeAbility;

        // 移除激活中 Tag
        for (const tag of ab.spec.activationOwnedTags ?? []) {
            this.tags.removeTag(tag);
            world.eventBus.emit({ type: BattleEventType.TAG_CHANGED, tick: world.tick, entityId: this.owner.id, tag, added: false });
        }

        world.eventBus.emit({
            type: BattleEventType.ABILITY_END,
            tick: world.tick,
            entityId: this.owner.id,
            abilityId: ab.spec.id,
        });

        this.activeAbility = null;
    }

    // ─── GE 施加 ──────────────────────────────────────────────

    applyGameplayEffect(geSpec: GameplayEffectSpec, world: BattleWorld): void {
        // Instant：立即执行 Modifier，不入列表
        if (geSpec.durationType === 'Instant') {
            this.applyModifiers(geSpec, world, 1);
            return;
        }

        const age = new ActiveGameplayEffect(geSpec);

        // 施加属性修改（Duration/Infinite 在 remove 时需要反向，暂以直接改 current 实现）
        this.applyModifiers(geSpec, world, 1);

        // 附加 grantedTags
        for (const tag of geSpec.grantedTags ?? []) {
            this.tags.addTag(tag);
            world.eventBus.emit({ type: BattleEventType.TAG_CHANGED, tick: world.tick, entityId: this.owner.id, tag, added: true });
        }

        this.activeEffects.push(age);

        world.eventBus.emit({
            type: BattleEventType.GE_APPLIED,
            tick: world.tick,
            entityId: this.owner.id,
            geId: geSpec.id,
            iconKey: geSpec.iconKey,
            remainingTicks: age.remainingTicks,
        });
    }

    // ─── GE Tick 维护（每 tick 由 TagTickSystem 调用）─────────

    tickActiveEffects(world: BattleWorld): void {
        const expired: ActiveGameplayEffect[] = [];

        for (const age of this.activeEffects) {
            // Duration 倒计时
            if (age.spec.durationType === 'Duration') {
                age.remainingTicks--;
                if (age.remainingTicks <= 0) {
                    expired.push(age);
                    continue;
                }
            }

            // 周期触发
            if (age.spec.periodicEffect) {
                age.periodicTimer++;
                if (age.periodicTimer >= age.spec.periodicEffect.intervalTicks) {
                    age.periodicTimer = 0;
                    const periodicGeSpec = gasRegistry.getEffectSpec(age.spec.periodicEffect.geId);
                    this.applyGameplayEffect(periodicGeSpec, world);
                }
            }
        }

        // 移除过期 GE
        for (const age of expired) {
            this.removeGameplayEffect(age, world);
        }
    }

    // ─── Ability CD Tick 维护（每 tick 由 TagTickSystem 调用）──

    tickAbilityCooldowns(): void {
        for (const spec of this.grantedAbilities.values()) {
            spec.tickCooldown();
        }
    }

    removeGameplayEffect(age: ActiveGameplayEffect, world: BattleWorld): void {
        const idx = this.activeEffects.indexOf(age);
        if (idx === -1) return;
        this.activeEffects.splice(idx, 1);

        // 反向属性修改
        this.applyModifiers(age.spec, world, -1);

        // 移除 grantedTags
        for (const tag of age.spec.grantedTags ?? []) {
            this.tags.removeTag(tag);
            world.eventBus.emit({ type: BattleEventType.TAG_CHANGED, tick: world.tick, entityId: this.owner.id, tag, added: false });
        }

        world.eventBus.emit({ type: BattleEventType.GE_REMOVED, tick: world.tick, entityId: this.owner.id, geId: age.spec.id });
    }

    private applyModifiers(geSpec: GameplayEffectSpec, world: BattleWorld, sign: 1 | -1): void {
        for (const mod of geSpec.modifiers ?? []) {
            let delta = 0;
            const attr = this.attributes.get(mod.attribute);
            switch (mod.op) {
                case 'Add':
                    delta = mod.magnitude * sign;
                    this.attributes.modifyCurrent(mod.attribute, delta);
                    break;
                case 'Multiply':
                    // Multiply：基于 base 值乘以增量（sign 控制施加/移除）
                    delta = attr.base * mod.magnitude * sign;
                    this.attributes.modifyCurrent(mod.attribute, delta);
                    break;
                case 'Override':
                    if (sign === 1) this.attributes.setCurrent(mod.attribute, mod.magnitude);
                    else this.attributes.setCurrent(mod.attribute, attr.base);
                    break;
            }

            if (mod.attribute !== 'hp') {
                world.eventBus.emit({
                    type: BattleEventType.ATTRIBUTE_CHANGE,
                    tick: world.tick,
                    entityId: this.owner.id,
                    attribute: mod.attribute,
                    value: this.attributes.getValue(mod.attribute as AttributeName),
                });
            }
        }
    }

    // ─── 便捷查询 ─────────────────────────────────────────────

    getAbilitySpec(abilityId: string): AbilitySpec | undefined {
        return this.grantedAbilities.get(abilityId);
    }

    getAllGrantedAbilityIds(): string[] {
        return [...this.grantedAbilities.keys()];
    }
}
