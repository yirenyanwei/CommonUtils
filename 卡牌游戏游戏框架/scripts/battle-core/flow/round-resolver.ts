/*
 * @Desc: 回合内武将出手执行（TurnSystem）。负责速度排序后的逐个行动、AI 决策、Buff 衰减
 */
import { BattleEventType } from '../config/config-types';
import { BattleContext } from '../core/battle-context';
import { Hero } from '../entity/hero';
import { Skill } from '../skill/skill';
import { FrameType } from '../record/battle-record';
import { buildActionOrder } from './action-order';
import { checkBattleEnd } from './battle-outcome';

const NORMAL_ATTACK_ENERGY = 25;

export class RoundResolver {
    /**
     * 结算本回合所有武将出手。
     * @returns 是否在回合中途已分出胜负
     */
    resolveRound(ctx: BattleContext): boolean {
        const order = buildActionOrder(ctx);
        for (const hero of order) {
            if (!hero.alive) {
                continue;
            }
            this.takeTurn(ctx, hero);
            if (checkBattleEnd(ctx)) {
                return true;
            }
        }
        ctx.events.emit({ type: BattleEventType.ROUND_END });
        return false;
    }

    private takeTurn(ctx: BattleContext, hero: Hero): void {
        ctx.recorder.add({ type: FrameType.TURN_START, round: ctx.round, casterId: hero.instanceId });
        ctx.events.emit({ type: BattleEventType.TURN_START, source: hero });

        ctx.processBuffTriggers(hero, BattleEventType.TURN_START);
        if (!hero.alive) {
            return;
        }

        if (!hero.buffManager.preventAction) {
            this.performAction(ctx, hero);
        }

        ctx.events.emit({ type: BattleEventType.TURN_END, source: hero });
        this.tickHeroBuffs(ctx, hero);
    }

    /** 武将出手决策：能量满则放大招，否则普攻 */
    private performAction(ctx: BattleContext, hero: Hero): void {
        const ultimate = hero.skills.find((s) => s.isUltimate && hero.energy >= s.energyCost);
        if (ultimate) {
            this.castSkill(ctx, hero, ultimate);
            hero.energy = 0;
            ctx.recordEnergy(hero);
            return;
        }

        const normal = hero.skills.find((s) => !s.isUltimate) ?? hero.skills[0];
        this.castSkill(ctx, hero, normal);
        hero.addEnergy(normal.energyGain || NORMAL_ATTACK_ENERGY);
        ctx.recordEnergy(hero);
    }

    private castSkill(ctx: BattleContext, hero: Hero, skill: Skill): void {
        ctx.recorder.add({
            type: FrameType.SKILL_CAST,
            round: ctx.round,
            casterId: hero.instanceId,
            skillId: skill.id,
            skillName: skill.name,
        });
        ctx.events.emit({ type: BattleEventType.BEFORE_ATTACK, source: hero });
        const targets = ctx.selectTargets(hero, skill.config.targetType);
        ctx.runEffects(hero, skill.config.effects, targets, skill);
    }

    private tickHeroBuffs(ctx: BattleContext, hero: Hero): void {
        const expired = hero.buffManager.tickDuration();
        for (const buff of expired) {
            ctx.recorder.add({
                type: FrameType.BUFF_REMOVE,
                round: ctx.round,
                targetId: hero.instanceId,
                buffId: buff.id,
                buffName: buff.name,
            });
        }
    }
}
