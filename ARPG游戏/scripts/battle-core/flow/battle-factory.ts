import { GameConfig, StageConfig } from '../../data/config-types';
import { getCharacterConfig } from '../../data/sample-data';
import { BattleWorld } from '../core/battle-world';
import { BattleCore } from '../core/battle-core';
import { BattleDirector } from '../core/battle-director';
import { InputCommandQueue } from '../command/input-command-queue';
import { EntityManager } from '../manager/entity-manager';
import { HitboxManager } from '../manager/hitbox-manager';
import { DamageResolver } from '../resolver/damage-resolver';
import { DamagePipeline } from '../combat/damage-pipeline';
import { PlatformerPhysics } from '../movement/platformer-physics';
import { BattleOutcome } from './battle-outcome';
import { EnemyAI } from '../ai/enemy-ai';
import { CharacterEntity } from '../entity/character-entity';
import { BattleEventType } from '../event/battle-event';

// ── Systems ──────────────────────────────────────────────────
import { InputSystem } from '../system/input-system';
import { TagTickSystem } from '../system/tag-tick-system';
import { AbilitySystem } from '../system/ability-system';
import { MovementSystem } from '../system/movement-system';
import { CollisionSystem } from '../system/collision-system';
import { HitReactionSystem } from '../system/hit-reaction-system';
import { ComboSystem } from '../system/combo-system';
import { AttributeRegenSystem } from '../system/attribute-regen-system';
import { AiSystem } from '../system/ai-system';
import { BattleResultSystem } from '../system/battle-result-system';

// ============================================================
// BattleFactory — 组装战斗全部依赖并产出 BattleCore
// ============================================================

export class BattleFactory {
    create(gameConfig: GameConfig, stageConfig: StageConfig, seed: number): BattleCore {
        // ─── 世界上下文 ──────────────────────────────────────
        const world = new BattleWorld(gameConfig, stageConfig, seed);

        // ─── 管理器 & 结算器 ─────────────────────────────────
        const entityManager = new EntityManager();
        const hitboxManager = new HitboxManager();
        const damageResolver = new DamageResolver();
        const damagePipeline = new DamagePipeline();
        const physics = new PlatformerPhysics();
        const outcome = new BattleOutcome();
        const enemyAI = new EnemyAI();

        // 注入到 world，供 Task/System 通过 world 访问
        world.entityManager = entityManager;
        world.hitboxManager = hitboxManager;
        world.damageResolver = damageResolver;

        // ─── 生成实体 ────────────────────────────────────────
        const playerCfg = getCharacterConfig(stageConfig.playerConfigId);
        const player = new CharacterEntity(
            entityManager.generateId('player'),
            playerCfg,
            'player',
            stageConfig.playerSpawn,
        );
        player.facing = 1;
        entityManager.add(player);

        for (const spawnEntry of stageConfig.enemies) {
            const cfg = getCharacterConfig(spawnEntry.configId);
            const enemy = new CharacterEntity(
                entityManager.generateId('enemy'),
                cfg,
                'enemy',
                { x: spawnEntry.x, y: spawnEntry.y },
            );
            enemy.facing = -1;
            entityManager.add(enemy);
        }

        // ─── System 管线（按执行顺序）───────────────────────
        const systems = [
            new InputSystem(),
            new TagTickSystem(),
            new AbilitySystem(),
            new MovementSystem(physics),
            new CollisionSystem(damagePipeline, damageResolver),
            new HitReactionSystem(),
            new ComboSystem(),
            new AttributeRegenSystem(),
            new AiSystem(enemyAI),
            new BattleResultSystem(outcome),
        ];

        const director = new BattleDirector(systems);
        const inputQueue = new InputCommandQueue();

        // ─── 发布 BATTLE_START 事件 ──────────────────────────
        const allEntities = entityManager.getAll();
        world.eventBus.emit({
            type: BattleEventType.BATTLE_START,
            tick: 0,
            entities: allEntities.map(e => ({
                entityId: e.id,
                configId: e.configId,
                team: e.team,
                position: { ...e.position },
                hp: e.asc.attributes.getValue('hp'),
                maxHp: e.asc.attributes.getValue('maxHp'),
                mp: e.asc.attributes.getValue('mp'),
                maxMp: e.asc.attributes.getValue('maxMp'),
            })),
            room: {
                bounds: stageConfig.roomBounds,
                groundY: stageConfig.groundY,
            },
        });

        return new BattleCore(world, director, inputQueue);
    }
}
