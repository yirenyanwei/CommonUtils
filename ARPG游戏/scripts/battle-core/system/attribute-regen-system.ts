import { BattleSystem, BattleSystemContext } from '../core/battle-director';
import { BattleWorld } from '../core/battle-world';
import { BattleEventType } from '../event/battle-event';
import { getCharacterConfig } from '../../data/sample-data';

// ============================================================
// AttributeRegenSystem — MP 自然回复
// 每 tick 对所有存活实体按配置回 MP
// ============================================================

export class AttributeRegenSystem implements BattleSystem {
    readonly name = 'AttributeRegenSystem';

    update(world: BattleWorld, _context: BattleSystemContext): void {
        for (const entity of world.entityManager.getAllAlive()) {
            const cfg = getCharacterConfig(entity.configId);
            const regen = cfg.attributes.mpRegenPerTick;
            if (regen <= 0) continue;

            const before = entity.asc.attributes.getValue('mp');
            entity.asc.attributes.modifyCurrent('mp', regen);
            const after = entity.asc.attributes.getValue('mp');

            if (Math.floor(after) !== Math.floor(before)) {
                world.eventBus.emit({
                    type: BattleEventType.ATTRIBUTE_CHANGE,
                    tick: world.tick,
                    entityId: entity.id,
                    attribute: 'mp',
                    value: after,
                    maxValue: entity.asc.attributes.getValue('maxMp'),
                });
            }
        }
    }
}
