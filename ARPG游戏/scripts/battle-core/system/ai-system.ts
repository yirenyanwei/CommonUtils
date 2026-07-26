import { BattleSystem, BattleSystemContext } from '../core/battle-director';
import { BattleWorld } from '../core/battle-world';
import { EnemyAI } from '../ai/enemy-ai';
import { getCharacterConfig } from '../../data/sample-data';
import { EnemyConfig } from '../../data/config-types';

// ============================================================
// AiSystem — 驱动敌人 AI 决策 & 执行意图
// ============================================================

export class AiSystem implements BattleSystem {
    readonly name = 'AiSystem';

    constructor(private readonly ai: EnemyAI) {}

    update(world: BattleWorld, _context: BattleSystemContext): void {
        const enemies = world.entityManager.getAliveByTeam('enemy');

        for (const enemy of enemies) {
            if (enemy.asc.hasActiveAbility()) continue;

            const intent = this.ai.think(enemy, world.entityManager);

            switch (intent.type) {
                case 'moveToward': {
                    const target = world.entityManager.get(intent.targetId);
                    if (!target) break;
                    const dx = target.position.x - enemy.position.x;
                    const cfg = getCharacterConfig(enemy.configId) as EnemyConfig;
                    const speed = cfg.chaseSpeed;
                    enemy.facing = dx > 0 ? 1 : -1;
                    enemy.velocity.x = Math.sign(dx) * speed;
                    break;
                }
                case 'attack': {
                    const cfg = getCharacterConfig(enemy.configId);
                    const seg = cfg.comboConfig.segments[0];
                    enemy.velocity.x = 0;
                    enemy.asc.tryActivateAbility(seg.abilityId, world);
                    break;
                }
                case 'idle':
                    enemy.velocity.x = 0;
                    break;
            }
        }
    }
}
