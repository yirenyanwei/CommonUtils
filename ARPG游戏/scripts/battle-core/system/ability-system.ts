import { BattleSystem, BattleSystemContext } from '../core/battle-director';
import { BattleWorld } from '../core/battle-world';
import { getCharacterConfig } from '../../data/sample-data';

// ============================================================
// AbilitySystem — 处理技能激活请求 & 推进执行中技能的 Task
// ============================================================

export class AbilitySystem implements BattleSystem {
    readonly name = 'AbilitySystem';

    update(world: BattleWorld, context: BattleSystemContext): void {
        const player = world.entityManager.getPlayer();
        if (!player || !player.isAlive) return;

        // 推进正在执行的技能（Player）
        if (player.asc.hasActiveAbility()) {
            player.asc.advanceActiveAbility(world);
            return;  // 技能进行中，不接受新的激活
        }

        // 技能槽激活（优先于普攻）
        if (context.skillSlot > 0) {
            const cfg = getCharacterConfig(player.configId);
            const abilityId = cfg.skillAbilityIds[context.skillSlot - 1];
            player.asc.tryActivateAbility(abilityId, world);
            return;
        }

        // 普攻（交给 ComboSystem 处理，这里只触发激活）
        if (context.attackRequested) {
            const cfg = getCharacterConfig(player.configId);
            const seg = cfg.comboConfig.segments[player.comboIndex];
            if (seg) {
                player.asc.tryActivateAbility(seg.abilityId, world);
            }
        }

        // 推进所有存活敌人的技能 Task
        for (const enemy of world.entityManager.getAliveByTeam('enemy')) {
            if (enemy.asc.hasActiveAbility()) {
                enemy.asc.advanceActiveAbility(world);
            }
        }
    }
}
