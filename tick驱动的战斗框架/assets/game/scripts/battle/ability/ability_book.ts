import { BattleWorld } from "../core/battle_world";
import { Ability } from "./ability";
import { AbilityContext } from "./ability_context";

export class AbilityBook {
    private readonly abilities = new Map<string, Ability>();

    constructor() {
        this.add(new Ability("basic_projectile"));
    }

    add(ability: Ability): void {
        this.abilities.set(ability.id, ability);
    }

    cast(world: BattleWorld, context: AbilityContext): boolean {
        const ability = this.abilities.get(context.abilityId);
        if (!ability) {
            return false;
        }

        return ability.cast(world, context);
    }
}
