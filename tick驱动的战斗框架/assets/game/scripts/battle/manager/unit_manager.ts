import {
    BattleConfig,
    BattleTeam,
    BattleUnitType,
    BattleVector,
    UnitConfig,
    cloneVector,
} from "../data/battle_config";
import { BattleEventType } from "../event/battle_event";
import { BattleEventBus } from "../event/battle_event_bus";
import { BattleUnit } from "../unit/battle_unit";

/** 管理战斗单位的创建、查询、移动事件、受伤和死亡事件。 */
export class UnitManager {
    private readonly units: BattleUnit[] = [];
    private readonly unitConfigMap = new Map<string, UnitConfig>();
    private readonly deadUnitIds = new Set<number>();
    private nextUnitId: number = 1;

    constructor(
        config: BattleConfig,
        private readonly eventBus: BattleEventBus,
        private readonly getTick: () => number
    ) {
        for (const unitConfig of config.unitConfigs) {
            this.unitConfigMap.set(unitConfig.configId, unitConfig);
        }
    }

    spawnUnit(configId: string, position: BattleVector): BattleUnit {
        const unitConfig = this.getUnitConfig(configId);
        const unit = new BattleUnit(this.nextUnitId, unitConfig, position);
        this.nextUnitId += 1;
        this.units.push(unit);

        this.eventBus.emit({
            type: BattleEventType.UNIT_SPAWNED,
            tick: this.getTick(),
            unitId: unit.id,
            configId: unit.configId,
            position: cloneVector(unit.position),
        });

        return unit;
    }

    getUnit(unitId: number): BattleUnit | undefined {
        return this.units.find((unit) => unit.id === unitId);
    }

    getUnits(): readonly BattleUnit[] {
        return this.units;
    }

    getAliveUnits(): BattleUnit[] {
        return this.units.filter((unit) => unit.isAlive);
    }

    getHero(): BattleUnit | undefined {
        return this.units.find((unit) => unit.unitType === BattleUnitType.HERO);
    }

    getEnemyCount(): number {
        return this.units.filter((unit) => unit.team === BattleTeam.ENEMY && unit.isAlive).length;
    }

    getUnitConfig(configId: string): UnitConfig {
        const unitConfig = this.unitConfigMap.get(configId);
        if (!unitConfig) {
            throw new Error(`Missing unit config: ${configId}`);
        }

        return unitConfig;
    }

    markUnitMoved(unit: BattleUnit): void {
        this.eventBus.emit({
            type: BattleEventType.UNIT_MOVED,
            tick: this.getTick(),
            unitId: unit.id,
            position: cloneVector(unit.position),
        });
    }

    markUnitDamaged(unit: BattleUnit, damage: number, sourceUnitId: number): void {
        this.eventBus.emit({
            type: BattleEventType.UNIT_DAMAGED,
            tick: this.getTick(),
            unitId: unit.id,
            damage,
            hp: unit.hp,
            sourceUnitId,
        });

        if (!unit.isAlive && !this.deadUnitIds.has(unit.id)) {
            this.deadUnitIds.add(unit.id);
            this.eventBus.emit({
                type: BattleEventType.UNIT_DIED,
                tick: this.getTick(),
                unitId: unit.id,
                killerUnitId: sourceUnitId,
            });
        }
    }
}
