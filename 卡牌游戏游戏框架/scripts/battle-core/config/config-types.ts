/*
 * @Desc: 战斗配置与运行时共用的数据类型定义（纯数据，零 cc 依赖）
 */

/** 阵营 */
export enum Camp {
    ALLY = 'ALLY',
    ENEMY = 'ENEMY',
}

/** 技能/效果的目标选择方式 */
export enum TargetType {
    /** 自身 */
    SELF = 'SELF',
    /** 随机一个敌方存活武将（玩家主动单体技能默认行为） */
    SINGLE_ENEMY = 'SINGLE_ENEMY',
    /** 全体敌方存活武将（AOE） */
    ALL_ENEMY = 'ALL_ENEMY',
    /** 随机一个敌方存活武将 */
    RANDOM_ENEMY = 'RANDOM_ENEMY',
    /** 敌方当前血量最低的存活武将（斩杀/追打首选） */
    LOWEST_HP_ENEMY = 'LOWEST_HP_ENEMY',
    /** 敌方站位最靠前（position 最小）的存活武将（普攻默认行为） */
    FRONT_ENEMY = 'FRONT_ENEMY',
    /** 随机一个友方存活武将 */
    SINGLE_ALLY = 'SINGLE_ALLY',
    /** 全体友方存活武将（群体治疗/增益） */
    ALL_ALLY = 'ALL_ALLY',
    /** 友方当前血量最低的存活武将（精准治疗首选） */
    LOWEST_HP_ALLY = 'LOWEST_HP_ALLY',
}

/** 原子效果类型，新增玩法时在此扩展并注册对应处理器 */
export enum EffectType {
    DAMAGE = 'DAMAGE',
    HEAL = 'HEAL',
    ADD_BUFF = 'ADD_BUFF',
}

/** 可被 Buff 修正的属性 */
export enum AttributeType {
    MAX_HP = 'MAX_HP',
    ATK = 'ATK',
    DEF = 'DEF',
    SPEED = 'SPEED',
}

/** Buff 增益/减益分类 */
export enum BuffCategory {
    BUFF = 'BUFF',
    DEBUFF = 'DEBUFF',
}

/** 同名 Buff 再次施加时的叠加规则（见 BuffManager.add） */
export enum BuffStackType {
    /** 刷新：已有同名 Buff 时不叠层，只重置剩余回合数（如眩晕、破甲） */
    REFRESH = 'REFRESH',
    /** 叠层：已有同名 Buff 时层数 +1（不超过 maxStacks），并重置剩余回合数（如中毒） */
    STACK = 'STACK',
    /** 独立：每次施加都新建一个实例，可并存多个同名 Buff（如不同来源的同名 debuff） */
    INDEPENDENT = 'INDEPENDENT',
}

/**
 * 战斗事件类型。Buff/被动通过 BattleEventBus.on(type, listener) 监听这些事件触发效果。
 * 新增被动机制时，在此添加新事件并在对应逻辑处 emit 即可，无需改动其他模块。
 */
export enum BattleEventType {
    /** 整场战斗开始（在 begin() 中触发，早于第一回合） */
    BATTLE_START = 'BATTLE_START',
    /** 每回合开始（能量恢复、玩家指令结算之后，武将出手之前） */
    ROUND_START = 'ROUND_START',
    /** 某武将本回合轮到出手（Buff 触发类如中毒在此时机结算） */
    TURN_START = 'TURN_START',
    /** 武将即将发起攻击（技能/效果执行前，可用于"先手拦截"类被动） */
    BEFORE_ATTACK = 'BEFORE_ATTACK',
    /** 伤害即将落地（护盾/减伤生效前，可用于"伤害修正"类被动） */
    BEFORE_DAMAGE = 'BEFORE_DAMAGE',
    /** 伤害已落地（可用于"受击反击""吸血"等命中后触发的被动） */
    AFTER_DAMAGE = 'AFTER_DAMAGE',
    /** 治疗已落地（可用于"治疗溢出转护盾"等被动） */
    AFTER_HEAL = 'AFTER_HEAL',
    /** 某武将身上新增了 Buff（可用于"获得增益时触发"类被动） */
    BUFF_ADDED = 'BUFF_ADDED',
    /** 某武将阵亡（可用于"友军死亡时暴走""亡语"类被动） */
    HERO_DEAD = 'HERO_DEAD',
    /** 某武将本回合行动结束 */
    TURN_END = 'TURN_END',
    /** 整个回合所有武将出手完毕 */
    ROUND_END = 'ROUND_END',
    /** 整场战斗结束（胜负已定） */
    BATTLE_END = 'BATTLE_END',
}

