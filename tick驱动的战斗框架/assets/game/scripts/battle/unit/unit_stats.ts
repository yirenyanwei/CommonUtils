import { UnitStatsConfig } from "../data/battle_config";

export class UnitStats {
    readonly maxHp: number;
    readonly attack: number;
    readonly attackRange: number;
    readonly attackIntervalTicks: number;
    readonly moveSpeed: number;
    readonly projectileSpeed: number;

    constructor(config: UnitStatsConfig) {
        this.maxHp = config.maxHp;
        this.attack = config.attack;
        this.attackRange = config.attackRange;
        this.attackIntervalTicks = config.attackIntervalTicks;
        this.moveSpeed = config.moveSpeed;
        this.projectileSpeed = config.projectileSpeed;
    }
}
