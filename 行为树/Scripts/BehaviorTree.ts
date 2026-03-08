import { BehaviorNode } from "./BehaviorNode";
import { BehaviorStatus } from "./BehaviorStatus";
import { Blackboard } from "./Blackboard";

/**
 * 行为树主类
 */
export class BehaviorTree {
    private root: BehaviorNode | null = null;
    private blackboard: Blackboard;

    constructor(blackboard?: Blackboard) {
        this.blackboard = blackboard || new Blackboard();
    }

    /**
     * 设置根节点
     */
    public setRoot(root: BehaviorNode): void {
        this.root = root;
        if (this.root) {
            this.root.initialize(this.blackboard);
        }
    }

    /**
     * 获取根节点
     */
    public getRoot(): BehaviorNode | null {
        return this.root;
    }

    /**
     * 获取黑板
     */
    public getBlackboard(): Blackboard {
        return this.blackboard;
    }

    /**
     * 更新行为树（每帧调用）
     */
    public update(): BehaviorStatus {
        if (this.root === null) {
            return BehaviorStatus.Failure;
        }

        return this.root.execute();
    }

    /**
     * 重置行为树
     */
    public reset(): void {
        if (this.root) {
            this.root.reset();
        }
    }

    /**
     * 检查行为树是否完成
     */
    public isComplete(): boolean {
        if (this.root === null) {
            return true;
        }
        return this.root.isComplete();
    }
}
