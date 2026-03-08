import { Decorator } from "./Decorator";
import { BehaviorStatus } from "./BehaviorStatus";

/**
 * 重复节点（Repeat）
 * 重复执行子节点指定次数
 */
export class Repeat extends Decorator {
    private repeatCount: number;
    private currentCount: number = 0;

    constructor(repeatCount: number, name: string = "Repeat") {
        super(name);
        this.repeatCount = repeatCount;
    }

    public execute(): BehaviorStatus {
        if (this.child === null) {
            return BehaviorStatus.Failure;
        }

        if (this.status === BehaviorStatus.Inactive) {
            this.onEnter();
            this.currentCount = 0;
            this.status = BehaviorStatus.Running;
        }

        // 如果已经达到重复次数，返回成功
        if (this.currentCount >= this.repeatCount) {
            this.status = BehaviorStatus.Success;
            this.onExit();
            this.reset();
            return BehaviorStatus.Success;
        }

        // 初始化子节点
        if (this.child.getStatus() === BehaviorStatus.Inactive) {
            this.child.initialize(this.blackboard);
        }

        // 执行子节点
        const childStatus = this.child.execute();

        // 如果子节点还在运行，继续运行
        if (childStatus === BehaviorStatus.Running) {
            this.status = BehaviorStatus.Running;
            return BehaviorStatus.Running;
        }

        // 子节点完成（成功或失败），重置并继续下一次
        this.currentCount++;
        this.child.reset();

        // 如果还没达到重复次数，继续运行
        if (this.currentCount < this.repeatCount) {
            this.status = BehaviorStatus.Running;
            return BehaviorStatus.Running;
        }

        // 达到重复次数，返回成功
        this.status = BehaviorStatus.Success;
        this.onExit();
        this.reset();
        return BehaviorStatus.Success;
    }

    public reset(): void {
        super.reset();
        this.currentCount = 0;
    }
}
