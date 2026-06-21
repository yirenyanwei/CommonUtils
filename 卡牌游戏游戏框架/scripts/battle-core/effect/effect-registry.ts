/*
 * @Desc: 效果注册表。以 EffectType 为键查找处理器，实现效果可插拔扩展
 */
import { EffectType } from '../config/config-types';
import { Effect, EffectContext } from './effect';

export class EffectRegistry {
    private handlers = new Map<EffectType, Effect>();

    register(effect: Effect): void {
        this.handlers.set(effect.type, effect);
    }

    execute(context: EffectContext): void {
        const handler = this.handlers.get(context.config.type);
        if (!handler) {
            console.warn(`[battle] 未注册的效果类型: ${context.config.type}`);
            return;
        }
        handler.execute(context);
    }
}
