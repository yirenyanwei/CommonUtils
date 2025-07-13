import { Task } from "./Task";
import { TaskStatus } from "./TaskStatus";
import { ITaskEntry } from "./types-taskTree";

/**
 * 任务入口（可联想程序的Main）
 */
export class TaskEntry<T> extends Task<T> implements ITaskEntry<T> {
   private name = ""; // 行为树的名字
    private root: Task<T>; // 根节点
    // private TreeLoader treeLoader; // 行为树加载器
    
    public constructor() {
        super();
        this.tree = this; // tree指向自身    
    }
    
    // 心跳方法入口
    public Update(): TaskStatus {
        if(this.root.IsCompleted()) {
            return this.root.status;
        }
        if (this.root.status != TaskStatus.Running) {
            return this.Template_StartChild(this.root);
        }
        return this.Template_Execute();
    }
    // Execute驱动Root
    public override Execute(): TaskStatus {
        if (this.root.status != TaskStatus.Running) {
            return this.Template_StartChild(this.root);        
        }
        return this.root.Template_Execute();
    }
    // 事件转发
    public override OnEvent(evt: any) {
        if (this.root != null && this.root.status == TaskStatus.Running) {
             this.root.OnEvent(evt);
        }
    }

    public ChildCount(): number {
        return 1;
    }
    public GetChild(index: number): Task<T> {
        if(index == 0) {
            return this.root;
        }
    }
    public AddChild(child: Task<T>): void {
        this.root = child;
    }
    public RemoveChild(child: Task<T>): boolean {
        if(this.root == child) {
            this.root = null;
            return true;
        }else {
            return false;
        }
    }
}