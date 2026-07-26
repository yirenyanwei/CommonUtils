import { InputCommand } from '../command/input-command';
import { BattleEvent } from '../event/battle-event';

// ============================================================
// BattleRecord — 战斗录像数据（确定性回放的数据包）
// 记录 seed + 所有输入 + 关卡 id，
// 回放时喂给 BattleCore 可获得完全相同的结果。
// ============================================================

export interface BattleRecord {
    version: 1;
    stageId: string;
    seed: number;
    startTimestamp: number;
    /** 按 tick 排序的所有玩家输入 */
    commands: InputCommand[];
    /** 录制时顺便保存的事件流（可选，用于调试） */
    events?: BattleEvent[];
}

export class BattleRecorder {
    private readonly record: BattleRecord;

    constructor(stageId: string, seed: number) {
        this.record = {
            version: 1,
            stageId,
            seed,
            startTimestamp: Date.now(),
            commands: [],
        };
    }

    recordCommand(cmd: InputCommand): void {
        this.record.commands.push(cmd);
    }

    finish(events?: BattleEvent[]): BattleRecord {
        if (events) this.record.events = events;
        return this.record;
    }
}
