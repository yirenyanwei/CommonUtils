import { AbilityTaskConfig } from '../../../data/config-types';
import { AbilityTask } from './ability-task';
import { WaitTicksTask } from './tasks/wait-ticks-task';
import { SpawnHitboxTask } from './tasks/spawn-hitbox-task';
import { ApplyGETask } from './tasks/apply-ge-task';
import { ApplyImpulseTask } from './tasks/apply-impulse-task';
import { PlayAnimEventTask } from './tasks/play-anim-event-task';

// 根据配置构建 AbilityTask 实例
export function buildTask(cfg: AbilityTaskConfig): AbilityTask {
    switch (cfg.type) {
        case 'WaitTicks':            return new WaitTicksTask(cfg);
        case 'SpawnHitbox':          return new SpawnHitboxTask(cfg);
        case 'ApplyGameplayEffect':  return new ApplyGETask(cfg);
        case 'ApplyImpulse':         return new ApplyImpulseTask(cfg);
        case 'PlayAnimEvent':        return new PlayAnimEventTask(cfg);
    }
}
