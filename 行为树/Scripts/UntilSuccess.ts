import { Decorator } from "./Decorator";
import { BehaviorStatus } from "./BehaviorStatus";

/**
 * 直到成功节点（UntilSuccess）
 * 重复执行子节点直到成功
 */
export class UntilSuccess extends Decorator {
    public execute(): BehaviorStatus {
        if (this.child === null) {
            return BehaviorStatus.Failure;
        }

        if (this.status === BehaviorStatus.Inactive) {
            this.onEnter();
            this.status = BehaviorStatus.Running;
        }

        // 初始化子节点
        if (this.child.getStatus() === BehaviorStatus.Inactive) {
            this.child.initialize(this.blackboard);
        }

        // 执行子节点
        const childStatus = this.child.execute();

        // 如果子节点成功，返回成功
        if (childStatus === BehaviorStatus.Success) {
            this.status = BehaviorStatus.Success;
            this.onExit();
            this.reset();
            return BehaviorStatus.Success;
        }

        // 如果子节点失败，重置并继续执行
        if (childStatus === BehaviorStatus.Failure) {
            this.child.reset();
            this.status = BehaviorStatus.Running;
            return BehaviorStatus.Running;
        }

        // 子节点还在运行
        this.status = BehaviorStatus.Running;
        return BehaviorStatus.Running;
    }
}
