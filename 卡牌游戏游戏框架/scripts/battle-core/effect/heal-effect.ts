/*
 * @Desc: 治疗效果
 */
import { EffectType } from '../config/config-types';
import { Effect, EffectContext } from './effect';

export class HealEffect implements Effect {
    readonly type = EffectType.HEAL;

    execute(context: EffectContext): void {
        const { battle, caster, targets, config, skill } = context;
        const multiplier = config.multiplier ?? 0;
        const fixed = config.fixed ?? 0;

        for (const target of targets) {
            if (!target.alive) {
                continue;
            }
            const amount = Math.max(0, Math.floor(caster.atk * multiplier + fixed));
            battle.applyHeal(caster, target, amount, skill);
        }
    }
}
