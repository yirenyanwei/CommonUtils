import { AbilityTask, AbilityTaskContext } from '../ability-task';
import { SpawnHitboxTaskConfig } from '../../../../data/config-types';

// 生成 Hitbox，委托给 HitboxManager 管理生命周期
export class SpawnHitboxTask implements AbilityTask {
    private started = false;

    constructor(private readonly cfg: SpawnHitboxTaskConfig) {}

    tick(ctx: AbilityTaskContext): boolean {
        if (!this.started) {
            this.started = true;
            ctx.world.hitboxManager.spawnHitbox(ctx.caster, this.cfg, ctx.abilityId);
        }
        // SpawnHitbox 是瞬时操作，立即完成
        return true;
    }
}
