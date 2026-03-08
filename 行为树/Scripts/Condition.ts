import { BehaviorNode } from "./BehaviorNode";
import { BehaviorStatus } from "./BehaviorStatus";

/**
 * 条件节点基类（Condition）
 * 用于检查条件，立即返回成功或失败
 */
export abstract class Condition extends BehaviorNode {
    constructor(name: string = "Condition") {
        super(name);
    }

    public execute(): BehaviorStatus {
        // 条件节点每次执行都重新检查
        if (this.status === BehaviorStatus.Inactive) {
            this.onEnter();
        }

        // 检查条件
        const result = this.check();
        this.status = result;

        if (this.isComplete()) {
            this.onExit();
        }

        return this.status;
    }

    /**
     * 子类实现具体的条件检查逻辑
     * 返回Success表示条件满足，返回Failure表示条件不满足
     */
    protected abstract check(): BehaviorStatus;
}
