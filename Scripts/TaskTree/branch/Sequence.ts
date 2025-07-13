import { SingleRunningChildBranch } from "../abstract/SingleRunningChildBranch";
import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";

/**
 * 它表示的是逻辑与关系，即只要有一个子节点执行失败，则任务失败。
 * SingleRunningChildBranch的子类
 */
export class Sequence<T> extends SingleRunningChildBranch<T> {
    protected OnChildCompleted(child: Task<T>): TaskStatus {
        this.runningChild = null;
        // 只要子节点执行失败，则返回失败
        if (child.status == TaskStatus.Failed) return TaskStatus.Failed;
        // 如果所有子节点都执行完毕，则返回成功
        if (this.runningIndex + 1 == this.children.length) return TaskStatus.Success;
        return TaskStatus.Running;
    }
    
}