import { SingleRunningChildBranch } from "../abstract/SingleRunningChildBranch";
import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";

/**
 * 它表示的是逻辑或关系，即只要有一个子节点执行成功，则返回成功。
 */
export class Selector<T> extends SingleRunningChildBranch<T> {
    protected OnChildCompleted(child: Task<T>): TaskStatus {
        // 只要子节点执行成功，则返回成功
        if (child.status == TaskStatus.Success) return TaskStatus.Success;
        // 如果所有子节点都执行完毕，则返回失败
        if (this.runningIndex + 1 == this.children.length) return TaskStatus.Failed;
        return TaskStatus.Running;
    }
}