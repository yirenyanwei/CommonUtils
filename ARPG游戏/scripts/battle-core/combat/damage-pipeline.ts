import { CharacterEntity } from '../entity/character-entity';
import { BattleWorld } from '../core/battle-world';
import { DamageResult } from '../resolver/damage-resolver';
import { BattleEventType } from '../event/battle-event';
import { Cues, GameplayEffectSpec, Tags } from '../../data/config-types';
import { gasRegistry } from '../../data/gas-registry';

/** Instant + hp Add 的 GE 仅作伤害标记，实际数值由 DamageResolver 计算 */
function isPlaceholderDamageGE(spec: GameplayEffectSpec): boolean {
    return spec.durationType === 'Instant'
        && (spec.modifiers?.some(m => m.attribute === 'hp' && m.op === 'Add') ?? false);
}

// ============================================================
// DamagePipeline — 伤害结算编排（施加伤害 + 受击反应 + 事件）
// 伤害公式由 DamageResolver 算完后传入此处执行。
// ============================================================

export interface PipelineRequest {
    attacker: CharacterEntity;
    target: CharacterEntity;
    result: DamageResult;
    /** Hitbox 配置中的击退参数 */
    knockbackX: number;
    knockbackY: number;
    /** 命中时施加的 GE id 列表（来自 SpawnHitboxTaskConfig.onHitGeIds） */
    onHitGeIds: string[];
}

export class DamagePipeline {
    apply(req: PipelineRequest, world: BattleWorld): void {
        const { attacker, target, result } = req;
        if (!target.isAlive) return;

        // 无敌帧：跳过伤害（但不跳过受击逻辑）
        if (target.asc.tags.hasTag(Tags.Invincible)) return;

        // 1. 扣 HP（伤害由 DamageResolver 计算，不走 GE modifier）
        target.asc.attributes.modifyCurrent('hp', -result.finalDamage);

        // 2. 发送 DAMAGE 事件
        world.eventBus.emit({
            type: BattleEventType.DAMAGE,
            tick: world.tick,
            attackerId: attacker.id,
            targetId: target.id,
            damage: result.finalDamage,
            isCrit: result.isCrit,
            hpAfter: target.asc.attributes.getValue('hp'),
        });

        // 3. 发送 HP 属性变化
        world.eventBus.emit({
            type: BattleEventType.ATTRIBUTE_CHANGE,
            tick: world.tick,
            entityId: target.id,
            attribute: 'hp',
            value: target.asc.attributes.getValue('hp'),
            maxValue: target.asc.attributes.getValue('maxHp'),
        });

        // 4. 受击 GameplayCue（受击闪白等）
        world.eventBus.emit({
            type: BattleEventType.GAMEPLAY_CUE,
            tick: world.tick,
            entityId: target.id,
            cueTag: Cues.Hit,
            position: { x: target.position.x, y: target.position.y },
        });

        // 5. 受击反应（霸体 → 只扣血不打断）
        if (!target.asc.tags.hasTag(Tags.SuperArmor)) {
            this.applyHitReaction(req, world);
        }

        // 6. 命中时 GE（Instant 伤害 GE 跳过，已在步骤 1 由 DamageResolver 结算）
        for (const geId of req.onHitGeIds) {
            const geSpec = gasRegistry.getEffectSpec(geId);
            if (isPlaceholderDamageGE(geSpec)) continue;
            target.asc.applyGameplayEffect(geSpec, world);
        }

        // 7. 死亡判定
        if (target.asc.attributes.getValue('hp') <= 0) {
            this.handleDeath(target, world);
        }
    }

    private applyHitReaction(req: PipelineRequest, world: BattleWorld): void {
        const { target, knockbackX, knockbackY } = req;

        // 击退
        if (knockbackX !== 0) {
            const dir = req.attacker.facing;
            target.velocity.x = knockbackX * dir * 0.1;
        }

        // 击飞检测
        if (knockbackY >= world.gameConfig.knockUpThreshold) {
            target.velocity.y = knockbackY * 0.1;
            target.isGrounded = false;
            const knockupSpec = gasRegistry.getEffectSpec('ge_knockup');
            target.asc.applyGameplayEffect(knockupSpec, world);
        } else {
            // 普通硬直
            const hitstunSpec = gasRegistry.getEffectSpec('ge_hitstun_light');
            target.asc.applyGameplayEffect(hitstunSpec, world);
        }
    }

    private handleDeath(entity: CharacterEntity, world: BattleWorld): void {
        entity.isAlive = false;
        world.eventBus.emit({ type: BattleEventType.ENTITY_DEATH, tick: world.tick, entityId: entity.id });
    }
}
