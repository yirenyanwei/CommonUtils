import { BattleTeam, BattleUnitType } from "../data/battle_config";
import { BattleWorld } from "../core/battle_world";
import { BattleUnit } from "./battle_unit";

export class UnitController {
    updateUnit(world: BattleWorld, unit: BattleUnit): void {
        if (!unit.isAlive) {
            return;
        }

        if (unit.unitType === BattleUnitType.ENEMY) {
            this.updateEnemy(world, unit);
        }
    }

    private updateEnemy(world: BattleWorld, unit: BattleUnit): void {
        const nextX = unit.position.x - unit.stats.moveSpeed;
        unit.position.x = Math.max(0, nextX);

        if (unit.position.x <= 0) {
            const hero = world.unitManager.getHero();
            if (hero?.isAlive) {
                hero.takeDamage(hero.stats.maxHp);
                world.unitManager.markUnitDamaged(hero, hero.stats.maxHp, unit.id);
            }
        }
    }

    canAttack(attacker: BattleUnit, target: BattleUnit, tick: number): boolean {
        if (attacker.team === target.team || !attacker.isAlive || !target.isAlive) {
            return false;
        }

        if (attacker.team !== BattleTeam.PLAYER) {
            return false;
        }

        return tick >= attacker.nextAttackTick;
    }
}
