import { SingleRunningChildBranch } from "../abstract/SingleRunningChildBranch";
import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";

/**
 * 它表示选择N个子节点，即当成功的子节点达到N个时返回成功
 */
export class SelectorN<T> extends SingleRunningChildBranch<T> {
    private n: number;
    protected OnChildCompleted(child: Task<T>): TaskStatus {
        // 只要子节点执行成功，查询个数
        if (child.status == TaskStatus.Success && this.SucceededCount()>=this.n) {
            return TaskStatus.Success;
        }
        if(this.runningIndex + 1 == this.children.length) return TaskStatus.Failed;
        return TaskStatus.Running;
    }
}