import { Cues, GameplayAbilitySpec, GameplayEffectSpec, Tags } from './config-types';

// ============================================================
// GAS 注册表
// 所有 GA Spec / GE Spec 在此统一注册，运行时只读
// ============================================================

// ────────────────────────────────────────────────────────────
// GE 定义
// ────────────────────────────────────────────────────────────

const GE_SPECS: GameplayEffectSpec[] = [
    // 普攻伤害（瞬时）
    {
        id: 'ge_normal_atk_dmg',
        durationType: 'Instant',
        modifiers: [{ attribute: 'hp', op: 'Add', magnitude: -1 }],  // 倍率在 DamageResolver 里算
    },
    // 技能1 伤害（瞬时）
    {
        id: 'ge_skill1_dmg',
        durationType: 'Instant',
        modifiers: [{ attribute: 'hp', op: 'Add', magnitude: -1 }],
    },
    // 技能2 伤害（瞬时）
    {
        id: 'ge_skill2_dmg',
        durationType: 'Instant',
        modifiers: [{ attribute: 'hp', op: 'Add', magnitude: -1 }],
    },
    // 技能3 AOE 伤害（瞬时）
    {
        id: 'ge_skill3_dmg',
        durationType: 'Instant',
        modifiers: [{ attribute: 'hp', op: 'Add', magnitude: -1 }],
    },
    // 硬直：持续 10 tick，挂 Stunned + BlockSkill + BlockMove
    {
        id: 'ge_hitstun_light',
        durationType: 'Duration',
        durationTicks: 10,
        grantedTags: [Tags.Stunned, Tags.BlockMove, Tags.BlockSkill],
        iconKey: 'buff_stun',
    },
    // 浮空：持续 20 tick
    {
        id: 'ge_knockup',
        durationType: 'Duration',
        durationTicks: 20,
        grantedTags: [Tags.Airborne, Tags.BlockSkill],
    },
    // 减速：持续 60 tick，移速降低 40%
    {
        id: 'ge_slow',
        durationType: 'Duration',
        durationTicks: 60,
        modifiers: [{ attribute: 'moveSpeed', op: 'Multiply', magnitude: -0.4 }],
        grantedTags: [Tags.Slowed],
        iconKey: 'buff_slow',
    },
    // 中毒：无限持续，每 10 tick 触发一次掉血
    {
        id: 'ge_poison',
        durationType: 'Infinite',
        periodicEffect: { intervalTicks: 10, geId: 'ge_poison_tick' },
        grantedTags: [Tags.Poisoned],
        iconKey: 'buff_poison',
    },
    {
        id: 'ge_poison_tick',
        durationType: 'Instant',
        modifiers: [{ attribute: 'hp', op: 'Add', magnitude: -5 }],
    },
    // 敌人普攻硬直
    {
        id: 'ge_enemy_hit',
        durationType: 'Instant',
        modifiers: [{ attribute: 'hp', op: 'Add', magnitude: -1 }],
    },
    // 轻度硬直（敌人普攻）
    {
        id: 'ge_hitstun_enemy',
        durationType: 'Duration',
        durationTicks: 8,
        grantedTags: [Tags.Stunned, Tags.BlockMove, Tags.BlockSkill],
    },
];

// ────────────────────────────────────────────────────────────
// GA 定义
// ────────────────────────────────────────────────────────────

