// 战斗逻辑使用的二维坐标。第一版直接使用浮点数，单位由具体战场表现约定。
export interface BattleVector {
    // 横向坐标。当前示例中敌人从较大的 x 向较小的 x 移动。
    x: number;
    // 纵向坐标，用于区分不同路线或站位。
    y: number;
}

// 战斗单位类型，用于区分同一个 BattleUnit 在玩法中的身份。
export enum BattleUnitType {
    // 主角单位，当前失败条件就是主角死亡。
    HERO = "HERO",
    // 敌方单位，由波次配置刷出。
    ENEMY = "ENEMY",
    // 玩家放置的防御塔，当前会自动攻击敌人。
    TOWER = "TOWER",
    // 友方扩展位，后续可用于队友、宠物、召唤物等。
    ALLY = "ALLY",
}

// 阵营定义，用于判断敌我关系、目标筛选和伤害归属。
export enum BattleTeam {
    // 玩家阵营，包括主角、防御塔、队友等。
    PLAYER = "PLAYER",
    // 敌方阵营，包括波次刷出的怪物。
    ENEMY = "ENEMY",
}

// 单位基础属性配置。这里是静态配置，运行时会包装成 UnitStats。
export interface UnitStatsConfig {
    // 最大生命值，单位创建时当前生命会初始化为该值。
    maxHp: number;
    // 基础攻击力，当前版本会作为投射物命中后的伤害值。
    attack: number;
    // 攻击射程，TargetSelector 会用它判断目标是否可攻击。
    attackRange: number;
    // 攻击间隔，单位下一次可攻击 tick 会按该值向后推。
    attackIntervalTicks: number;
    // 每个逻辑 tick 的移动速度。当前敌人会按该速度向左移动。
    moveSpeed: number;
    // 投射物每个逻辑 tick 的飞行速度。
    projectileSpeed: number;
}

// 单位静态配置。BattleWorld 创建单位时会根据 configId 查找该配置。
export interface UnitConfig {
    // 配置唯一 ID，例如 hero_001、enemy_001、tower_001。
    configId: string;
    // 单位类型，决定它在战斗中的身份和部分行为分支。
    unitType: BattleUnitType;
    // 单位阵营，用于目标筛选和敌我判断。
    team: BattleTeam;
    // 单位基础属性。
    stats: UnitStatsConfig;
}

// 一组刷怪配置，描述某个波次中某类敌人的出现规则。
export interface SpawnConfig {
    // 要刷出的单位配置 ID，必须能在 BattleConfig.unitConfigs 中找到。
    unitConfigId: string;
    // 总刷出数量。
    count: number;
    // 当前波开始后第几个 tick 开始刷第一只。
    startTick: number;
    // 同一组怪物之间的刷出间隔 tick。
    intervalTicks: number;
    // 刷怪位置。当前示例中通常在战场右侧。
    position: BattleVector;
}

// 波次配置。一个回合可以包含多个波次。
export interface WaveConfig {
    // 波次唯一 ID，用于事件、日志和调试。
    waveId: string;
    // 本波内的刷怪组列表。
    spawns: SpawnConfig[];
}

// 回合配置。一个战斗可以包含多个回合，每个回合包含多个波次。
export interface RoundConfig {
    // 回合唯一 ID，用于事件、日志和调试。
    roundId: string;
    // 当前回合包含的波次列表。
    waves: WaveConfig[];
}

// 单场战斗的完整静态配置。BattleCore 创建时会持有这份配置。
export interface BattleConfig {
    // 每秒推进的逻辑 tick 数，战斗逻辑只按这个固定频率运行。
    tickRate: number;
    // 单场战斗允许的最大 tick，超过后会触发超时失败。
    maxTicks: number;
    // 逻辑战场宽度，用于刷怪、移动、目标选择等逻辑坐标计算。
    fieldWidth: number;
    // 逻辑战场高度，用于刷怪、移动、目标选择等逻辑坐标计算。
    fieldHeight: number;
    // 开局自动创建的主角单位配置 ID，必须能在 unitConfigs 中找到。
    heroConfigId: string;
    // 本场战斗可使用的全部单位配置，包括主角、敌人、塔、队友等。
    unitConfigs: UnitConfig[];
    // 回合与波次配置，决定整场战斗的刷怪节奏和关卡流程。
    rounds: RoundConfig[];
}

// 单场战斗的开局参数。它和 BattleConfig 一起决定战斗初始状态。
export interface BattleStartParams {
    // 随机种子，后续有随机逻辑时用于保证同一输入可复现。
    seed: number;
    // 主角开局出生位置。
    heroPosition: BattleVector;
}

// 战斗最终结果。战斗未结束时也会保存在 BattleWorld.result 中。
export interface BattleResult {
    // 战斗是否已经结束。
    isFinished: boolean;
    // 战斗是否胜利。只有 isFinished 为 true 时才有明确意义。
    isWin: boolean;
    // 结束原因，例如 HERO_DEAD、ALL_WAVES_CLEARED、MAX_TICK_REACHED。
    reason: string;
    // 战斗结束时的 tick。
    tick: number;
}

// 复制坐标对象，避免事件或外部代码持有 BattleWorld 内部坐标引用。
export function cloneVector(vector: BattleVector): BattleVector {
    return { x: vector.x, y: vector.y };
}
