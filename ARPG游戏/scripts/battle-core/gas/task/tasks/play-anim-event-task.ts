import { AbilityTask, AbilityTaskContext } from '../ability-task';
import { PlayAnimEventTaskConfig } from '../../../../data/config-types';
import { BattleEventType } from '../../../event/battle-event';

// 发送动画/特效事件，View 层负责执行（逻辑层只写事件）
export class PlayAnimEventTask implements AbilityTask {
    constructor(private readonly cfg: PlayAnimEventTaskConfig) {}

    tick(ctx: AbilityTaskContext): boolean {
        const { world, caster } = ctx;

        // 发送 ABILITY_ACTIVATE 事件供 View 切换 Spine 动画
        world.eventBus.emit({
            type: BattleEventType.ABILITY_ACTIVATE,
            tick: world.tick,
            entityId: caster.id,
            abilityId: ctx.abilityId,
            animName: this.cfg.animationName,
        });

        // 发送 GameplayCue 事件供 View 播放特效/音效
        for (const cueTag of this.cfg.cueTags ?? []) {
            world.eventBus.emit({
                type: BattleEventType.GAMEPLAY_CUE,
                tick: world.tick,
                entityId: caster.id,
                cueTag,
                position: { x: caster.position.x, y: caster.position.y },
            });
        }

        return true;
    }
}
