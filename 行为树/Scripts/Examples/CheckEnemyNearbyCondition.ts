import { Condition } from "../Condition";
import { BehaviorStatus } from "../BehaviorStatus";

/**
 * 检查附近是否有敌人条件示例
 */
export class CheckEnemyNearbyCondition extends Condition {
    private maxDistance: number;

    constructor(maxDistance: number = 10) {
        super("CheckEnemyNearby");
        this.maxDistance = maxDistance;
    }

    protected check(): BehaviorStatus {
        const hasEnemy = this.blackboard.get<boolean>("hasEnemyNearby", false);
        if (hasEnemy) {
            return BehaviorStatus.Success;
        }
        return BehaviorStatus.Failure;
    }
}
