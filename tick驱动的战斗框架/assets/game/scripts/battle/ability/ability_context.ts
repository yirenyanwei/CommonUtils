import { BattleVector } from "../data/battle_config";

export interface AbilityContext {
    casterUnitId: number;
    abilityId: string;
    targetUnitId?: number;
    targetPosition?: BattleVector;
}
