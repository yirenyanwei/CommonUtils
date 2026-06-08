import { BattleWorld } from "../core/battle_world";
import { WaveScheduler } from "../wave/wave_scheduler";
import { BattleSystem } from "./battle_system";
import { BattleSystemContext } from "./battle_system_context";

/** 推进回合、波次和刷怪节奏。 */
export class WaveSystem implements BattleSystem {
    readonly name: string = "WaveSystem";

    private readonly waveScheduler: WaveScheduler = new WaveScheduler();

    update(world: BattleWorld, context: BattleSystemContext): void {
        this.waveScheduler.update(world);
        context.isWaveComplete = this.waveScheduler.getIsComplete();
    }
}
