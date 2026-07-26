import { BattleRecord } from '../record/battle-record';
import { BattleCore } from '../core/battle-core';
import { BattleEvent } from '../event/battle-event';

// ============================================================
// BattleReplay — 离线回放工具
// 把 BattleRecord 的 commands 按 tick 喂给 BattleCore，
// 确定性重现整场战斗，供调试 / 录像 / 服务器校验。
// ============================================================

export class BattleReplay {
    replay(record: BattleRecord, core: BattleCore): BattleEvent[] {
        // 将所有录制指令注入队列
        for (const cmd of record.commands) {
            core.enqueueInput(cmd);
        }
        // Headless 跑完
        return core.runUntilFinished();
    }
}
