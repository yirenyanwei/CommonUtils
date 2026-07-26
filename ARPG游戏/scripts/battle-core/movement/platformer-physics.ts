import { CharacterEntity } from '../entity/character-entity';
import { BattleWorld } from '../core/battle-world';

// ============================================================
// PlatformerPhysics — 重力、跳跃、地面检测、房间边界
// ============================================================

export class PlatformerPhysics {

    applyGravity(entity: CharacterEntity, world: BattleWorld): void {
        if (!entity.isGrounded) {
            entity.velocity.y -= world.gameConfig.gravity;
        }
    }

    applyJump(entity: CharacterEntity, world: BattleWorld): void {
        if (entity.isGrounded) {
            entity.velocity.y = world.gameConfig.jumpImpulse;
            entity.isGrounded = false;
        }
    }

    integrate(entity: CharacterEntity, world: BattleWorld): void {
        entity.position.x += entity.velocity.x;
        entity.position.y += entity.velocity.y;

        const ground = world.stageConfig.groundY;
        const bounds = world.stageConfig.roomBounds;

        // 落地检测
        if (entity.position.y <= ground) {
            entity.position.y = ground;
            entity.velocity.y = 0;
            entity.isGrounded = true;
        }

        // 水平边界 clamp
        const halfW = 20;
        entity.position.x = Math.max(bounds.x + halfW, Math.min(bounds.x + bounds.width - halfW, entity.position.x));

        // 水平速度衰减（模拟摩擦）
        if (entity.isGrounded) {
            entity.velocity.x *= 0.6;
            if (Math.abs(entity.velocity.x) < 0.1) entity.velocity.x = 0;
        }
    }
}
