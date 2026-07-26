import { BattleCore } from './battle-core';
import { BattleEvent } from '../event/battle-event';
import { FIXED_DT } from './fixed-tick';

// ============================================================
// BattleRunner — 实时模式的 tick 累加器
// Cocos 渲染帧率 (60fps) ≠ 逻辑 tick 率 (20/s)
// Runner 把 deltaTime 累加，达到 FIXED_DT 时推进一次 step()
// ============================================================

export class BattleRunner {
    private accumulated = 0;
    paused = false;

    constructor(private readonly core: BattleCore) {}

    /**
     * 每渲染帧调用。
     * @param deltaTime 距上帧的秒数（来自 Cocos update(dt)）
     * @returns 本次推进产出的所有战斗事件
     */
    update(deltaTime: number): BattleEvent[] {
        if (this.paused || this.core.world.result.isFinished) return [];

        const events: BattleEvent[] = [];
        this.accumulated += deltaTime;

        while (this.accumulated >= FIXED_DT && !this.core.world.result.isFinished) {
            events.push(...this.core.step());
            this.accumulated -= FIXED_DT;
        }

        return events;
    }

    reset(): void {
        this.accumulated = 0;
        this.paused = false;
    }
}
