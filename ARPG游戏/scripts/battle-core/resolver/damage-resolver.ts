import { GameConfig } from '../../data/config-types';
import { SeededRandom } from '../core/seeded-random';
import { CharacterEntity } from '../entity/character-entity';

// ============================================================
// DamageResolver — 纯函数伤害公式（无状态，不持有 world 引用）
// 由 CollisionSystem 调用，只做数学计算。
// ============================================================

export interface DamageRequest {
    attacker: CharacterEntity;
    target: CharacterEntity;
    /** ATK 倍率，1.0 = 100% 攻击力 */
    atkMultiplier: number;
    /** 固定值附加伤害 */
    flatBonus: number;
}

export interface DamageResult {
    finalDamage: number;
    isCrit: boolean;
}

export class DamageResolver {
    compute(req: DamageRequest, config: GameConfig, random: SeededRandom): DamageResult {
        const { attacker, target, atkMultiplier, flatBonus } = req;

        const atk  = attacker.asc.attributes.getValue('atk');
        const def  = target.asc.attributes.getValue('def');

        let base = atk * atkMultiplier + flatBonus;

        // 暴击判定
        const critRate = config.baseCritRate;
        const isCrit   = random.chance(critRate);
        if (isCrit) base *= config.critMultiplier;

        // 防御减伤（线性，最低 1 点）
        const finalDamage = Math.max(1, Math.floor(base - def));

        return { finalDamage, isCrit };
    }
}
