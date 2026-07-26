import { AABB } from './aabb';
import { SpawnHitboxTaskConfig } from '../../data/config-types';

// ============================================================
// Hitbox / Hurtbox 定义
// Hitbox  = 攻击判定框（技能激活时生成）
// Hurtbox = 受击判定框（实体始终持有）
// ============================================================

export interface ActiveHitbox {
    id: string;
    ownerId: string;
    abilityId: string;
    /** 攻击方队伍 */
    ownerTeam: 'player' | 'enemy';
    bounds: AABB;
    remainingTicks: number;
    cfg: SpawnHitboxTaskConfig;
    /** 已经命中过的目标 id（默认同一次激活只命中一次） */
    hitTargets: Set<string>;
}

export interface Hurtbox {
    ownerId: string;
    bounds: AABB;
}
