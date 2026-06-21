/*
 * @Desc: 胜负判定。纯函数，根据双方存活情况返回结果或 null（未分胜负）
 */
import { BattleResult } from '../config/config-types';
import { BattleContext } from '../core/battle-context';

export function checkBattleEnd(ctx: BattleContext): BattleResult | null {
    const allyWiped = ctx.allyTeam.isWiped;
    const enemyWiped = ctx.enemyTeam.isWiped;
    if (allyWiped && enemyWiped) {
        return BattleResult.DRAW;
    }
    if (enemyWiped) {
        return BattleResult.ALLY_WIN;
    }
    if (allyWiped) {
        return BattleResult.ENEMY_WIN;
    }
    return null;
}
