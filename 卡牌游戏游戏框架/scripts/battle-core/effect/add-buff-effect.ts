/*
 * @Desc: 加 Buff 效果
 */
import { EffectType } from '../config/config-types';
import { Effect, EffectContext } from './effect';

export class AddBuffEffect implements Effect {
    readonly type = EffectType.ADD_BUFF;

    execute(context: EffectContext): void {
        const { battle, caster, targets, config } = context;
        if (!config.buffId) {
            console.warn('[battle] ADD_BUFF 效果缺少 buffId');
            return;
        }
        const stacks = config.stacks ?? 1;
        for (const target of targets) {
            if (!target.alive) {
                continue;
            }
            battle.applyBuff(caster, target, config.buffId, stacks);
        }
    }
}
