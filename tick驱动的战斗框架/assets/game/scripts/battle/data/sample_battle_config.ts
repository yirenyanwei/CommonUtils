import { BattleConfig, BattleTeam, BattleUnitType } from "./battle_config";

export function createSampleBattleConfig(): BattleConfig {
    return {
        tickRate: 30,
        maxTicks: 1800,
        fieldWidth: 960,
        fieldHeight: 640,
        heroConfigId: "hero_001",
        unitConfigs: [
            {
                configId: "hero_001",
                unitType: BattleUnitType.HERO,
                team: BattleTeam.PLAYER,
                stats: {
                    maxHp: 100,
                    attack: 18,
                    attackRange: 260,
                    attackIntervalTicks: 30,
                    moveSpeed: 0,
                    projectileSpeed: 24,
                },
            },
            {
                configId: "tower_001",
                unitType: BattleUnitType.TOWER,
                team: BattleTeam.PLAYER,
                stats: {
                    maxHp: 80,
                    attack: 12,
                    attackRange: 260,
                    attackIntervalTicks: 20,
                    moveSpeed: 0,
                    projectileSpeed: 20,
                },
            },
            {
                configId: "enemy_001",
                unitType: BattleUnitType.ENEMY,
                team: BattleTeam.ENEMY,
                stats: {
                    maxHp: 28,
                    attack: 10,
                    attackRange: 0,
                    attackIntervalTicks: 0,
                    moveSpeed: 1.8,
                    projectileSpeed: 0,
                },
            },
        ],
        rounds: [
            {
                roundId: "round_001",
                waves: [
                    {
                        waveId: "wave_001",
                        spawns: [
                            {
                                unitConfigId: "enemy_001",
                                count: 6,
                                startTick: 20,
                                intervalTicks: 30,
                                position: { x: 860, y: 320 },
                            },
                        ],
                    },
                    {
                        waveId: "wave_002",
                        spawns: [
                            {
                                unitConfigId: "enemy_001",
                                count: 8,
                                startTick: 30,
                                intervalTicks: 24,
                                position: { x: 900, y: 260 },
                            },
                        ],
                    },
                ],
            },
        ],
    };
}
