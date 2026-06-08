import { BattleCommand } from "../command/battle_command";
import { BattleCommandQueue } from "../command/battle_command_queue";
import { BattleConfig, BattleStartParams } from "../data/battle_config";
import { BattleEvent } from "../event/battle_event";
import { BattleDirector } from "./battle_director";
import { BattleWorld } from "./battle_world";

export class BattleCore {
    readonly world: BattleWorld;

    private readonly commandQueue: BattleCommandQueue = new BattleCommandQueue();
    private readonly director: BattleDirector = new BattleDirector();

    constructor(config: BattleConfig, startParams: BattleStartParams) {
        this.world = new BattleWorld(config, startParams.seed);
        this.world.unitManager.spawnUnit(config.heroConfigId, startParams.heroPosition);
    }

    enqueueCommand(command: BattleCommand): void {
        this.commandQueue.enqueue(command);
    }

    /**
     * 每 tick 执行流程
     * @returns 
     */
    step(): BattleEvent[] {
        if (!this.world.result.isFinished) {
            // 每个 tick 只处理已经到时的命令，保证输入和逻辑推进可以被复盘。
            const commands = this.commandQueue.dequeueForTick(this.world.tick);
            this.director.update(this.world, commands);
            this.world.tick += 1;
        }

        // 逻辑层只把本 tick 发生的事实事件交出去，表现层稍后自行消费。
        return this.world.eventBus.drain();
    }

    runUntilFinished(maxTickCount: number = this.world.config.maxTicks): BattleEvent[] {
        const events: BattleEvent[] = [];

        while (!this.world.result.isFinished && this.world.tick < maxTickCount) {
            events.push(...this.step());
        }

        return events;
    }
}
