import { BattleWorld } from "../core/battle_world";
import { AbilityContext } from "./ability_context";

export class Ability {
    readonly id: string;

    constructor(id: string) {
        this.id = id;
    }

    cast(world: BattleWorld, context: AbilityContext): boolean {
        const caster = world.unitManager.getUnit(context.casterUnitId);
        if (!caster?.isAlive) {
            return false;
        }

        const target = context.targetUnitId !== undefined
            ? world.unitManager.getUnit(context.targetUnitId)
            : world.targetSelector.selectNearestEnemy(caster, world.unitManager.getUnits());

        if (!target?.isAlive) {
            return false;
        }

        world.projectileManager.spawnProjectile(caster, target);
        return true;
    }
}
