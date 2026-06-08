import { BattleCommand } from "../command/battle_command";

/** 单个 tick 内系统共享的上下文，用于传递命令和跨系统状态。 */
export class BattleSystemContext {
    /** 当前 tick 需要执行的命令，由 BattleCore 从命令队列取出。 */
    readonly commands: readonly BattleCommand[];
    /** 波次系统更新后的完成状态，胜负系统会根据它判断是否通关。 */
    isWaveComplete: boolean = false;

    constructor(commands: readonly BattleCommand[]) {
        this.commands = commands;
    }
}
