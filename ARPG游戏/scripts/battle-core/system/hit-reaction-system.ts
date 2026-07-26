import { BattleSystem, BattleSystemContext } from '../core/battle-director';
import { BattleWorld } from '../core/battle-world';

// ============================================================
// HitReactionSystem — 处理连击数（命中计数）
// 实际受击反应（硬直/击飞）已在 DamagePipeline 内处理，
// 此处专注于维护 UI 显示的连击数。
// ============================================================

export class HitReactionSystem implements BattleSystem {
    readonly name = 'HitReactionSystem';

    private comboCount = 0;
    private comboResetTimer = 0;
    private readonly COMBO_RESET_TICKS = 60;

    update(world: BattleWorld, context: BattleSystemContext): void {
        if (context.hitResults.length > 0) {
            this.comboCount += context.hitResults.length;
            this.comboResetTimer = 0;

            world.eventBus.emit({
                type: 'COMBO_CHANGED' as any,
                tick: world.tick,
                entityId: 'combo',
                count: this.comboCount,
            });
        } else {
            this.comboResetTimer++;
            if (this.comboResetTimer >= this.COMBO_RESET_TICKS && this.comboCount > 0) {
                this.comboCount = 0;
                world.eventBus.emit({
                    type: 'COMBO_CHANGED' as any,
                    tick: world.tick,
                    entityId: 'combo',
                    count: 0,
                });
            }
        }
    }
}
