/*
 * @Desc: 队伍，持有同阵营武将并提供站位/存活查询
 */
import { Camp } from '../config/config-types';
import { Hero } from './hero';

export class Team {
    readonly heroes: Hero[] = [];

    constructor(readonly camp: Camp) {}

    add(hero: Hero): void {
        this.heroes.push(hero);
    }

    getAlive(): Hero[] {
        return this.heroes.filter((h) => h.alive);
    }

    get isWiped(): boolean {
        return this.getAlive().length === 0;
    }

    /** 站位最靠前（position 最小）的存活武将 */
    getFront(): Hero | undefined {
        return this.getAlive().sort((a, b) => a.position - b.position)[0];
    }
}
