import { BattleTeam, BattleUnitType } from "../data/battle_config";
import { BattleWorld } from "../core/battle_world";
import { BattleUnit } from "../unit/battle_unit";
import { UnitController } from "../unit/unit_controller";
import { BattleSystem } from "./battle_system";
import { BattleSystemContext } from "./battle_system_context";

/** 处理塔等单位的自动攻击。 */
export class AutoAttackSystem implements BattleSystem {
    readonly name: string = "AutoAttackSystem";

    private readonly unitController: UnitController = new UnitController();

    update(world: BattleWorld, context: BattleSystemContext): void {
        void context;

        const attackers = world.unitManager.getAliveUnits()
            .filter((unit) => unit.team === BattleTeam.PLAYER && unit.unitType !== BattleUnitType.HERO)
            .sort((left, right) => left.id - right.id);

        for (const attacker of attackers) {
            this.tryAutoAttack(world, attacker);
        }
    }

    private tryAutoAttack(world: BattleWorld, attacker: BattleUnit): void {
        const target = world.targetSelector.selectNearestEnemy(attacker, world.unitManager.getUnits());
        if (!target || !this.unitController.canAttack(attacker, target, world.tick)) {
            return;
        }

        // 自动攻击只创建投射物，真正伤害在投射物命中时结算。
        world.projectileManager.spawnProjectile(attacker, target);
        attacker.nextAttackTick = world.tick + attacker.stats.attackIntervalTicks;
    }
}
