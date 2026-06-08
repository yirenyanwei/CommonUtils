import { BattleUnit } from "../unit/battle_unit";

export class TargetSelector {
    /**
     * 射程内最近敌人
     * @param attacker 
     * @param units 
     * @returns 
     */
    selectNearestEnemy(attacker: BattleUnit, units: readonly BattleUnit[]): BattleUnit | undefined {
        let selectedTarget: BattleUnit | undefined;
        let selectedDistance = Number.MAX_VALUE;

        for (const unit of units) {
            if (!unit.isAlive || unit.team === attacker.team) {
                continue;
            }

            const distance = this.getDistance(attacker, unit);
            if (distance <= attacker.stats.attackRange && distance < selectedDistance) {
                selectedTarget = unit;
                selectedDistance = distance;
            }
        }

        return selectedTarget;
    }

    getDistance(left: BattleUnit, right: BattleUnit): number {
        const deltaX = left.position.x - right.position.x;
        const deltaY = left.position.y - right.position.y;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }
}
