/*
 * @Desc: 原子效果接口。技能 = 若干原子效果的组合；扩展新玩法只需新增 Effect 并注册
 */
import { EffectConfig, EffectType } from '../config/config-types';
import type { BattleContext } from '../core/battle-context';
import type { Hero } from '../entity/hero';
import type { Skill } from '../skill/skill';

export interface EffectContext {
    battle: BattleContext;
    /** 施法者 */
    caster: Hero;
    /** 已选定的目标 */
    targets: Hero[];
    config: EffectConfig;
    /** 来源技能（若由技能触发） */
    skill?: Skill;
}

export interface Effect {
    readonly type: EffectType;
    execute(context: EffectContext): void;
}
