import { SingleRunningChildBranch } from "../abstract/SingleRunningChildBranch";
import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";

/**
 * Switch在启动时选择一个子节点运行，并以子节点的运行结果作为自身结果。
 */
export class Switch<T> extends SingleRunningChildBranch<T> {
    protected OnChildCompleted(child: Task<T>): TaskStatus {
        return TaskStatus.Running;
    }
    public override Execute() {
        if (this.runningChild == null) {
            const index = this.SelectChild();
            if (index < 0) return TaskStatus.Failed;
            this.runningIndex = index;
            this.runningChild = this.children[index];
        }
        if (this.runningChild.status != TaskStatus.Running) {
            return this.Template_StartChild(this.runningChild, false); // guard已检查       
        }
        return this.runningChild.Template_Execute();
    }
    private SelectChild() {
        for (let idx = 0; idx < this.children.length; idx++) {
            const child = this.children[idx];
            if (this.Template_CheckGuard(child.guard)) {
                return idx;            
            }
        }
        return -1;
    }
    
}