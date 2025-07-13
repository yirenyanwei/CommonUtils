import { SingleRunningChildBranch } from "../abstract/SingleRunningChildBranch";
import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";

/**
 *  Foreach对应我们编程中的 foreach，即迭代所有子节点，然后返回成功
 */
export class Foreach<T> extends SingleRunningChildBranch<T> {
    protected OnChildCompleted(child: Task<T>): TaskStatus {
        if(this.runningIndex+1==this.children.length) return TaskStatus.Success;

        return TaskStatus.Running;
    } 
}