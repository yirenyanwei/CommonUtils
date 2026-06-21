/*
 * @Desc: 战斗装配工厂。从 BattleSetup + GameConfig 组装出可运行的 Battle
 *        逻辑层入口：相同 setup（含 seed）必产生相同结果，可用于服务器校验
 */
import { BattleSetup, Camp, GameConfig, TeamMemberSetup } from '../config/config-types';
import { BattleContext } from '../core/battle-context';
import { BattleEventBus } from '../core/event-bus';
import { SeededRandom } from '../core/seeded-random';
import { Hero } from '../entity/hero';
import { Team } from '../entity/team';
import { Skill } from '../skill/skill';
import { PlayerSkill } from '../command/player-skill';
import { PlayerCommandRecord } from '../command/battle-command';
import { EffectRegistry } from '../effect/effect-registry';
import { DamageEffect } from '../effect/damage-effect';
import { HealEffect } from '../effect/heal-effect';
import { AddBuffEffect } from '../effect/add-buff-effect';
import { BattleRecorder } from '../record/battle-record';
import { Battle } from './battle';

let instanceCounter = 0;

/** 注册内置效果处理器（扩展新效果时在此追加 register） */
function createEffectRegistry(): EffectRegistry {
    const registry = new EffectRegistry();
    registry.register(new DamageEffect());
    registry.register(new HealEffect());
    registry.register(new AddBuffEffect());
    return registry;
}

function buildHero(
    config: GameConfig,
    setup: TeamMemberSetup,
    camp: Camp,
): Hero {
    const heroConfig = config.heroes[setup.configId];
    if (!heroConfig) {
        throw new Error(`未找到武将配置: ${setup.configId}`);
    }
    const skills = heroConfig.skillIds.map((id) => {
        const skillConfig = config.skills[id];
        if (!skillConfig) {
            throw new Error(`未找到技能配置: ${id}`);
        }
        return new Skill(skillConfig);
    });
    instanceCounter += 1;
    return new Hero({
        instanceId: instanceCounter,
        configId: heroConfig.id,
        name: heroConfig.name,
        camp,
        position: setup.position,
        maxHp: heroConfig.maxHp,
        atk: heroConfig.atk,
        def: heroConfig.def,
        speed: heroConfig.speed,
        maxEnergy: heroConfig.maxEnergy,
        initialEnergy: heroConfig.initialEnergy ?? 0,
        skills,
    });
}

export function createBattle(config: GameConfig, setup: BattleSetup): Battle {
    instanceCounter = 0;

    const allyTeam = new Team(Camp.ALLY);
    const enemyTeam = new Team(Camp.ENEMY);
    for (const member of setup.ally) {
        allyTeam.add(buildHero(config, member, Camp.ALLY));
    }
    for (const member of setup.enemy) {
        enemyTeam.add(buildHero(config, member, Camp.ENEMY));
    }

    const ctx = new BattleContext(
        config,
        allyTeam,
        enemyTeam,
        new SeededRandom(setup.seed),
        new BattleEventBus(),
        createEffectRegistry(),
        new BattleRecorder(),
    );
    ctx.seed = setup.seed;
    ctx.playerMaxEnergy = setup.playerMaxEnergy ?? 100;
    ctx.playerEnergy = 0;

    const playerSkills = (setup.playerActiveSkillIds ?? []).map((id) => {
        const skillConfig = config.skills[id];
        if (!skillConfig) {
            throw new Error(`未找到主动技能配置: ${id}`);
        }
        return new PlayerSkill(new Skill(skillConfig));
    });

    return new Battle(ctx, playerSkills, setup.playerEnergyPerRound ?? 50);
}

/** 便捷入口：装配并直接跑完（玩家无操作），返回结果与记录帧 */
export function runBattle(config: GameConfig, setup: BattleSetup) {
    const battle = createBattle(config, setup);
    const result = battle.run();
    return { result, frames: battle.frames };
}

/**
 * 带玩家指令的 headless 运行：用于服务器校验 / 回放。
 * 传入 `seed + setup + 指令序列`，相同输入必产生相同结果。
 */
export function runBattleWithCommands(
    config: GameConfig,
    setup: BattleSetup,
    commands: PlayerCommandRecord[],
) {
    const battle = createBattle(config, setup);
    const result = battle.run(commands);
    return { result, frames: battle.frames, commandLog: battle.commandLog };
}
