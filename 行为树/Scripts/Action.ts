import { BehaviorNode } from "./BehaviorNode";
import { BehaviorStatus } from "./BehaviorStatus";

/**
 * 动作节点基类（Action）
 * 用于执行具体的游戏逻辑
 */
export abstract class Action extends BehaviorNode {
    constructor(name: string = "Action") {
        super(name);
    }

    public execute(): BehaviorStatus {
        // 如果节点刚启动，调用onEnter
        if (this.status === BehaviorStatus.Inactive) {
            this.onEnter();
            this.status = BehaviorStatus.Running;
        }

        // 如果节点正在运行，调用onUpdate
        if (this.status === BehaviorStatus.Running) {
            const result = this.onUpdate();
            this.status = result;

            // 如果节点完成，调用onExit
            if (this.isComplete()) {
                this.onExit();
            }
        }

        return this.status;
    }

    /**
     * 子类实现具体的动作逻辑
     * 返回Success表示动作完成，返回Failure表示动作失败，返回Running表示动作进行中
     */
    protected abstract onUpdate(): BehaviorStatus;
}
