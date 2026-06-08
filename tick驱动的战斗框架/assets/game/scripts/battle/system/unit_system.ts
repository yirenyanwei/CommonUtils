import { BattleWorld } from "../core/battle_world";
import { UnitController } from "../unit/unit_controller";
import { BattleSystem } from "./battle_system";
import { BattleSystemContext } from "./battle_system_context";

/** 更新单位行为。当前主要负责敌人从右往左移动。 */
export class UnitSystem implements BattleSystem {
    readonly name: string = "UnitSystem";

    private readonly unitController: UnitController = new UnitController();

    update(world: BattleWorld, context: BattleSystemContext): void {
        // context 当前未使用，保留参数用于后续 AI 或状态系统读取共享信息。
        void context;

        // 稳定排序可以减少同一 tick 内遍历顺序变化带来的调试和复盘问题。
        const units = world.unitManager.getAliveUnits().sort((left, right) => left.id - right.id);

        for (const unit of units) {
            const oldX = unit.position.x;
            const oldY = unit.position.y;
            this.unitController.updateUnit(world, unit);

            if (unit.position.x !== oldX || unit.position.y !== oldY) {
                world.unitManager.markUnitMoved(unit);
            }
        }
    }
}
