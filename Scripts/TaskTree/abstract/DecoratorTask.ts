import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";

/**
 * 即装饰节点，表示拥有 0 ~ 1 个子节点的Node。
 */
export abstract class DecoratorTask<T> extends Task<T> {
    protected child?: Task<T>;
    public ChildCount(): number {
        return this.child ? 1 : 0;
    }
    public GetChild(index: number): Task<T> {
        if(index == 0) {
            return this.child;
        }
    }
    public AddChild(child: Task<T>): void {
        if(this.child) {
            throw new Error("DecoratorTask can only have one child.");
        }
        this.child = child;
    }
    public RemoveChild(child: Task<T>): boolean {
        if(this.child == child) {
            this.child = null;
            return true;
        }
        return false;
    }

    // 默认事件转发
    public override OnEvent(evt: any) {
        if (this.child != null && this.child.status == TaskStatus.Running) {
             this.child.OnEvent(evt);
        }
    }
     
}