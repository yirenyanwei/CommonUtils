import { GameplayEffectSpec } from '../../../data/config-types';

// ============================================================
// ActiveGameplayEffect — GE 的运行时实例（对齐 UE FActiveGameplayEffect）
// 一个 GE 被施加到实体后，在 ASC 内以此类型存活并被维护。
// ============================================================

let handleCounter = 0;

export class ActiveGameplayEffect {
    /** 唯一句柄，用于驱散时查找 */
    readonly handle: string;
    readonly spec: GameplayEffectSpec;
    /** 剩余 tick 数（Instant 类型为 0） */
    remainingTicks: number;
    /** 周期触发的计时器 */
    periodicTimer: number = 0;

    constructor(spec: GameplayEffectSpec) {
        this.handle = `age_${++handleCounter}`;
        this.spec = spec;
        this.remainingTicks = spec.durationTicks ?? 0;
    }
}
