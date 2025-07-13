import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";
import { BranchTask } from "./BranchTask";

/**
 * 表示只有单个运行态的子节点的Node，
 * 它是BranchTask的子类,与ParallelNode对应
 */
export abstract class SingleRunningChildBranch<T> extends BranchTask<T> {
     protected runningIndex: number = -1;
     protected runningChild: Task<T> = null;

     public override BeforeEnter(): void {
         this.runningChild = null;
         this.runningIndex = -1;
     }

     public override Execute() {
        while (true) {
            if (this.runningChild == null) {
                this.runningChild = this.NextChild();
            }
            let childStatus: TaskStatus;
            if (this.runningChild.status != TaskStatus.Running) {
                childStatus = this.Template_StartChild(this.runningChild);
            } else {
                childStatus = this.runningChild.Template_Execute();                            
            }
            // 只要当前子节点未执行结束，就不运行其它子节点
            if (childStatus == TaskStatus.Running) {
                return TaskStatus.Running;
            }
            const result = this.OnChildCompleted(this.runningChild);
            if (result != TaskStatus.Running) {
                return result;            
            }
        }    
    }
    // 获取下一个执行的节点
    protected NextChild(): Task<T> {
        return this.children[++this.runningIndex];    
    }
    
    // 尝试计算结果
    protected abstract OnChildCompleted(child: Task<T>): TaskStatus;
    
    /** 进入完成状态的子节点数量 -- 辅助子类实现 */
    public CompletedCount() {
        return this.runningIndex + 1;
    }
    
    /** 成功状态的子节点数量 -- 辅助子类实现 */
    public SucceededCount() {
        let r = 0;
        for (let i = 0; i <= this.runningIndex; i++) { // 注意 <=
            if (this.children[r].IsSucceeded) {
                r++;
            }
        }
        return r;
    }
    
    // 默认事件转发
    public override OnEvent(evt: any) {
        if (this.runningChild != null && this.runningChild.status == TaskStatus.Running) {
             this.runningChild.OnEvent(evt);
        }
    }


}

