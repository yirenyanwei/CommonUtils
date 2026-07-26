import { BattleSystem, BattleSystemContext } from '../core/battle-director';
import { BattleWorld } from '../core/battle-world';
import { getCharacterConfig } from '../../data/sample-data';

// ============================================================
// ComboSystem — 普攻连招段数推进 & 超时重置
// 技能激活后推进 comboIndex，
// 超出 comboCancelWindow 后重置至第一段
// ============================================================

export class ComboSystem implements BattleSystem {
    readonly name = 'ComboSystem';

    update(world: BattleWorld, context: BattleSystemContext): void {
        const player = world.entityManager.getPlayer();
        if (!player || !player.isAlive) return;

        const cfg = getCharacterConfig(player.configId);
        const comboConfig = cfg.comboConfig;

        // 普攻连招成功命中：推进段数（由攻击成功激活 GA 后触发）
        if (context.attackRequested && !player.asc.hasActiveAbility()) {
            // 在窗口期内可连击
            if (player.comboCancelTicks > 0) {
                player.comboIndex = (player.comboIndex + 1) % comboConfig.segments.length;
            }
            const seg = comboConfig.segments[player.comboIndex];
            player.comboCancelTicks = seg.cancelWindowTicks;
            player.comboResetTimer = 0;
        }

        // 取消窗口计时
        if (player.comboCancelTicks > 0) {
            player.comboCancelTicks--;
        }

        // 连招超时重置
        if (!player.asc.hasActiveAbility()) {
            player.comboResetTimer++;
            if (player.comboResetTimer >= comboConfig.resetTicks) {
                player.comboIndex = 0;
                player.comboResetTimer = 0;
            }
        }
    }
}
