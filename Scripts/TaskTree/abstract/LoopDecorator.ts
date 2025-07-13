import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";
import { DecoratorTask } from "./DecoratorTask";

/**
 * 即“循环”装饰节点，对应我们编程语言中的 do-while，或者 repeat - until。
 */
export abstract class LoopDecorator<T> extends DecoratorTask<T> {
    public override Execute() {
        while (true) {
            let childStatus: TaskStatus;
            if (this.child.status != TaskStatus.Running) {
                childStatus = this.Template_StartChild(this.child);
            } else {
                childStatus = this.child.Template_Execute();                            
            }
            // 只要当前子节点未执行结束，就不运行其它子节点
            if (childStatus == TaskStatus.Running) {
                return TaskStatus.Running;
            }
            const result = this.OnChildCompleted(this.child);
            if (result != TaskStatus.Running) {
                return result;            
            }
        }
    }
    // 尝试计算结果
    protected abstract OnChildCompleted(child: Task<T>): TaskStatus;
}