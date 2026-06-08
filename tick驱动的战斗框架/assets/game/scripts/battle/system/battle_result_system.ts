import { BattleWorld } from "../core/battle_world";
import { BattleSystem } from "./battle_system";
import { BattleSystemContext } from "./battle_system_context";

/** 检查当前 tick 是否已经满足胜利、失败或超时条件。 */
export class BattleResultSystem implements BattleSystem {
    readonly name: string = "BattleResultSystem";

    update(world: BattleWorld, context: BattleSystemContext): void {
        const hero = world.unitManager.getHero();
        if (!hero?.isAlive) {
            world.finish(false, "HERO_DEAD");
            return;
        }

        if (world.tick >= world.config.maxTicks) {
            world.finish(false, "MAX_TICK_REACHED");
            return;
        }

        if (context.isWaveComplete && world.unitManager.getEnemyCount() === 0) {
            world.finish(true, "ALL_WAVES_CLEARED");
        }
    }
}
