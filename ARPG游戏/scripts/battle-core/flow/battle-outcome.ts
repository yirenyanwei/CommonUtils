import { EntityManager } from '../manager/entity-manager';
import { BattleWorld } from '../core/battle-world';

// ============================================================
// BattleOutcome — 胜负判定（由 BattleResultSystem 每 tick 调用）
// ============================================================

export class BattleOutcome {
    check(entityManager: EntityManager, world: BattleWorld): void {
        if (world.result.isFinished) return;

        const player = entityManager.getPlayer();
        if (!player || !player.isAlive) {
            world.finish('lose');
            return;
        }

        const aliveEnemies = entityManager.getAliveByTeam('enemy');
        if (aliveEnemies.length === 0) {
            world.finish('win');
        }
    }
}
