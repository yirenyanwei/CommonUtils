// ============================================================
// 全部配置结构定义（单一事实来源）
// 运行时只读，禁止修改
// ============================================================

// ────────────────────────────────────────────────────────────
// 基础工具类型
// ────────────────────────────────────────────────────────────

export interface Vec2 {
    x: number;
    y: number;
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

// ────────────────────────────────────────────────────────────
// GameplayTag
// 层次化状态标签，用句点分隔，如 "State.Airborne"
// ────────────────────────────────────────────────────────────

export const Tags = {
    // 运动状态
    Airborne: 'State.Airborne',       // 空中（受击浮空/跳跃）
    Grounded: 'State.Grounded',       // 地面
    Stunned: 'State.Stunned',         // 硬直，不可行动
    Invincible: 'State.Invincible',   // 无敌帧
    SuperArmor: 'State.SuperArmor',   // 霸体：受击不中断

    // 技能释放阻止条件（blockedTags 用）
    BlockSkill: 'Block.Skill',        // 阻止主动技能
    BlockMove: 'Block.Move',          // 阻止移动

    // 效果标记
    Poisoned: 'Debuff.Poisoned',      // 中毒
    Slowed: 'Debuff.Slowed',          // 减速
    Burning: 'Debuff.Burning',        // 燃烧

    // 技能激活中标记（防止重复激活）
    AbilityActive: 'Ability.Active',
} as const;

export type KnownGameplayTag = typeof Tags[keyof typeof Tags];
export type GameplayTag = KnownGameplayTag | string;

// ────────────────────────────────────────────────────────────
// GameplayCue
// 表现层事件标签，逻辑层只 emit，View 层负责播放特效/音效/震屏
// ────────────────────────────────────────────────────────────

export const Cues = {
    // 普攻
    AttackSlash: 'Cue.Attack.Slash',   // 普攻 1/2 段斩击特效
    AttackHeavy: 'Cue.Attack.Heavy',   // 普攻第 3 段重击特效
    // 玩家技能
    Skill1Start: 'Cue.Skill1.Start',   // 技能1 冲刺斩起手
    Skill2Cast: 'Cue.Skill2.Cast',     // 技能2 减速领域施法
    Skill3Start: 'Cue.Skill3.Start',   // 技能3 爆发连斩起手
    Skill3End: 'Cue.Skill3.End',       // 技能3 爆发连斩收招
    // 敌人 / 通用
    EnemyAttack: 'Cue.Enemy.Attack',   // 敌人普攻
    Hit: 'Cue.Hit',                    // 受击闪白（DamagePipeline 发出）
} as const;

export type KnownGameplayCue = typeof Cues[keyof typeof Cues];
export type GameplayCue = KnownGameplayCue | string;

// ────────────────────────────────────────────────────────────
// Attribute
// ────────────────────────────────────────────────────────────

export type AttributeName = 'hp' | 'maxHp' | 'mp' | 'maxMp' | 'atk' | 'def' | 'moveSpeed';

// ────────────────────────────────────────────────────────────
// GameplayEffect（GE）配置
// ────────────────────────────────────────────────────────────

/** GE 持续类型：Instant=立即生效；Duration=持续指定 tick；Infinite=无限持续直到主动移除 */
export type GEDurationType = 'Instant' | 'Duration' | 'Infinite';
/** 属性修改方式：Add=加减固定值；Multiply=按基础值增减百分比；Override=覆盖为指定值 */
export type EffectModifierOp = 'Add' | 'Multiply' | 'Override';

export interface EffectModifierConfig {
    /** 要修改的属性，如 hp、moveSpeed、atk */
    attribute: AttributeName;
    /** 修改方式：Add / Multiply / Override，见 EffectModifierOp */
    op: EffectModifierOp;
    /** 修改幅度；Add=固定增减，Multiply=按 base 的百分比，Override=覆盖为目标值 */
    magnitude: number;
}

export interface PeriodicEffectConfig {
    /** 每隔多少 tick 触发一次 */
    intervalTicks: number;
    /** 触发时应用的子 GE id */
    geId: string;
}

export interface GameplayEffectSpec {
    /** GE 唯一 id，供 gasRegistry 查询和配置引用 */
    id: string;
    /** 持续类型：Instant / Duration / Infinite */
    durationType: GEDurationType;
    /** Duration 类型的持续 tick 数；Instant / Infinite 通常不填 */
    durationTicks?: number;
    /** 属性修改列表，例如扣血、加攻击、减速 */
    modifiers?: EffectModifierConfig[];
    /** GE 生效期间附加到目标的 Tag，到期或移除 GE 时会自动移除 */
    grantedTags?: GameplayTag[];
    /** 持有此 GE 期间获得的免疫 Tag；用于后续扩展“免疫某类效果” */
    immunityTags?: GameplayTag[];
    /** 周期效果配置，例如中毒每隔若干 tick 触发一次掉血 GE */
    periodicEffect?: PeriodicEffectConfig;
    /** UI 图标标识；View 层可根据它显示 Buff/Debuff 图标 */
    iconKey?: string;
}

// ────────────────────────────────────────────────────────────
// AbilityTask 配置（技能内的多 tick 子步骤）
// ────────────────────────────────────────────────────────────

/**
 * AbilityTask 类型。
 * Task 是 GA 内部的时间线步骤，由 ASC 在每个 tick 按顺序推进：
 * - WaitTicks：等待若干 tick
 * - SpawnHitbox：生成攻击判定框
 * - ApplyGameplayEffect：施加 GE（Buff/Debuff/状态）
 * - ApplyImpulse：给施法者施加位移冲量
 * - PlayAnimEvent：向 View 发送动画/特效事件
 */
export type AbilityTaskType =
    | 'WaitTicks'
    | 'SpawnHitbox'
    | 'ApplyGameplayEffect'
    | 'ApplyImpulse'
    | 'PlayAnimEvent';

/** 等待若干 tick */
export interface WaitTicksTaskConfig {
    type: 'WaitTicks';
    ticks: number;
}

/** 在角色面向方向生成攻击判定框 */
export interface SpawnHitboxTaskConfig {
    type: 'SpawnHitbox';
    /** 相对施法者中心的偏移（x 为面向方向，正 = 前方） */
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    /** 判定框存在的 tick 数 */
    durationTicks: number;
    /** 命中时施加的 GE id 列表；Instant 伤害 GE 仅占位，实际扣血由 DamageResolver 计算 */
    onHitGeIds: string[];
    /** 命中时的击退 impulse（面向方向） */
    knockbackX?: number;
    knockbackY?: number;
    /** 判定框能否重复命中同一目标（默认每次激活只命中一次） */
    canHitMultipleTimes?: boolean;
}

/** 对自身施加 GE */
export interface ApplyGETaskConfig {
    type: 'ApplyGameplayEffect';
    geId: string;
    /** 目前仅支持 self；命中目标 GE 请配置在 SpawnHitbox.onHitGeIds */
    target: 'self';
}

/** 施加物理冲量（击退/跳跃式位移） */
export interface ApplyImpulseTaskConfig {
    type: 'ApplyImpulse';
    /** 面向方向倍率，正 = 前进，负 = 后退 */
    forwardForce: number;
    upwardForce: number;
}

/** 播放动画/特效事件（只写 GameplayCue，View 负责执行） */
export interface PlayAnimEventTaskConfig {
    /** Task 类型标识，task-builder 根据它创建 PlayAnimEventTask */
    type: 'PlayAnimEvent';
    /** 要播放的动画名；逻辑层只通过事件发出，实际 Spine 播放由 View 层处理 */
    animationName: string;
    /** 伴随动画触发的 Cue 标签，例如特效、音效、震屏等表现事件 */
    cueTags?: GameplayCue[];
}

export type AbilityTaskConfig =
    | WaitTicksTaskConfig
    | SpawnHitboxTaskConfig
    | ApplyGETaskConfig
    | ApplyImpulseTaskConfig
    | PlayAnimEventTaskConfig;

// ────────────────────────────────────────────────────────────
// GameplayAbility（GA）配置
// ────────────────────────────────────────────────────────────

export interface GameplayAbilitySpec {
    id: string;
    /** MP 消耗 */
    costMp: number;
    /** CD tick 数 */
    cooldownTicks: number;
    /** 激活所需 Tag（必须全部持有） */
    requiredTags?: GameplayTag[];
    /** 激活阻止 Tag（持有任意一个则无法激活） */
    blockedTags?: GameplayTag[];
    /** 激活后自身附加的 Tag（技能进行中标记，结束时移除） */
    activationOwnedTags?: GameplayTag[];
    /** 任务序列（按序执行） */
    tasks: AbilityTaskConfig[];
    /** 对应 Spine 动画名（发送到 View 的 PlayAnimEvent 默认值） */
    defaultAnimName?: string;
}

// ────────────────────────────────────────────────────────────
// 普攻连击配置（独立于 AbilitySpec，方便单独配置多段）
// ────────────────────────────────────────────────────────────

export interface ComboSegmentConfig {
    /** 对应的 GA id */
    abilityId: string;
    /** 此段打出后可取消进入下一段的窗口 tick 数 */
    cancelWindowTicks: number;
}

export interface ComboConfig {
    segments: ComboSegmentConfig[];
    /** 超出窗口后重置到第一段的等待 tick */
    resetTicks: number;
}

// ────────────────────────────────────────────────────────────
// 角色（玩家 / 敌人）配置
// ────────────────────────────────────────────────────────────

export interface AttributeSetConfig {
    maxHp: number;
    maxMp: number;
    atk: number;
    def: number;
    moveSpeed: number;
    /** MP 自然回复（每 tick） */
    mpRegenPerTick: number;
}

export interface CharacterConfig {
    id: string;
    name: string;
    attributes: AttributeSetConfig;
    /** 普攻连击配置 */
    comboConfig: ComboConfig;
    /** 主动技能 GA id 列表（对应技能槽 1/2/3） */
    skillAbilityIds: [string, string, string];
    /** Spine 骨骼动画资源 key */
    spineKey?: string;
    /** Hurtbox 相对角色逻辑位置（脚底中心点）的尺寸与 Y 偏移 */
    hurtbox: { width: number; height: number; offsetY: number };
}

// ────────────────────────────────────────────────────────────
// 敌人额外 AI 配置
// ────────────────────────────────────────────────────────────

export interface EnemyConfig extends CharacterConfig {
    /** 发现玩家距离 */
    detectRange: number;
    /** 发动攻击距离 */
    attackRange: number;
    /** 移动速度（追击时） */
    chaseSpeed: number;
}

// ────────────────────────────────────────────────────────────
// 关卡配置
// ────────────────────────────────────────────────────────────

export interface EnemySpawnEntry {
    configId: string;
    x: number;
    y: number;
}

export interface StageConfig {
    id: string;
    /** 房间边界（逻辑坐标，实体不可越界） */
    roomBounds: Rect;
    /** 地面 Y 坐标 */
    groundY: number;
    /** 玩家出生点 */
    playerSpawn: Vec2;
    /** 敌人固定摆放列表 */
    enemies: EnemySpawnEntry[];
    /** 使用的玩家角色 id */
    playerConfigId: string;
}

// ────────────────────────────────────────────────────────────
// 全局游戏配置
// ────────────────────────────────────────────────────────────

export interface GameConfig {
    tickRate: number;          // 逻辑 tick/s，默认 20
    gravity: number;           // 重力加速度（逻辑单位/tick²）
    jumpImpulse: number;       // 起跳初速度（逻辑单位/tick）
    baseCritRate: number;      // 基础暴击率 0~1
    critMultiplier: number;    // 暴击倍率，默认 1.5
    knockUpThreshold: number;  // 击退力超过此值触发浮空
    maxTicks: number;          // 单场最大 tick 数（防死循环）
}

// ────────────────────────────────────────────────────────────
// 视觉表现配置（View 专用，逻辑层不读）
// ────────────────────────────────────────────────────────────

export interface GameplayCueConfig {
    /** cueTag → 特效/音效/震屏描述 */
    tag: GameplayCue;
    vfxKey?: string;
    sfxKey?: string;
    screenShake?: boolean;
}
