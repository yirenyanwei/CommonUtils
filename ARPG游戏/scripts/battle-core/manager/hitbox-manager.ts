import { ActiveHitbox } from '../collision/hitbox';
import { SpawnHitboxTaskConfig } from '../../data/config-types';
import { CharacterEntity } from '../entity/character-entity';
import { buildAABB } from '../collision/aabb';

// ============================================================
// HitboxManager — 激活 Hitbox 的生命周期管理
// AbilityTask SpawnHitbox 调用 spawnHitbox，
// CollisionSystem 每 tick 查 getActive 做相交检测，
// tickHitboxes 负责倒计时 & 销毁。
// ============================================================

let hitboxIdCounter = 0;

export class HitboxManager {
    private readonly active: ActiveHitbox[] = [];

    spawnHitbox(caster: CharacterEntity, cfg: SpawnHitboxTaskConfig, abilityId: string): void {
        // 将相对偏移按面向方向转换为世界坐标
        const worldOffsetX = cfg.offsetX * caster.facing;
        const bounds = buildAABB(
            caster.position.x,
            caster.position.y,
            cfg.width, cfg.height,
            worldOffsetX, cfg.offsetY,
        );

        this.active.push({
            id: `hb_${++hitboxIdCounter}`,
            ownerId: caster.id,
            abilityId,
            ownerTeam: caster.team,
            bounds,
            remainingTicks: cfg.durationTicks,
            cfg,
            hitTargets: new Set(),
        });
    }

    getActive(): readonly ActiveHitbox[] {
        return this.active;
    }

    /** 每 tick 倒计时，移除过期 Hitbox（由 CollisionSystem 末尾调用） */
    tickHitboxes(): void {
        for (let i = this.active.length - 1; i >= 0; i--) {
            this.active[i].remainingTicks--;
            if (this.active[i].remainingTicks <= 0) {
                this.active.splice(i, 1);
            }
        }
    }
}
