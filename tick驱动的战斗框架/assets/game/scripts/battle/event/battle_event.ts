import { BattleVector } from "../data/battle_config";

export enum BattleEventType {
    /** 单位被创建时触发，例如主角开局出生、波次刷怪、玩家放置塔。 */
    UNIT_SPAWNED = "UNIT_SPAWNED",
    /** 单位逻辑坐标变化时触发，View 层用它同步节点位置。 */
    UNIT_MOVED = "UNIT_MOVED",
    /** 单位受到伤害后触发，View 层可用它刷新血条或播放受击表现。 */
    UNIT_DAMAGED = "UNIT_DAMAGED",
    /** 单位生命归零且首次确认死亡时触发，View 层可销毁节点或播放死亡动画。 */
    UNIT_DIED = "UNIT_DIED",
    /** 投射物逻辑对象被创建时触发，例如塔攻击或技能释放生成子弹。 */
    PROJECTILE_SPAWNED = "PROJECTILE_SPAWNED",
    /** 投射物飞行位置变化时触发，View 层用它同步子弹节点位置。 */
    PROJECTILE_MOVED = "PROJECTILE_MOVED",
    /** 投射物命中目标时触发，View 层可播放命中特效并移除子弹表现。 */
    PROJECTILE_HIT = "PROJECTILE_HIT",
    /** 波次开始时触发，可用于 UI 提示或调试日志。 */
    WAVE_STARTED = "WAVE_STARTED",
    /** 波次刷怪完成且敌人清空时触发。 */
    WAVE_FINISHED = "WAVE_FINISHED",
    /** 回合开始时触发，通常发生在该回合第一波开始前。 */
    ROUND_STARTED = "ROUND_STARTED",
    /** 回合内所有波次结束时触发。 */
    ROUND_FINISHED = "ROUND_FINISHED",
    /** 战斗结束时触发，包含胜负和结束原因。 */
    BATTLE_FINISHED = "BATTLE_FINISHED",
}

export interface BattleEventBase {
    type: BattleEventType;
    tick: number;
}

export interface UnitSpawnedEvent extends BattleEventBase {
    type: BattleEventType.UNIT_SPAWNED;
    unitId: number;
    configId: string;
    position: BattleVector;
}

export interface UnitMovedEvent extends BattleEventBase {
    type: BattleEventType.UNIT_MOVED;
    unitId: number;
    position: BattleVector;
}

export interface UnitDamagedEvent extends BattleEventBase {
    type: BattleEventType.UNIT_DAMAGED;
    unitId: number;
    damage: number;
    hp: number;
    sourceUnitId: number;
}

export interface UnitDiedEvent extends BattleEventBase {
    type: BattleEventType.UNIT_DIED;
    unitId: number;
    killerUnitId: number;
}

export interface ProjectileSpawnedEvent extends BattleEventBase {
    type: BattleEventType.PROJECTILE_SPAWNED;
    projectileId: number;
    sourceUnitId: number;
    targetUnitId: number;
    position: BattleVector;
}

export interface ProjectileMovedEvent extends BattleEventBase {
    type: BattleEventType.PROJECTILE_MOVED;
    projectileId: number;
    position: BattleVector;
}

export interface ProjectileHitEvent extends BattleEventBase {
    type: BattleEventType.PROJECTILE_HIT;
    projectileId: number;
    sourceUnitId: number;
    targetUnitId: number;
}

export interface WaveStartedEvent extends BattleEventBase {
    type: BattleEventType.WAVE_STARTED;
    roundIndex: number;
    waveIndex: number;
    waveId: string;
}

export interface WaveFinishedEvent extends BattleEventBase {
    type: BattleEventType.WAVE_FINISHED;
    roundIndex: number;
    waveIndex: number;
    waveId: string;
}

export interface RoundStartedEvent extends BattleEventBase {
    type: BattleEventType.ROUND_STARTED;
    roundIndex: number;
    roundId: string;
}

export interface RoundFinishedEvent extends BattleEventBase {
    type: BattleEventType.ROUND_FINISHED;
    roundIndex: number;
    roundId: string;
}

export interface BattleFinishedEvent extends BattleEventBase {
    type: BattleEventType.BATTLE_FINISHED;
    isWin: boolean;
    reason: string;
}

export type BattleEvent =
    UnitSpawnedEvent |
    UnitMovedEvent |
    UnitDamagedEvent |
    UnitDiedEvent |
    ProjectileSpawnedEvent |
    ProjectileMovedEvent |
    ProjectileHitEvent |
    WaveStartedEvent |
    WaveFinishedEvent |
    RoundStartedEvent |
    RoundFinishedEvent |
    BattleFinishedEvent;
