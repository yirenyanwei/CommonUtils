import { BattleEvent } from "../event/battle_event";
import { BattleCore } from "./battle_core";

export class BattleRunner {
    private accumulatedTime: number = 0;

    constructor(private readonly battleCore: BattleCore) { }

    update(deltaTime: number): BattleEvent[] {
        const events: BattleEvent[] = [];
        const fixedDeltaTime = 1 / this.battleCore.world.config.tickRate;
        this.accumulatedTime += deltaTime;

        while (this.accumulatedTime >= fixedDeltaTime && !this.battleCore.world.result.isFinished) {
            events.push(...this.battleCore.step());
            this.accumulatedTime -= fixedDeltaTime;
        }

        return events;
    }
}
