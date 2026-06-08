import { BattleWorld } from "../core/battle_world";
import { BattleSystem } from "./battle_system";
import { BattleSystemContext } from "./battle_system_context";

/** 更新投射物飞行、命中和伤害结算。 */
export class ProjectileSystem implements BattleSystem {
    readonly name: string = "ProjectileSystem";

    update(world: BattleWorld, context: BattleSystemContext): void {
        void context;
        world.projectileManager.update();
    }
}
