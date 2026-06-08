import { BattleCommand } from "../command/battle_command";
import { AutoAttackSystem } from "../system/auto_attack_system";
import { BattleResultSystem } from "../system/battle_result_system";
import { BattleSystem } from "../system/battle_system";
import { BattleSystemContext } from "../system/battle_system_context";
import { CommandSystem } from "../system/command_system";
import { ProjectileSystem } from "../system/projectile_system";
import { UnitSystem } from "../system/unit_system";
import { WaveSystem } from "../system/wave_system";
import { BattleWorld } from "./battle_world";

/** 管理固定 tick 的系统执行顺序，不直接承载具体战斗规则。 */
export class BattleDirector {
    private readonly systems: BattleSystem[] = [
        new CommandSystem(),
        new WaveSystem(),
        new UnitSystem(),
        new AutoAttackSystem(),
        new ProjectileSystem(),
        new BattleResultSystem(),
    ];

    update(world: BattleWorld, commands: readonly BattleCommand[]): void {
        if (world.result.isFinished) {
            return;
        }

        const context = new BattleSystemContext(commands);

        for (const system of this.systems) {
            system.update(world, context);
            if (world.result.isFinished) {
                break;
            }
        }
    }
}
