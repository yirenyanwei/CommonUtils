import { BattleSystem, BattleSystemContext } from '../core/battle-director';
import { BattleWorld } from '../core/battle-world';
import { PlatformerPhysics } from '../movement/platformer-physics';
import { BattleEventType } from '../event/battle-event';
import { Tags } from '../../data/config-types';
import { getCharacterConfig } from '../../data/sample-data';

// ============================================================
// MovementSystem — 移动 & 物理积分
// BlockMove Tag 生效时玩家输入移动无效，但物理（重力/击退）继续
// ============================================================

export class MovementSystem implements BattleSystem {
    readonly name = 'MovementSystem';

    constructor(private readonly physics: PlatformerPhysics) {}

    update(world: BattleWorld, context: BattleSystemContext): void {
        for (const entity of world.entityManager.getAllAlive()) {
            const isPlayer = entity.team === 'player';
            const blocked  = entity.asc.tags.hasTag(Tags.BlockMove);

            if (isPlayer && !blocked && !entity.asc.hasActiveAbility()) {
                // 玩家水平移动意图
                if (context.moveX !== 0) {
                    const cfg = getCharacterConfig(entity.configId);
                    const speed = entity.asc.attributes.getValue('moveSpeed');
                    entity.velocity.x = context.moveX * speed;
                    entity.facing = context.moveX > 0 ? 1 : -1;
                }

                // 跳跃
                if (context.jumpRequested && entity.isGrounded) {
                    this.physics.applyJump(entity, world);
                }
            }

            // 重力 & 积分（所有实体）
            this.physics.applyGravity(entity, world);
            this.physics.integrate(entity, world);

            // 发出 ENTITY_MOVE 事件
            world.eventBus.emit({
                type: BattleEventType.ENTITY_MOVE,
                tick: world.tick,
                entityId: entity.id,
                x: entity.position.x,
                y: entity.position.y,
                facing: entity.facing,
                isGrounded: entity.isGrounded,
            });
        }
    }
}
