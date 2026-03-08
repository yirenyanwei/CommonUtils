import { BehaviorNode } from "./BehaviorNode";
import { BehaviorStatus } from "./BehaviorStatus";

/**
 * 顺序节点（Sequence）
 * 按顺序执行所有子节点，只有所有子节点都成功才返回成功
 * 如果任何一个子节点失败，立即返回失败
 */
export class Sequence extends BehaviorNode {
    private currentChildIndex: number = 0;

    constructor(name: string = "Sequence") {
        super(name);
    }

    public execute(): BehaviorStatus {
        // 如果节点刚启动，初始化
        if (this.status === BehaviorStatus.Inactive) {
            this.onEnter();
            this.currentChildIndex = 0;
            this.status = BehaviorStatus.Running;
        }

        // 执行当前子节点
        while (this.currentChildIndex < this.children.length) {
            const child = this.children[this.currentChildIndex];
            
            // 初始化子节点
            if (child.getStatus() === BehaviorStatus.Inactive) {
                child.initialize(this.blackboard);
            }

            // 执行子节点
            const childStatus = child.execute();

            // 如果子节点还在运行，返回运行中
            if (childStatus === BehaviorStatus.Running) {
                this.status = BehaviorStatus.Running;
                return BehaviorStatus.Running;
            }

            // 如果子节点失败，整个序列失败
            if (childStatus === BehaviorStatus.Failure) {
                this.status = BehaviorStatus.Failure;
                this.onExit();
                this.reset();
                return BehaviorStatus.Failure;
            }

            // 子节点成功，继续下一个
            this.currentChildIndex++;
        }

        // 所有子节点都成功
        this.status = BehaviorStatus.Success;
        this.onExit();
        this.reset();
        return BehaviorStatus.Success;
    }

    public reset(): void {
        super.reset();
        this.currentChildIndex = 0;
    }
}
