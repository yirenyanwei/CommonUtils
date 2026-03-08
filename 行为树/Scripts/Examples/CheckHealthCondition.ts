import { Condition } from "../Condition";
import { BehaviorStatus } from "../BehaviorStatus";

/**
 * 检查生命值条件示例
 */
export class CheckHealthCondition extends Condition {
    private minHealth: number;

    constructor(minHealth: number = 50) {
        super("CheckHealth");
        this.minHealth = minHealth;
    }

    protected check(): BehaviorStatus {
        const health = this.blackboard.get<number>("health", 100);
        if (health >= this.minHealth) {
            return BehaviorStatus.Success;
        }
        return BehaviorStatus.Failure;
    }
}
