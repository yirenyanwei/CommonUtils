import { AbilityTask, AbilityTaskContext } from '../ability-task';
import { ApplyImpulseTaskConfig } from '../../../../data/config-types';

// 施加物理冲量（位移技能）
export class ApplyImpulseTask implements AbilityTask {
    constructor(private readonly cfg: ApplyImpulseTaskConfig) {}

    tick(ctx: AbilityTaskContext): boolean {
        const { caster } = ctx;
        caster.velocity.x += caster.facing * this.cfg.forwardForce;
        caster.velocity.y += this.cfg.upwardForce;
        return true;
    }
}
