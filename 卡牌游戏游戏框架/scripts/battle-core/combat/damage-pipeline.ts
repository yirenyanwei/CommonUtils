/*
 * @Desc: 伤害结算管线。所有伤害都走这里，按固定顺序应用各阶段修正：
 *   暴击 → 攻方增伤 → 减防 → 受方易伤/减伤 → 护盾吸收 → 扣血 → 吸血/反伤 → 死亡/免死
 * 新增护盾、减伤、吸血、反伤、免死等玩法 = 在 Buff 上配字段，无需改动此处或技能。
 */
import { BattleEventType } from '../config/config-types';
import type { BattleContext } from '../core/battle-context';
import { FrameType } from '../record/battle-record';
import { DamageRequest, DamageResult } from './combat-types';

const BASE_CRIT_CHANCE = 0.2;
const CRIT_MULTIPLIER = 1.5;

export function dealDamage(ctx: BattleContext, req: DamageRequest): DamageResult {
    const { caster, target, skill } = req;
    if (!target.alive) {
        return { amount: 0, absorbed: 0, hpDamage: 0, isCrit: false };
    }

    let amount = req.baseAmount;
    let isCrit = false;

    if (req.canCrit) {
        const chance = BASE_CRIT_CHANCE + caster.buffManager.sumCritBonus();
        if (ctx.rng.chance(chance)) {
            isCrit = true;
            amount *= CRIT_MULTIPLIER;
        }
    }

    if (!req.trueDamage) {
        amount *= 1 + caster.buffManager.sumDamageDealtPercent();
        amount -= target.def;
        amount *= 1 + target.buffManager.sumDamageTakenPercent();
    }
    amount = Math.max(1, Math.floor(amount));

    ctx.events.emit({ type: BattleEventType.BEFORE_DAMAGE, source: caster, target, value: amount });

    const absorbed = target.buffManager.consumeShield(amount);
    const hpDamage = amount - absorbed;
    target.hp = Math.max(0, target.hp - hpDamage);

    ctx.recorder.add({
        type: FrameType.DAMAGE,
        round: ctx.round,
        casterId: caster.instanceId,
        targetId: target.instanceId,
        skillId: skill?.id,
        value: amount,
        absorbed,
        isCrit,
        hpAfter: target.hp,
    });
    ctx.events.emit({ type: BattleEventType.AFTER_DAMAGE, source: caster, target, value: amount });

    if (req.allowOnHit !== false && hpDamage > 0) {
        applyOnHit(ctx, req, hpDamage);
    }

    if (!target.alive) {
        if (target.buffManager.takePreventDeath()) {
            target.hp = 1;
        } else {
            ctx.reportDeath(target);
        }
    }

    return { amount, absorbed, hpDamage, isCrit };
}

/** 命中后结算：攻方吸血、受方反伤 */
function applyOnHit(ctx: BattleContext, req: DamageRequest, hpDamage: number): void {
    const { caster, target } = req;

    const lifesteal = caster.buffManager.sumLifestealPercent();
    if (lifesteal > 0 && caster.alive) {
        ctx.applyHeal(caster, caster, Math.floor(hpDamage * lifesteal));
    }

    const reflect = target.buffManager.sumReflectPercent();
    if (reflect > 0 && caster.alive) {
        dealDamage(ctx, {
            caster: target,
            target: caster,
            baseAmount: Math.floor(hpDamage * reflect),
            canCrit: false,
            trueDamage: true,
            allowOnHit: false,
        });
    }
}
