import { LoopDecorator } from "../abstract/LoopDecorator";
import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";

/**
 * 即重复运行子节点，直到（成功、失败、失败或完成）达到指定次数。
 */
export class Repeat<T> extends LoopDecorator<T> { 
    private countMode = 0; // 0任意，1成功，2失败
    private required = 0;
    private count = 0;
    public override BeforeEnter() {
        this.count = 0;    
    }

    protected OnChildCompleted(child: Task<T>): TaskStatus {
        let match = false;
        switch (this.countMode) {
            case 0:
                match = true;
                break;
            case 1:
                match = child.status == TaskStatus.Success;
                break;
            case 2:
                match = child.status == TaskStatus.Failed;
                break;
            default:
                match = false;
                break;
        }
        if(match && this.count >= this.required) {
            return TaskStatus.Success;
        }
        return TaskStatus.Running;
    }
}