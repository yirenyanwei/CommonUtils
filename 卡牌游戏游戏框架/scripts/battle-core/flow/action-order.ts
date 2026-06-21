/*
 * @Desc: 出手顺序计算（Initiative）。纯函数，按速度/阵营/站位确定性排序
 */
import { BattleContext } from '../core/battle-context';
import { Hero } from '../entity/hero';

/** 按速度降序排序，速度相同则我方优先、再按站位，保证确定性 */
export function buildActionOrder(ctx: BattleContext): Hero[] {
    return ctx.allHeroes
        .filter((h) => h.alive)
        .sort((a, b) => {
            if (b.speed !== a.speed) {
                return b.speed - a.speed;
            }
            if (a.camp !== b.camp) {
                return a.camp < b.camp ? -1 : 1;
            }
            return a.position - b.position;
        });
}
