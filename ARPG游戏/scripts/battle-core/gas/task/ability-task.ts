import type { BattleWorld } from '../../core/battle-world';
import type { CharacterEntity } from '../../entity/character-entity';

// ============================================================
// AbilityTask — GA 内的多 tick 子步骤基类（对齐 UE UAbilityTask）
// 每个 Task 执行完后把控制权还给 ActiveAbility，
// ActiveAbility 推进到下一个 Task。
// ============================================================

export interface AbilityTaskContext {
    world: BattleWorld;
    caster: CharacterEntity;
    abilityId: string;
}

export interface AbilityTask {
    /** 执行本 Task，返回 true 表示本 tick 完成可推进下一个 */
    tick(ctx: AbilityTaskContext): boolean;
}
