/*
 * @Desc: 伤害效果。只负责把"基础伤害"算出来并投入伤害管线，具体的暴击/护盾/吸血等由管线处理
 */
import { EffectType } from '../config/config-types';
import { Effect, EffectContext } from './effect';

export class DamageEffect implements Effect {
    readonly type = EffectType.DAMAGE;

    execute(context: EffectContext): void {
        const { battle, caster, targets, config, skill } = context;
        const multiplier = config.multiplier ?? 0;
        const fixed = config.fixed ?? 0;

        for (const target of targets) {
            if (!target.alive) {
                continue;
            }
            const baseAmount = caster.atk * multiplier + fixed;
            battle.dealDamage({
                caster,
                target,
                baseAmount,
                canCrit: config.canCrit === true,
                trueDamage: config.trueDamage === true,
                // 自伤（如中毒在自己回合掉血）不触发吸血/反伤
                allowOnHit: caster !== target,
                skill,
            });
        }
    }
}
