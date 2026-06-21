/*
 * @Desc: 单个武将的 Buff 容器，处理叠加规则、属性修正聚合与回合衰减
 */
import { AttributeType, BuffConfig, BuffStackType } from '../config/config-types';
import { Buff } from './buff';

/** 属性修正聚合结果 */
export interface ModifierResult {
    flat: number;
    percent: number;
}

export class BuffManager {
    private buffs: Buff[] = [];

    getAll(): readonly Buff[] {
        return this.buffs;
    }

    has(buffId: string): boolean {
        return this.buffs.some((b) => b.id === buffId);
    }

    get(buffId: string): Buff | undefined {
        return this.buffs.find((b) => b.id === buffId);
    }

    /** 是否处于无法行动状态（控制类 Buff） */
    get preventAction(): boolean {
        return this.buffs.some((b) => b.config.preventAction === true);
    }

    /**
     * 添加 Buff，按叠加规则处理。
     * @returns 实际生效的 Buff，以及它是否为新添加
     */
    add(config: BuffConfig, sourceId: number): { buff: Buff; isNew: boolean } {
        const exist = this.get(config.id);
        if (exist && config.stackType !== BuffStackType.INDEPENDENT) {
            if (config.stackType === BuffStackType.STACK) {
                exist.stacks = Math.min(config.maxStacks, exist.stacks + 1);
            }
            exist.remainingRounds = config.duration;
            return { buff: exist, isNew: false };
        }
        const buff = new Buff(config, sourceId);
        this.buffs.push(buff);
        return { buff, isNew: true };
    }

    remove(buffId: string): boolean {
        const index = this.buffs.findIndex((b) => b.id === buffId);
        if (index < 0) {
            return false;
        }
        this.buffs.splice(index, 1);
        return true;
    }

    /** 聚合指定属性的全部修正（固定值与百分比，按层数计算） */
    getModifier(attribute: AttributeType): ModifierResult {
        let flat = 0;
        let percent = 0;
        for (const buff of this.buffs) {
            const modifiers = buff.config.attributeModifiers;
            if (!modifiers) {
                continue;
            }
            for (const modifier of modifiers) {
                if (modifier.attribute !== attribute) {
                    continue;
                }
                const total = modifier.value * buff.stacks;
                if (modifier.isPercent) {
                    percent += total;
                } else {
                    flat += total;
                }
            }
        }
        return { flat, percent };
    }

    // ---- 战斗结算管线相关聚合 ----

    /** 攻方增伤百分比合计 */
    sumDamageDealtPercent(): number {
        return this.sumField((c) => c.damageDealtPercent);
    }

    /** 受方易伤/减伤百分比合计 */
    sumDamageTakenPercent(): number {
        return this.sumField((c) => c.damageTakenPercent);
    }

    /** 暴击率加成合计 */
    sumCritBonus(): number {
        return this.sumField((c) => c.critChanceBonus);
    }

    /** 吸血百分比合计 */
    sumLifestealPercent(): number {
        return this.sumField((c) => c.lifestealPercent);
    }

    /** 反伤百分比合计 */
    sumReflectPercent(): number {
        return this.sumField((c) => c.reflectPercent);
    }

    /** 受治疗加成百分比合计 */
    sumHealingTakenPercent(): number {
        return this.sumField((c) => c.healingTakenPercent);
    }

    /** 消耗护盾吸收伤害，返回实际吸收量 */
    consumeShield(amount: number): number {
        let remaining = amount;
        let absorbed = 0;
        for (const buff of this.buffs) {
            if (buff.shieldRemaining <= 0 || remaining <= 0) {
                continue;
            }
            const take = Math.min(buff.shieldRemaining, remaining);
            buff.shieldRemaining -= take;
            absorbed += take;
            remaining -= take;
        }
        return absorbed;
    }

    /** 若存在免死 Buff，消耗一个并返回 true */
    takePreventDeath(): boolean {
        const index = this.buffs.findIndex((b) => b.config.preventDeath === true);
        if (index < 0) {
            return false;
        }
        this.buffs.splice(index, 1);
        return true;
    }

    private sumField(pick: (config: BuffConfig) => number | undefined): number {
        let total = 0;
        for (const buff of this.buffs) {
            const value = pick(buff.config);
            if (value) {
                total += value * buff.stacks;
            }
        }
        return total;
    }

    /** 回合结束时衰减持续时间，返回已过期被移除的 Buff */
    tickDuration(): Buff[] {
        const expired: Buff[] = [];
        for (const buff of this.buffs) {
            buff.remainingRounds -= 1;
            if (buff.expired) {
                expired.push(buff);
            }
        }
        if (expired.length > 0) {
            this.buffs = this.buffs.filter((b) => !b.expired);
        }
        return expired;
    }
}
