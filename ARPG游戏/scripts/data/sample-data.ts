import { CharacterConfig, EnemyConfig, GameConfig, StageConfig } from './config-types';

// ============================================================
// Demo 示例数据
// ============================================================

export const GAME_CONFIG: GameConfig = {
    tickRate: 20,           // 20 tick/s → 每 tick 50ms
    gravity: 0.8,           // 每 tick 向下速度增量（逻辑单位/tick）
    jumpImpulse: 14,        // 起跳时的向上速度（逻辑单位/tick）
    baseCritRate: 0.05,     // 5% 基础暴击率
    critMultiplier: 1.5,    // 暴击伤害倍率，1.5 表示暴击时造成 150% 伤害
    knockUpThreshold: 120,  // knockbackY 超过此值触发浮空 GE
    maxTicks: 6000,         // 最多 300s
};

// ────────────────────────────────────────────────────────────
// 玩家角色
// ────────────────────────────────────────────────────────────

export const HERO_CONFIG: CharacterConfig = {
    id: 'hero_knight',
    name: '骑士',
    attributes: {
        maxHp: 500,
        maxMp: 100,
        atk: 60,
        def: 15,
        moveSpeed: 4,       // 每 tick 移动单位
        mpRegenPerTick: 0.25,  // 5 MP/s ÷ 20 tick = 0.25/tick
    },
    comboConfig: {
        segments: [
            { abilityId: 'ga_normal_atk_1', cancelWindowTicks: 5 },
            { abilityId: 'ga_normal_atk_2', cancelWindowTicks: 5 },
            { abilityId: 'ga_normal_atk_3', cancelWindowTicks: 0 },
        ],
        resetTicks: 30,
    },
    skillAbilityIds: ['ga_skill1_dash_slash', 'ga_skill2_slow_field', 'ga_skill3_burst'],
    spineKey: 'knight',
    hurtbox: { width: 40, height: 80, offsetY: 40 },
};

// ────────────────────────────────────────────────────────────
// 敌人
// ────────────────────────────────────────────────────────────

export const ENEMY_GOBLIN: EnemyConfig = {
    id: 'enemy_goblin',
    name: '哥布林',
    attributes: {
        maxHp: 120,
        maxMp: 0,
        atk: 20,
        def: 5,
        moveSpeed: 2.5,
        mpRegenPerTick: 0,
    },
    comboConfig: {
        segments: [{ abilityId: 'ga_enemy_attack', cancelWindowTicks: 0 }],
        resetTicks: 60,
    },
    skillAbilityIds: ['ga_enemy_attack', 'ga_enemy_attack', 'ga_enemy_attack'],
    spineKey: 'goblin',
    hurtbox: { width: 36, height: 60, offsetY: 30 },
    detectRange: 300,
    attackRange: 70,
    chaseSpeed: 2.5,
};

export const ENEMY_ORC: EnemyConfig = {
    id: 'enemy_orc',
    name: '兽人',
    attributes: {
        maxHp: 300,
        maxMp: 0,
        atk: 35,
        def: 20,
        moveSpeed: 1.8,
        mpRegenPerTick: 0,
    },
    comboConfig: {
        segments: [{ abilityId: 'ga_enemy_attack', cancelWindowTicks: 0 }],
        resetTicks: 60,
    },
    skillAbilityIds: ['ga_enemy_attack', 'ga_enemy_attack', 'ga_enemy_attack'],
    spineKey: 'orc',
    hurtbox: { width: 50, height: 80, offsetY: 40 },
    detectRange: 250,
    attackRange: 80,
    chaseSpeed: 1.8,
};

// ────────────────────────────────────────────────────────────
// 关卡
// ────────────────────────────────────────────────────────────

export const STAGE_1: StageConfig = {
    id: 'stage_1',
    roomBounds: { x: -480, y: -270, width: 960, height: 540 },
    groundY: -180,
    playerSpawn: { x: -320, y: -180 },
    playerConfigId: 'hero_knight',
    enemies: [
        { configId: 'enemy_goblin', x: 100,  y: -180 },
        { configId: 'enemy_goblin', x: 200,  y: -180 },
        { configId: 'enemy_orc',    x: 320,  y: -180 },
    ],
};

// ────────────────────────────────────────────────────────────
// 查询入口
// ────────────────────────────────────────────────────────────

const CHARACTER_MAP = new Map<string, CharacterConfig>([
    [HERO_CONFIG.id, HERO_CONFIG],
    [ENEMY_GOBLIN.id, ENEMY_GOBLIN],
    [ENEMY_ORC.id, ENEMY_ORC],
]);

const STAGE_MAP = new Map<string, StageConfig>([
    [STAGE_1.id, STAGE_1],
]);

export function getCharacterConfig(id: string): CharacterConfig {
    const cfg = CHARACTER_MAP.get(id);
    if (!cfg) throw new Error(`[SampleData] Unknown character config: ${id}`);
    return cfg;
}

export function getStageConfig(id: string): StageConfig {
    const cfg = STAGE_MAP.get(id);
    if (!cfg) throw new Error(`[SampleData] Unknown stage config: ${id}`);
    return cfg;
}
