import { BattleUnit } from "../unit/battle_unit";

export interface DamageResult {
    damage: number;
    isKilled: boolean;
}

export class DamageResolver {
    /**
     * 伤害结算
     * @param target 
     * @param damage 
     * @returns 
     */
    applyDamage(target: BattleUnit, damage: number): DamageResult {
        const finalDamage = Math.max(0, damage);
        target.takeDamage(finalDamage);

        return {
            damage: finalDamage,
            isKilled: !target.isAlive,
        };
    }
}
