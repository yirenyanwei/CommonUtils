import { BehaviorNode } from "./BehaviorNode";
import { BehaviorStatus } from "./BehaviorStatus";

/**
 * 选择节点（Selector）
 * 按顺序执行子节点，只要有一个子节点成功就返回成功
 * 如果所有子节点都失败，返回失败
 */
export class Selector extends BehaviorNode {
    private currentChildIndex: number = 0;

    constructor(name: string = "Selector") {
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

            // 如果子节点成功，整个选择器成功
            if (childStatus === BehaviorStatus.Success) {
                this.status = BehaviorStatus.Success;
                this.onExit();
                this.reset();
                return BehaviorStatus.Success;
            }

            // 子节点失败，继续下一个
            this.currentChildIndex++;
        }

        // 所有子节点都失败
        this.status = BehaviorStatus.Failure;
        this.onExit();
        this.reset();
        return BehaviorStatus.Failure;
    }

    public reset(): void {
        super.reset();
        this.currentChildIndex = 0;
    }
}
