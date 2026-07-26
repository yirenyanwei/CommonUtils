import { AbilityTask, AbilityTaskContext } from '../ability-task';
import { WaitTicksTaskConfig } from '../../../../data/config-types';

// 等待若干 tick，期间不做任何操作
export class WaitTicksTask implements AbilityTask {
    private remaining: number;

    constructor(cfg: WaitTicksTaskConfig) {
        this.remaining = cfg.ticks;
    }

    tick(_ctx: AbilityTaskContext): boolean {
        this.remaining--;
        return this.remaining <= 0;
    }
}
