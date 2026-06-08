import { BattleWorld } from "../core/battle_world";

export class BattleHash {
    static createDebugHash(world: BattleWorld): string {
        const unitState = world.unitManager.getUnits()
            .map((unit) => `${unit.id}:${unit.configId}:${unit.hp}:${unit.position.x.toFixed(2)}:${unit.position.y.toFixed(2)}`)
            .join("|");

        return `${world.tick}#${unitState}`;
    }
}
