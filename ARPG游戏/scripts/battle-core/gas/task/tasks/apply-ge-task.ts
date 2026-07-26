import { AbilityTask, AbilityTaskContext } from '../ability-task';
import { ApplyGETaskConfig } from '../../../../data/config-types';
import { gasRegistry } from '../../../../data/gas-registry';

// 对施法者自身施加 GE（Buff/Debuff/状态）
export class ApplyGETask implements AbilityTask {
    constructor(private readonly cfg: ApplyGETaskConfig) {}

    tick(ctx: AbilityTaskContext): boolean {
        const geSpec = gasRegistry.getEffectSpec(this.cfg.geId);
        ctx.caster.asc.applyGameplayEffect(geSpec, ctx.world);
        return true;
    }
}
