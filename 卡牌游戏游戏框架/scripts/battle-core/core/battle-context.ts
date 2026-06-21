/*
 * @Desc: 战斗上下文，战斗世界状态的中心。持有队伍/随机/事件/记录，并提供数值结算入口
 */
import {
    BattleEventType,
    Camp,
    EffectConfig,
    GameConfig,
    TargetType,
} from '../config/config-types';
import { Hero } from '../entity/hero';
import { Team } from '../entity/team';
import { Skill } from '../skill/skill';
import { selectTargets } from '../skill/target-selector';
import { EffectContext } from '../effect/effect';
import { EffectRegistry } from '../effect/effect-registry';
import { BattleEventBus } from './event-bus';
import { SeededRandom } from './seeded-random';
import { BattleRecorder, FrameType } from '../record/battle-record';
import { dealDamage } from '../combat/damage-pipeline';
import { DamageRequest, DamageResult } from '../combat/combat-types';

export class BattleContext {
    round = 0;
    /** 战斗种子，仅用于记录快照展示 */
    seed = 0;
    /** 我方独立主动技能能量 */
    playerEnergy = 0;
    playerMaxEnergy = 0;

    constructor(
        readonly config: GameConfig,
        readonly allyTeam: Team,
        readonly enemyTeam: Team,
        readonly rng: SeededRandom,
        readonly events: BattleEventBus,
        readonly effects: EffectRegistry,
        readonly recorder: BattleRecorder,
    ) {}

    get allHeroes(): Hero[] {
        return [...this.allyTeam.heroes, ...this.enemyTeam.heroes];
    }

    getTeam(camp: Camp): Team {
        return camp === Camp.ALLY ? this.allyTeam : this.enemyTeam;
    }

    getOpponentsOf(hero: Hero): Hero[] {
        return (hero.camp === Camp.ALLY ? this.enemyTeam : this.allyTeam).getAlive();
    }

    getAlliesOf(hero: Hero): Hero[] {
        return this.getTeam(hero.camp).getAlive();
    }

    findHero(instanceId: number): Hero | undefined {
        return this.allHeroes.find((h) => h.instanceId === instanceId);
    }

    /** 运行一组效果：依次为每个效果挑选目标并执行 */
    runEffects(caster: Hero, effects: EffectConfig[], defaultTargets: Hero[], skill?: Skill): void {
        for (const effectConfig of effects) {
            const targets = effectConfig.targetType
                ? selectTargets(this, caster, effectConfig.targetType)
                : defaultTargets;
            const context: EffectContext = {
                battle: this,
                caster,
                targets,
                config: effectConfig,
                skill,
            };
            this.effects.execute(context);
        }
    }

    /** 选目标的快捷封装 */
    selectTargets(caster: Hero, targetType: TargetType): Hero[] {
        return selectTargets(this, caster, targetType);
    }

    /** 伤害结算入口：走伤害管线（暴击/增减伤/护盾/吸血/反伤/免死） */
    dealDamage(request: DamageRequest): DamageResult {
        return dealDamage(this, request);
    }

    /** 治疗结算（含受治疗加成修正） */
    applyHeal(caster: Hero, target: Hero, amount: number, skill?: Skill): void {
        if (amount <= 0 || !target.alive) {
            return;
        }
        const boosted = Math.floor(amount * (1 + target.buffManager.sumHealingTakenPercent()));
        const real = Math.min(boosted, target.maxHp - target.hp);
        target.hp += real;
        this.recorder.add({
            type: FrameType.HEAL,
            round: this.round,
            casterId: caster.instanceId,
            targetId: target.instanceId,
            skillId: skill?.id,
            value: real,
            hpAfter: target.hp,
        });
        this.events.emit({ type: BattleEventType.AFTER_HEAL, source: caster, target, value: real });
    }

    /** 施加 Buff 结算 */
    applyBuff(caster: Hero, target: Hero, buffId: string, stacks: number): void {
        const buffConfig = this.config.buffs[buffId];
        if (!buffConfig) {
            console.warn(`[battle] 未找到 Buff 配置: ${buffId}`);
            return;
        }
        let buff = target.buffManager.add(buffConfig, caster.instanceId).buff;
        for (let i = 1; i < stacks; i++) {
            buff = target.buffManager.add(buffConfig, caster.instanceId).buff;
        }
        this.recorder.add({
            type: FrameType.BUFF_ADD,
            round: this.round,
            casterId: caster.instanceId,
            targetId: target.instanceId,
            buffId,
            buffName: buffConfig.name,
            stacks: buff.stacks,
        });
        this.events.emit({ type: BattleEventType.BUFF_ADDED, source: caster, target });
    }

    /** 能量变化记录 */
    recordEnergy(hero: Hero): void {
        this.recorder.add({
            type: FrameType.ENERGY_CHANGE,
            round: this.round,
            casterId: hero.instanceId,
            energyAfter: hero.energy,
        });
    }

    /** 处理某武将身上到时机触发的 Buff（如中毒在回合开始掉血） */
    processBuffTriggers(hero: Hero, timing: BattleEventType): void {
        for (const buff of hero.buffManager.getAll().slice()) {
            if (buff.config.triggerTiming === timing && buff.config.triggerEffects) {
                this.runEffects(hero, buff.config.triggerEffects, [hero]);
                if (!hero.alive) {
                    break;
                }
            }
        }
    }

    /** 上报死亡：记录 DEATH 帧并发出 HERO_DEAD 事件（由伤害管线在确认致死时调用） */
    reportDeath(target: Hero): void {
        this.recorder.add({
            type: FrameType.DEATH,
            round: this.round,
            targetId: target.instanceId,
        });
        this.events.emit({ type: BattleEventType.HERO_DEAD, target });
    }
}
