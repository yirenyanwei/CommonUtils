import { ParalleTask } from "../abstract/ParalleTask";
import { TaskStatus } from "../TaskStatus";

/**
 * 简单的
 * 并发执行节点
 */
export class SimpleParallel<T> extends ParalleTask<T> {
    
    public Execute(): TaskStatus {
        for(let i = 0; i < this.children.length; i++){
            const child = this.children[i];
            if(child.status != TaskStatus.Running) {
                this.Template_StartChild(child, false);// 不检查
            } else {
                child.Template_Execute();
            }
            // 如果第一个节点执行完成，则进入完成状态
            if(child.status != TaskStatus.Running && i == 0) {
                return child.status;
            }

        }
        return TaskStatus.Running;
    }
     // 外部事件默认抛给第一个子节点
    public override OnEvent(evt: any) {
        if (this.children[0].status == TaskStatus.Running) {
            this.children[0].OnEvent(evt);
        }
    }
}