import { Projectile } from "../ability/projectile";
import { BattleEventType } from "../event/battle_event";
import { BattleEventBus } from "../event/battle_event_bus";
import { DamageResolver } from "../resolver/damage_resolver";
import { BattleUnit } from "../unit/battle_unit";
import { cloneVector } from "../data/battle_config";
import { UnitManager } from "./unit_manager";

/** 管理投射物的创建、移动、命中和伤害结算。 */
export class ProjectileManager {
    private readonly projectiles: Projectile[] = [];
    private nextProjectileId: number = 1;

    constructor(
        private readonly eventBus: BattleEventBus,
        private readonly unitManager: UnitManager,
        private readonly damageResolver: DamageResolver,
        private readonly getTick: () => number
    ) {}

    spawnProjectile(source: BattleUnit, target: BattleUnit): Projectile {
        const projectile = new Projectile(
            this.nextProjectileId,
            source.id,
            target.id,
            source.stats.attack,
            source.stats.projectileSpeed,
            source.position
        );
        this.nextProjectileId += 1;
        this.projectiles.push(projectile);

        this.eventBus.emit({
            type: BattleEventType.PROJECTILE_SPAWNED,
            tick: this.getTick(),
            projectileId: projectile.id,
            sourceUnitId: source.id,
            targetUnitId: target.id,
            position: cloneVector(projectile.position),
        });

        return projectile;
    }

    update(): void {
        for (const projectile of this.projectiles) {
            if (!projectile.isAlive) {
                continue;
            }

            const target = this.unitManager.getUnit(projectile.targetUnitId);
            if (!target?.isAlive) {
                projectile.isAlive = false;
                continue;
            }

            this.moveProjectile(projectile, target);
        }

        for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
            if (!this.projectiles[index].isAlive) {
                this.projectiles.splice(index, 1);
            }
        }
    }

    private moveProjectile(projectile: Projectile, target: BattleUnit): void {
        const deltaX = target.position.x - projectile.position.x;
        const deltaY = target.position.y - projectile.position.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance <= projectile.speed || distance <= 0.001) {
            projectile.position.x = target.position.x;
            projectile.position.y = target.position.y;
            projectile.isAlive = false;

            this.eventBus.emit({
                type: BattleEventType.PROJECTILE_HIT,
                tick: this.getTick(),
                projectileId: projectile.id,
                sourceUnitId: projectile.sourceUnitId,
                targetUnitId: projectile.targetUnitId,
            });

            const result = this.damageResolver.applyDamage(target, projectile.damage);
            this.unitManager.markUnitDamaged(target, result.damage, projectile.sourceUnitId);
            return;
        }

        projectile.position.x += deltaX / distance * projectile.speed;
        projectile.position.y += deltaY / distance * projectile.speed;

        this.eventBus.emit({
            type: BattleEventType.PROJECTILE_MOVED,
            tick: this.getTick(),
            projectileId: projectile.id,
            position: cloneVector(projectile.position),
        });
    }
}
