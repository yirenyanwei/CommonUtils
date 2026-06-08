import { BattleVector, cloneVector } from "../data/battle_config";

export class Projectile {
    readonly id: number;
    readonly sourceUnitId: number;
    readonly targetUnitId: number;
    readonly damage: number;
    readonly speed: number;
    readonly position: BattleVector;
    isAlive: boolean = true;

    constructor(
        id: number,
        sourceUnitId: number,
        targetUnitId: number,
        damage: number,
        speed: number,
        position: BattleVector
    ) {
        this.id = id;
        this.sourceUnitId = sourceUnitId;
        this.targetUnitId = targetUnitId;
        this.damage = damage;
        this.speed = speed;
        this.position = cloneVector(position);
    }
}
