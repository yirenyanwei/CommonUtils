import { BattleEvent } from './battle-event';

// ============================================================
// 战斗事件总线
// 逻辑层每 tick 把所有产出事件存入缓冲区，
// step() 末尾统一 drain 交给表现层消费。
// ============================================================

export class BattleEventBus {
    private readonly buffer: BattleEvent[] = [];

    emit(event: BattleEvent): void {
        this.buffer.push(event);
    }

    /** 取出并清空当前 tick 所有事件 */
    drain(): BattleEvent[] {
        return this.buffer.splice(0, this.buffer.length);
    }
}
