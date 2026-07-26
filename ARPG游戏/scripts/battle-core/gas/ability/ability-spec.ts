// ============================================================
// AbilitySpec — 已授予技能的运行时实例（对齐 UE FGameplayAbilitySpec）
// 记录授予状态（CD 倒计时）
// ============================================================

export class AbilitySpec {
    readonly abilityId: string;
    /** 剩余 CD tick 数，0 = 可用 */
    remainingCooldownTicks: number = 0;

    constructor(abilityId: string) {
        this.abilityId = abilityId;
    }

    get isOnCooldown(): boolean {
        return this.remainingCooldownTicks > 0;
    }

    tickCooldown(): void {
        if (this.remainingCooldownTicks > 0) {
            this.remainingCooldownTicks--;
        }
    }
}
