import { BattleVector } from "../data/battle_config";

/** 战斗命令类型。命令表示“外部希望战斗发生的操作”。 */
export enum BattleCommandType {
    /** 放置防御塔。 */
    PLACE_TOWER = "PLACE_TOWER",
    /** 释放技能。 */
    CAST_ABILITY = "CAST_ABILITY",
}

/** 战斗命令公共字段。所有会影响战斗结果的外部输入都应该带上这些信息。 */
export interface BattleCommandBase {
    /** 命令类型，用于 BattleDirector 分发执行逻辑。 */
    type: BattleCommandType;
    /** 目标执行 tick。BattleCore 只会在指定 tick 到达后处理命令。 */
    tick: number;
    /** 同一个 tick 内的命令排序号，用于保证执行顺序稳定。 */
    sequence: number;
}

/** 放置防御塔命令。 */
export interface PlaceTowerCommand extends BattleCommandBase {
    type: BattleCommandType.PLACE_TOWER;
    /** 要放置的塔配置 ID，必须能在 BattleConfig.unitConfigs 中找到。 */
    towerConfigId: string;
    /** 塔的逻辑放置位置。 */
    position: BattleVector;
}

/** 释放技能命令。 */
export interface CastAbilityCommand extends BattleCommandBase {
    type: BattleCommandType.CAST_ABILITY;
    /** 释放技能的单位 ID，例如主角或某个友方单位。 */
    casterUnitId: number;
    /** 技能 ID，例如 basic_projectile。 */
    abilityId: string;
    /** 目标位置。用于范围技能、指向地面的技能等。 */
    targetPosition?: BattleVector;
    /** 目标单位 ID。用于锁定某个单位释放技能。 */
    targetUnitId?: number;
}

/** 当前战斗系统支持的所有命令联合类型。 */
export type BattleCommand = PlaceTowerCommand | CastAbilityCommand;
