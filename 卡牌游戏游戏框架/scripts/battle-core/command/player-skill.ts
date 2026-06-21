/*
 * @Desc: 我方独立于武将之外的主动技能。能量随回合增长，由玩家点击释放（指令驱动）。
 *        能量的扣减由 Battle 在结算指令时统一处理，这里只负责"放出技能效果"
 */
import { SkillConfig, TargetType } from '../config/config-types';
import { BattleContext } from '../core/battle-context';
import { Hero } from '../entity/hero';
import { Skill } from '../skill/skill';
import { FrameType } from '../record/battle-record';

export class PlayerSkill {
    constructor(readonly skill: Skill) {}

    get config(): SkillConfig {
        return this.skill.config;
    }

    get cost(): number {
        return this.skill.energyCost;
    }

    get targetType(): TargetType {
        return this.config.targetType;
    }

    /**
     * 释放主动技能。以存活的首位我方武将作为事件来源（用于攻击力计算）；
     * 若希望与武将无关，可在效果配置中使用 fixed 固定值。
     * @param targetId 玩家指定的目标实例 id（单体技能用），不填则按技能默认目标选择
     */
    cast(battle: BattleContext, targetId?: number): void {
        const caster = battle.allyTeam.getFront();
        if (!caster) {
            return;
        }
        battle.recorder.add({
            type: FrameType.PLAYER_SKILL_CAST,
            round: battle.round,
            casterId: caster.instanceId,
            skillId: this.skill.id,
            skillName: this.skill.name,
        });
        const defaultTargets = this.resolveTargets(battle, caster, targetId);
        battle.runEffects(caster, this.config.effects, defaultTargets, this.skill);
    }

    private resolveTargets(battle: BattleContext, caster: Hero, targetId?: number): Hero[] {
        if (targetId !== undefined) {
            const target = battle.findHero(targetId);
            if (target && target.alive) {
                return [target];
            }
        }
        return battle.selectTargets(caster, this.config.targetType);
    }
}
