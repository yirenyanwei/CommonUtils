import { CharacterEntity } from '../entity/character-entity';
import { EntityManager } from '../manager/entity-manager';
import { EnemyConfig, Tags } from '../../data/config-types';
import { getCharacterConfig } from '../../data/sample-data';

// ============================================================
// EnemyAI — 简单状态机 AI（Idle → Chase → Attack）
// 每 tick 由 AiSystem 调用 think()，
// 返回意图指令，不直接修改实体状态。
// ============================================================

export type AiIntent =
    | { type: 'idle' }
    | { type: 'moveToward'; targetId: string }
    | { type: 'attack'; targetId: string };

export class EnemyAI {
    think(enemy: CharacterEntity, entityManager: EntityManager): AiIntent {
        if (!enemy.isAlive) return { type: 'idle' };
        if (enemy.asc.tags.hasTag(Tags.Stunned)) return { type: 'idle' };
        if (enemy.asc.hasActiveAbility()) return { type: 'idle' };

        const player = entityManager.getPlayer();
        if (!player || !player.isAlive) return { type: 'idle' };

        const cfg = getCharacterConfig(enemy.configId) as EnemyConfig;
        if (!('detectRange' in cfg)) return { type: 'idle' };

        const dx = player.position.x - enemy.position.x;
        const dist = Math.abs(dx);

        if (dist <= cfg.attackRange) {
            return { type: 'attack', targetId: player.id };
        }
        if (dist <= cfg.detectRange) {
            return { type: 'moveToward', targetId: player.id };
        }
        return { type: 'idle' };
    }
}
