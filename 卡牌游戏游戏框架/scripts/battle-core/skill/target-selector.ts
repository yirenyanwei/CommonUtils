/*
 * @Desc: 目标选择器。根据 TargetType 在战场中选出目标列表
 */
import { TargetType } from '../config/config-types';
import type { BattleContext } from '../core/battle-context';
import type { Hero } from '../entity/hero';

export function selectTargets(
    battle: BattleContext,
    caster: Hero,
    targetType: TargetType,
): Hero[] {
    const enemies = battle.getOpponentsOf(caster);
    const allies = battle.getAlliesOf(caster);

    switch (targetType) {
        case TargetType.SELF:
            return [caster];
        case TargetType.SINGLE_ENEMY:
        case TargetType.RANDOM_ENEMY:
            return enemies.length > 0 ? [battle.rng.pick(enemies)] : [];
        case TargetType.ALL_ENEMY:
            return enemies;
        case TargetType.LOWEST_HP_ENEMY:
            return firstOf(lowestHp(enemies));
        case TargetType.FRONT_ENEMY:
            return firstOf(frontMost(enemies));
        case TargetType.SINGLE_ALLY:
            return allies.length > 0 ? [battle.rng.pick(allies)] : [];
        case TargetType.ALL_ALLY:
            return allies;
        case TargetType.LOWEST_HP_ALLY:
            return firstOf(lowestHp(allies));
        default:
            return [];
    }
}

function firstOf(hero: Hero | undefined): Hero[] {
    return hero ? [hero] : [];
}

function lowestHp(heroes: Hero[]): Hero | undefined {
    if (heroes.length === 0) {
        return undefined;
    }
    return heroes.slice().sort((a, b) => a.hp - b.hp)[0];
}

function frontMost(heroes: Hero[]): Hero | undefined {
    if (heroes.length === 0) {
        return undefined;
    }
    return heroes.slice().sort((a, b) => a.position - b.position)[0];
}