/** 战斗结果 */
export enum BattleResult {
    ALLY_WIN = 'ALLY_WIN',
    ENEMY_WIN = 'ENEMY_WIN',
    DRAW = 'DRAW',
}

/** 属性修正器（Buff 用） */
export interface AttributeModifier {
    attribute: AttributeType;
    value: number;
    /** true 为百分比修正，false 为固定值修正 */
    isPercent: boolean;
}

/** 单个原子效果配置 */
export interface EffectConfig {
    type: EffectType;
    /** 伤害/治疗：基于施法者攻击力的倍率 */
    multiplier?: number;
    /** 伤害/治疗：附加固定值 */
    fixed?: number;
    /** 是否可暴击 */
    canCrit?: boolean;
    /** 真实伤害：无视防御与增减伤修正 */
    trueDamage?: boolean;
    /** ADD_BUFF：要施加的 Buff id */
    buffId?: string;
    /** ADD_BUFF：施加层数 */
    stacks?: number;
    /** 覆盖技能默认目标（不填则沿用技能目标） */
    targetType?: TargetType;
}

/** 技能配置 */
export interface SkillConfig {
    id: string;
    name: string;
    targetType: TargetType;
    /** 释放所需能量；0 表示普攻 */
    energyCost: number;
    /** 是否为大招 */
    isUltimate: boolean;
    /** 普攻命中后回复的能量 */
    energyGain?: number;
    effects: EffectConfig[];
    description?: string;
}

/** Buff 配置 */
export interface BuffConfig {
    id: string;
    name: string;
    category: BuffCategory;
    /** 持续回合数 */
    duration: number;
    /** 最大叠加层数 */
    maxStacks: number;
    stackType: BuffStackType;
    /** 属性修正（每层叠加生效） */
    attributeModifiers?: AttributeModifier[];
    /** 触发时机（如每回合开始） */
    triggerTiming?: BattleEventType;
    /** 触发时执行的效果（如中毒掉血） */
    triggerEffects?: EffectConfig[];
    /** 是否为控制类，拥有时无法行动 */
    preventAction?: boolean;

    // ---- 战斗结算管线修正（均可选，按 Buff 层数生效）----
    /** 攻方：造成伤害增减百分比（增伤 +，减伤 -） */
    damageDealtPercent?: number;
    /** 受方：受到伤害增减百分比（易伤 +，减伤 -） */
    damageTakenPercent?: number;
    /** 攻方：暴击率加成 */
    critChanceBonus?: number;
    /** 攻方：吸血百分比（按对目标造成的实际伤害） */
    lifestealPercent?: number;
    /** 受方：反伤百分比（按受到的实际伤害反弹给攻方） */
    reflectPercent?: number;
    /** 受方：护盾吸收量（按实例存量消耗，不随层数翻倍） */
    shield?: number;
    /** 受方：受到治疗增减百分比 */
    healingTakenPercent?: number;
    /** 受方：免死（致死伤害保留 1 血并消耗该 Buff） */
    preventDeath?: boolean;

    description?: string;
}

/** 武将配置 */
export interface HeroConfig {
    id: string;
    name: string;
    maxHp: number;
    atk: number;
    def: number;
    speed: number;
    maxEnergy: number;
    initialEnergy?: number;
    /** 引用的技能 id 列表（约定首个为普攻，含大招） */
    skillIds: string[];
}

/** 队伍成员摆放 */
export interface TeamMemberSetup {
    configId: string;
    /** 站位 1-5 */
    position: number;
}

/** 一场战斗的初始设置（逻辑层的唯一输入，配合种子保证确定性） */
export interface BattleSetup {
    seed: number;
    ally: TeamMemberSetup[];
    enemy: TeamMemberSetup[];
    /** 我方独立于武将之外的主动技能 id 列表 */
    playerActiveSkillIds?: string[];
    /** 我方主动技能能量上限 */
    playerMaxEnergy?: number;
    /** 每回合恢复的我方主动技能能量 */
    playerEnergyPerRound?: number;
}

/** 全部静态配置表 */
export interface GameConfig {
    heroes: Record<string, HeroConfig>;
    skills: Record<string, SkillConfig>;
    buffs: Record<string, BuffConfig>;
}
