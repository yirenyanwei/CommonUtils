import { BattleTeam, BattleUnitType, BattleVector, UnitConfig, cloneVector } from "../data/battle_config";
import { UnitStats } from "./unit_stats";

export class BattleUnit {
    readonly id: number;
    readonly configId: string;
    readonly unitType: BattleUnitType;
    readonly team: BattleTeam;
    readonly stats: UnitStats;
    readonly position: BattleVector;
    hp: number;
    nextAttackTick: number = 0;

    constructor(id: number, config: UnitConfig, position: BattleVector) {
        this.id = id;
        this.configId = config.configId;
        this.unitType = config.unitType;
        this.team = config.team;
        this.stats = new UnitStats(config.stats);
        this.position = cloneVector(position);
        this.hp = this.stats.maxHp;
    }

    get isAlive(): boolean {
        return this.hp > 0;
    }

    moveBy(delta: BattleVector): void {
        this.position.x += delta.x;
        this.position.y += delta.y;
    }

    takeDamage(damage: number): void {
        this.hp = Math.max(0, this.hp - damage);
    }
}
