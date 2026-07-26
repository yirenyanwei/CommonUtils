import { BattleWorld } from './battle-world';
import { BattleDirector } from './battle-director';
import { InputCommandQueue } from '../command/input-command-queue';
import { InputCommand } from '../command/input-command';
import { BattleEvent } from '../event/battle-event';

// ============================================================
// BattleCore — 战斗入口门面
// 对外提供：enqueueInput / step / runUntilFinished
// ============================================================

export class BattleCore {
    readonly world: BattleWorld;
    private readonly director: BattleDirector;
    private readonly inputQueue: InputCommandQueue;

    constructor(
        world: BattleWorld,
        director: BattleDirector,
        inputQueue: InputCommandQueue,
    ) {
        this.world = world;
        this.director = director;
        this.inputQueue = inputQueue;
    }

    /** 收录一条输入指令（带 tick 时间戳） */
    enqueueInput(cmd: InputCommand): void {
        this.inputQueue.enqueue(cmd);
    }

    /**
     * 推进一个逻辑 tick。
     * 返回本 tick 产出的所有战斗事件。
     */
    step(): BattleEvent[] {
        if (this.world.result.isFinished) return [];

        const commands = this.inputQueue.dequeueForTick(this.world.tick);
        this.director.update(this.world, commands);
        this.world.tick++;

        return this.world.eventBus.drain();
    }

    /**
     * Headless 模式：一次性推进到战斗结束。
     * 用于服务器校验 / 离线回放。
     */
    runUntilFinished(maxTicks = this.world.gameConfig.maxTicks): BattleEvent[] {
        const all: BattleEvent[] = [];
        while (!this.world.result.isFinished && this.world.tick < maxTicks) {
            all.push(...this.step());
        }
        return all;
    }
}
