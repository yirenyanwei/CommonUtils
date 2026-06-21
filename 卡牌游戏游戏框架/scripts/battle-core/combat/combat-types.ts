/*
 * @Desc: 战斗结算管线的数据类型
 */
import type { Hero } from '../entity/hero';
import type { Skill } from '../skill/skill';

/** 一次伤害请求（进入伤害管线） */
export interface DamageRequest {
    caster: Hero;
    target: Hero;
    /** 基础伤害（已含 攻击×倍率 + 固定值），后续由管线做暴击/增减伤/护盾等处理 */
    baseAmount: number;
    canCrit: boolean;
    /** 真实伤害：跳过防御与增减伤修正 */
    trueDamage?: boolean;
    /** 是否触发吸血/反伤（默认 true；反伤递归时置 false 防止死循环） */
    allowOnHit?: boolean;
    skill?: Skill;
}

/** 伤害结算结果 */
export interface DamageResult {
    /** 最终伤害（护盾吸收前） */
    amount: number;
    /** 被护盾吸收量 */
    absorbed: number;
    /** 实际扣血量 */
    hpDamage: number;
    isCrit: boolean;
}