const GA_SPECS: GameplayAbilitySpec[] = [
    // ── 玩家普攻三连击 ──
    {
        id: 'ga_normal_atk_1',
        costMp: 0,
        cooldownTicks: 0,
        activationOwnedTags: [Tags.AbilityActive],
        blockedTags: [Tags.Stunned],
        tasks: [
            { type: 'PlayAnimEvent', animationName: 'attack1', cueTags: [Cues.AttackSlash] },
            { type: 'WaitTicks', ticks: 4 },
            {
                type: 'SpawnHitbox',
                offsetX: 60, offsetY: 0,
                width: 80, height: 60,
                durationTicks: 3,
                onHitGeIds: ['ge_normal_atk_dmg'],
                knockbackX: 120, knockbackY: 0,
            },
            { type: 'WaitTicks', ticks: 6 },
        ],
        defaultAnimName: 'attack1',
    },
    {
        id: 'ga_normal_atk_2',
        costMp: 0,
        cooldownTicks: 0,
        activationOwnedTags: [Tags.AbilityActive],
        blockedTags: [Tags.Stunned],
        tasks: [
            { type: 'PlayAnimEvent', animationName: 'attack2', cueTags: [Cues.AttackSlash] },
            { type: 'WaitTicks', ticks: 4 },
            {
                type: 'SpawnHitbox',
                offsetX: 70, offsetY: 10,
                width: 90, height: 70,
                durationTicks: 3,
                onHitGeIds: ['ge_normal_atk_dmg'],
                knockbackX: 100, knockbackY: 0,
            },
            { type: 'WaitTicks', ticks: 5 },
        ],
        defaultAnimName: 'attack2',
    },
    {
        id: 'ga_normal_atk_3',
        costMp: 0,
        cooldownTicks: 0,
        activationOwnedTags: [Tags.AbilityActive],
        blockedTags: [Tags.Stunned],
        tasks: [
            { type: 'PlayAnimEvent', animationName: 'attack3', cueTags: [Cues.AttackHeavy] },
            { type: 'WaitTicks', ticks: 5 },
            {
                type: 'SpawnHitbox',
                offsetX: 80, offsetY: 0,
                width: 120, height: 80,
                durationTicks: 4,
                onHitGeIds: ['ge_normal_atk_dmg'],
                knockbackX: 200, knockbackY: 80,  // 第三段击飞
            },
            { type: 'WaitTicks', ticks: 8 },
        ],
        defaultAnimName: 'attack3',
    },

    // ── 技能1：冲刺斩（地面，消耗 20 MP） ──
    {
        id: 'ga_skill1_dash_slash',
        costMp: 20,
        cooldownTicks: 60,  // 3s CD
        requiredTags: [],
        blockedTags: [Tags.Airborne, Tags.Stunned, Tags.AbilityActive],
        activationOwnedTags: [Tags.AbilityActive, Tags.SuperArmor],
        tasks: [
            { type: 'PlayAnimEvent', animationName: 'skill1', cueTags: [Cues.Skill1Start] },
            { type: 'ApplyImpulse', forwardForce: 8, upwardForce: 0 },
            { type: 'WaitTicks', ticks: 5 },
            {
                type: 'SpawnHitbox',
                offsetX: 80, offsetY: 10,
                width: 140, height: 100,
                durationTicks: 5,
                onHitGeIds: ['ge_skill1_dmg'],
                knockbackX: 150, knockbackY: 60,
            },
            { type: 'WaitTicks', ticks: 10 },
        ],
        defaultAnimName: 'skill1',
    },

    // ── 技能2：减速领域（地面，消耗 30 MP） ──
    {
        id: 'ga_skill2_slow_field',
        costMp: 30,
        cooldownTicks: 80,  // 4s CD
        blockedTags: [Tags.Airborne, Tags.Stunned, Tags.AbilityActive],
        activationOwnedTags: [Tags.AbilityActive],
        tasks: [
            { type: 'PlayAnimEvent', animationName: 'skill2', cueTags: [Cues.Skill2Cast] },
            { type: 'WaitTicks', ticks: 6 },
            {
                type: 'SpawnHitbox',
                offsetX: 60, offsetY: 0,
                width: 160, height: 120,
                durationTicks: 6,
                onHitGeIds: ['ge_skill2_dmg', 'ge_slow'],
                knockbackX: 0, knockbackY: 0,
            },
            { type: 'WaitTicks', ticks: 8 },
        ],
        defaultAnimName: 'skill2',
    },

    // ── 技能3：爆发连斩（地面，消耗 50 MP） ──
    {
        id: 'ga_skill3_burst',
        costMp: 50,
        cooldownTicks: 120,  // 6s CD
        blockedTags: [Tags.Airborne, Tags.Stunned, Tags.AbilityActive],
        activationOwnedTags: [Tags.AbilityActive, Tags.SuperArmor],
        tasks: [
            { type: 'PlayAnimEvent', animationName: 'skill3_start', cueTags: [Cues.Skill3Start] },
            { type: 'WaitTicks', ticks: 3 },
            {
                type: 'SpawnHitbox',
                offsetX: 70, offsetY: 0,
                width: 180, height: 120,
                durationTicks: 4,
                onHitGeIds: ['ge_skill3_dmg'],
                knockbackX: 80, knockbackY: 160,  // 浮空效果
            },
            { type: 'WaitTicks', ticks: 6 },
            {
                type: 'SpawnHitbox',
                offsetX: 90, offsetY: 40,
                width: 200, height: 140,
                durationTicks: 4,
                onHitGeIds: ['ge_skill3_dmg'],
                knockbackX: 300, knockbackY: 0,
            },
            { type: 'PlayAnimEvent', animationName: 'skill3_end', cueTags: [Cues.Skill3End] },
            { type: 'WaitTicks', ticks: 12 },
        ],
        defaultAnimName: 'skill3_start',
    },

    // ── 敌人普攻 ──
    {
        id: 'ga_enemy_attack',
        costMp: 0,
        cooldownTicks: 40,  // 2s CD
        blockedTags: [Tags.Stunned, Tags.AbilityActive],
        activationOwnedTags: [Tags.AbilityActive],
        tasks: [
            { type: 'PlayAnimEvent', animationName: 'attack', cueTags: [Cues.EnemyAttack] },
            { type: 'WaitTicks', ticks: 8 },
            {
                type: 'SpawnHitbox',
                offsetX: 50, offsetY: 0,
                width: 80, height: 60,
                durationTicks: 3,
                onHitGeIds: ['ge_enemy_hit'],
                knockbackX: 80, knockbackY: 20,
            },
            { type: 'WaitTicks', ticks: 10 },
        ],
        defaultAnimName: 'attack',
    },
];

// ────────────────────────────────────────────────────────────
// 注册表接口
// ────────────────────────────────────────────────────────────

class GasRegistry {
    private readonly gaMap = new Map<string, GameplayAbilitySpec>();
    private readonly geMap = new Map<string, GameplayEffectSpec>();

    constructor(gaSpecs: GameplayAbilitySpec[], geSpecs: GameplayEffectSpec[]) {
        for (const spec of gaSpecs) this.gaMap.set(spec.id, spec);
        for (const spec of geSpecs) this.geMap.set(spec.id, spec);
    }

    getAbilitySpec(id: string): GameplayAbilitySpec {
        const spec = this.gaMap.get(id);
        if (!spec) throw new Error(`[GasRegistry] Unknown GA id: ${id}`);
        return spec;
    }

    getEffectSpec(id: string): GameplayEffectSpec {
        const spec = this.geMap.get(id);
        if (!spec) throw new Error(`[GasRegistry] Unknown GE id: ${id}`);
        return spec;
    }
}

export const gasRegistry = new GasRegistry(GA_SPECS, GE_SPECS);
