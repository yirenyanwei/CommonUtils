import { BehaviorStatus } from "./BehaviorStatus";
import { Blackboard } from "./Blackboard";

/**
 * 行为树节点基类
 */
export abstract class BehaviorNode {
    /** 节点名称 */
    public name: string;
    /** 黑板引用 */
    protected blackboard: Blackboard;
    /** 当前状态 */
    protected status: BehaviorStatus = BehaviorStatus.Inactive;
    /** 父节点 */
    protected parent: BehaviorNode | null = null;
    /** 子节点列表 */
    protected children: BehaviorNode[] = [];

    constructor(name: string = "") {
        this.name = name;
    }

    /**
     * 初始化节点
     */
    public initialize(blackboard: Blackboard): void {
        this.blackboard = blackboard;
        this.status = BehaviorStatus.Inactive;
    }

    /**
     * 执行节点逻辑（子类必须实现）
     */
    public abstract execute(): BehaviorStatus;

    /**
     * 节点进入时调用
     */
    protected onEnter(): void {}

    /**
     * 节点退出时调用
     */
    protected onExit(): void {}

    /**
     * 节点更新时调用
     */
    protected onUpdate(): BehaviorStatus {
        return BehaviorStatus.Success;
    }

    /**
     * 重置节点状态
     */
    public reset(): void {
        this.status = BehaviorStatus.Inactive;
        for (const child of this.children) {
            child.reset();
        }
    }

    /**
     * 获取当前状态
     */
    public getStatus(): BehaviorStatus {
        return this.status;
    }

    /**
     * 设置父节点
     */
    public setParent(parent: BehaviorNode | null): void {
        this.parent = parent;
    }

    /**
     * 添加子节点
     */
    public addChild(child: BehaviorNode): void {
        child.setParent(this);
        this.children.push(child);
    }

    /**
     * 移除子节点
     */
    public removeChild(child: BehaviorNode): boolean {
        const index = this.children.indexOf(child);
        if (index >= 0) {
            this.children.splice(index, 1);
            child.setParent(null);
            return true;
        }
        return false;
    }

    /**
     * 获取子节点数量
     */
    public getChildCount(): number {
        return this.children.length;
    }

    /**
     * 获取子节点
     */
    public getChild(index: number): BehaviorNode {
        return this.children[index];
    }

    /**
     * 检查节点是否完成（成功或失败）
     */
    public isComplete(): boolean {
        return this.status === BehaviorStatus.Success || 
               this.status === BehaviorStatus.Failure;
    }

    /**
     * 检查节点是否成功
     */
    public isSuccess(): boolean {
        return this.status === BehaviorStatus.Success;
    }

    /**
     * 检查节点是否失败
     */
    public isFailure(): boolean {
        return this.status === BehaviorStatus.Failure;
    }

    /**
     * 检查节点是否运行中
     */
    public isRunning(): boolean {
        return this.status === BehaviorStatus.Running;
    }
}
