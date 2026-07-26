import { BattleSystem, BattleSystemContext } from '../core/battle-director';
import { BattleWorld } from '../core/battle-world';
import { BattleOutcome } from '../flow/battle-outcome';

// ============================================================
// BattleResultSystem — 每 tick 末尾检测胜负
// ============================================================

export class BattleResultSystem implements BattleSystem {
    readonly name = 'BattleResultSystem';

    constructor(private readonly outcome: BattleOutcome) {}

    update(world: BattleWorld, _context: BattleSystemContext): void {
        this.outcome.check(world.entityManager, world);
    }
}
