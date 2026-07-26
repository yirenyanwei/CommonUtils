import { BattleSystem, BattleSystemContext } from '../core/battle-director';
import { BattleWorld } from '../core/battle-world';

// ============================================================
// TagTickSystem — 每 tick 维护所有实体的 Tag 相关状态
// 目前包括 GE 生命周期和 Ability CD 倒计时。
// 优先于 AbilitySystem 执行，保证同 tick 内状态最新。
// ============================================================

export class TagTickSystem implements BattleSystem {
    readonly name = 'TagTickSystem';

    update(world: BattleWorld, _context: BattleSystemContext): void {
        for (const entity of world.entityManager.getAllAlive()) {
            entity.asc.tickActiveEffects(world);
            entity.asc.tickAbilityCooldowns();
        }
    }
}
