import { BattleWorld } from "../core/battle_world";
import { BattleSystemContext } from "./battle_system_context";

/** BattleDirector 调度的系统接口。每个系统只处理一个明确的战斗阶段。 */
export interface BattleSystem {
    /** 系统名称，用于调试和日志定位。 */
    readonly name: string;

    /** 执行当前 tick 的系统逻辑。 */
    update(world: BattleWorld, context: BattleSystemContext): void;
}
