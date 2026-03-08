import { Decorator } from "./Decorator";
import { BehaviorStatus } from "./BehaviorStatus";

/**
 * 反转节点（Inverter）
 * 反转子节点的结果：成功变失败，失败变成功，运行中保持运行中
 */
export class Inverter extends Decorator {
    constructor(name: string = "Inverter") {
        super(name);
    }

    public execute(): BehaviorStatus {
        if (this.child === null) {
            return BehaviorStatus.Failure;
        }

        if (this.status === BehaviorStatus.Inactive) {
            this.onEnter();
            this.status = BehaviorStatus.Running;
        }

        if (this.child.getStatus() === BehaviorStatus.Inactive) {
            this.child.initialize(this.blackboard);
        }

        const childStatus = this.child.execute();

        // 反转结果
        if (childStatus === BehaviorStatus.Success) {
            this.status = BehaviorStatus.Failure;
            this.onExit();
            this.reset();
            return BehaviorStatus.Failure;
        } else if (childStatus === BehaviorStatus.Failure) {
            this.status = BehaviorStatus.Success;
            this.onExit();
            this.reset();
            return BehaviorStatus.Success;
        } else {
            // Running状态保持不变
            this.status = BehaviorStatus.Running;
            return BehaviorStatus.Running;
        }
    }
}
