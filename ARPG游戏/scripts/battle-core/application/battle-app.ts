import { GAME_CONFIG, STAGE_1 } from '../../data/sample-data';
import { BattleFactory } from '../flow/battle-factory';
import { BattleCore } from '../core/battle-core';
import { BattleRunner } from '../core/battle-runner';
import { BattleRecorder } from '../record/battle-record';
import { InputCommand } from '../command/input-command';
import { BattleEvent } from '../event/battle-event';

// ============================================================
// BattleApp — 战斗应用层（实时模式）
// View 层只持有 BattleApp，不直接持有 BattleCore / BattleWorld。
// ============================================================

export class BattleApp {
    readonly core: BattleCore;
    readonly runner: BattleRunner;
    readonly recorder: BattleRecorder;

    private readonly seed: number;

    constructor(seed?: number) {
        this.seed = seed ?? Math.floor(Math.random() * 0xFFFFFFFF);
        const factory = new BattleFactory();
        this.core = factory.create(GAME_CONFIG, STAGE_1, this.seed);
        this.runner = new BattleRunner(this.core);
        this.recorder = new BattleRecorder(STAGE_1.id, this.seed);
    }

    /** 玩家输入（由 View 层在渲染帧调用，带当前 tick 时间戳） */
    sendInput(cmd: InputCommand): void {
        this.core.enqueueInput(cmd);
        this.recorder.recordCommand(cmd);
    }

    /**
     * 渲染帧驱动（Cocos update(dt) 调用）。
     * 返回本帧内产出的所有 BattleEvent。
     */
    update(dt: number): BattleEvent[] {
        return this.runner.update(dt);
    }

    pause(): void {
        this.runner.paused = true;
    }

    resume(): void {
        this.runner.paused = false;
    }

    isFinished(): boolean {
        return this.core.world.result.isFinished;
    }

    getCurrentTick(): number {
        return this.core.world.tick;
    }
}
