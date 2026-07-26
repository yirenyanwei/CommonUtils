import { BattleSystem, BattleSystemContext, HitResult } from '../core/battle-director';
import { BattleWorld } from '../core/battle-world';
import { DamagePipeline } from '../combat/damage-pipeline';
import { DamageResolver } from '../resolver/damage-resolver';
import { aabbOverlap, buildAABB } from '../collision/aabb';
import { getCharacterConfig } from '../../data/sample-data';

// ============================================================
// CollisionSystem — Hitbox ∩ Hurtbox 相交检测
// 检测到命中 → 调用 DamageResolver 计算伤害 → DamagePipeline 结算
// ============================================================

export class CollisionSystem implements BattleSystem {
    readonly name = 'CollisionSystem';

    constructor(
        private readonly pipeline: DamagePipeline,
        private readonly resolver: DamageResolver,
    ) {}

    update(world: BattleWorld, context: BattleSystemContext): void {
        const hitboxes = world.hitboxManager.getActive();
        const allAlive = world.entityManager.getAllAlive();

        for (const hb of hitboxes) {
            const attacker = world.entityManager.get(hb.ownerId);
            if (!attacker || !attacker.isAlive) continue;

            for (const target of allAlive) {
                // 不能攻击同队
                if (target.team === hb.ownerTeam) continue;
                // 防止重复命中
                if (!hb.cfg.canHitMultipleTimes && hb.hitTargets.has(target.id)) continue;

                // 构建目标 Hurtbox
                const targetCfg = getCharacterConfig(target.configId);
                const { hurtbox } = targetCfg;
                const targetAABB = buildAABB(
                    target.position.x, target.position.y,
                    hurtbox.width, hurtbox.height,
                    0, hurtbox.offsetY,
                );

                if (aabbOverlap(hb.bounds, targetAABB)) {
                    hb.hitTargets.add(target.id);

                    // 伤害计算
                    const dmgResult = this.resolver.compute(
                        { attacker, target, atkMultiplier: 1.0, flatBonus: 0 },
                        world.gameConfig,
                        world.random,
                    );

                    // 伤害结算
                    this.pipeline.apply(
                        {
                            attacker,
                            target,
                            result: dmgResult,
                            knockbackX: hb.cfg.knockbackX ?? 0,
                            knockbackY: hb.cfg.knockbackY ?? 0,
                            onHitGeIds: hb.cfg.onHitGeIds,
                        },
                        world,
                    );

                    // 记录 HitResult 供 HitReactionSystem 读取
                    context.hitResults.push({
                        attackerId: attacker.id,
                        targetId: target.id,
                        hitboxId: hb.id,
                        knockbackX: hb.cfg.knockbackX ?? 0,
                        knockbackY: hb.cfg.knockbackY ?? 0,
                        onHitGeIds: hb.cfg.onHitGeIds,
                    });
                }
            }
        }

        // 倒计时 & 清理过期 Hitbox
        world.hitboxManager.tickHitboxes();
    }
}
