import { DecoratorTask } from "../abstract/DecoratorTask";
import { TaskStatus } from "../TaskStatus";

/**
 * Inverter 被翻译为 “逆变”节点，它对应着我们编程语言中的取反操作（not）
 */
export class Inverter<T> extends DecoratorTask<T> {
    /**
     * 运行
     * @returns 
     */
    public override Execute(): TaskStatus {
        let status: TaskStatus;
        if(this.child.status != TaskStatus.Running) {
            status = this.Template_StartChild(this.child);
        }else {
            status = this.child.Template_Execute();
        }
        if(status == TaskStatus.Running) return status;
        if(status == TaskStatus.Success) return TaskStatus.Failed;
        return TaskStatus.Success;
    }
}