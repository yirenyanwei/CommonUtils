import { DecoratorTask } from "../abstract/DecoratorTask";
import { TaskStatus } from "../TaskStatus";

/**
 * AlwaysCheckGuard 即每一帧检查子节点的前提（guard），
 * 如果子节点不再满足执行条件，则终止运行；
 */
export class AlwaysCheckGuard<T> extends DecoratorTask<T> {
    public override Execute(): TaskStatus {
        if (!this.Template_CheckGuard(this.child.guard)) {
            this.child.Stop();
            return TaskStatus.Failed;
        }
        if (this.child.status != TaskStatus.Running) {
            this.Template_StartChild(this.child);
        }
        return this.child.Template_Execute();
    }
}