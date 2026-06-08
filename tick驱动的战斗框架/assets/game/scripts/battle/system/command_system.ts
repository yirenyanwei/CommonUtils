import { AbilityBook } from "../ability/ability_book";
import { BattleCommandType } from "../command/battle_command";
import { BattleWorld } from "../core/battle_world";
import { BattleSystem } from "./battle_system";
import { BattleSystemContext } from "./battle_system_context";

/** 执行外部输入命令，例如放塔和释放技能。 */
export class CommandSystem implements BattleSystem {
    readonly name: string = "CommandSystem";

    private readonly abilityBook: AbilityBook = new AbilityBook();

    update(world: BattleWorld, context: BattleSystemContext): void {
        for (const command of context.commands) {
            switch (command.type) {
                case BattleCommandType.PLACE_TOWER:
                    world.unitManager.spawnUnit(command.towerConfigId, command.position);
                    break;
                case BattleCommandType.CAST_ABILITY:
                    this.abilityBook.cast(world, {
                        casterUnitId: command.casterUnitId,
                        abilityId: command.abilityId,
                        targetUnitId: command.targetUnitId,
                        targetPosition: command.targetPosition,
                    });
                    break;
                default:
                    break;
            }
        }
    }
}
