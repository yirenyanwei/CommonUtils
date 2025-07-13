import { SingleRunningChildBranch } from "../abstract/SingleRunningChildBranch";
import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";

/**
 * ActiveSelector是每一帧（每次心跳）都重新选择子节点，
 * 如果新选择的子节点和当前子节点不同，则取消当前子节点的运行，并运行新的子节点。
 */
class ActiveSelector<T> extends SingleRunningChildBranch<T> {
    protected OnChildCompleted(child: Task<T>): TaskStatus {
        return TaskStatus.Running;
    }

    public override Execute() {
        const idx = this.SelectChild();
        // 如果新选择的节点不是当前运行的节点，则停止运行
        if (this.runningIndex >= 0 && this.runningIndex != idx) {
            this.runningChild.Stop();
            this.runningIndex = -1;
            this.runningChild = null;
        }
        // 无可运行节点
        if (idx < 0) return TaskStatus.Failed;
        this.runningIndex = idx;
        this.runningChild = this.children[idx];
        // 继续运行或启动新节点
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