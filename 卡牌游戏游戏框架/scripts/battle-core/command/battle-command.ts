/*
 * @Desc: 战斗指令类型。玩家的手动操作以"指令"形式喂给逻辑层，是交互式战斗可回放/可校验的关键
 */

/** 待结算的玩家指令（运行时排队用） */
export interface PendingCommand {
    skillId: string;
    /** 指定目标实例 id（单体技能用；群体/自身技能可不填） */
    targetId?: number;
}

/**
 * 已结算的玩家指令记录（录像/校验用）。
 * round 表示该指令"生效"于哪个回合开始时，是确定性的逻辑坐标（不是真实时间）。
 */
export interface PlayerCommandRecord {
    round: number;
    skillId: string;
    targetId?: number;
}
