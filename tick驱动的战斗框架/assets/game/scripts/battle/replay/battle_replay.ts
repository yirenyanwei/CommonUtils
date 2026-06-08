import { BattleCommand } from "../command/battle_command";
import { BattleResult, BattleStartParams } from "../data/battle_config";

export interface BattleReplay {
    startParams: BattleStartParams;
    commands: BattleCommand[];
    result: BattleResult;
}
