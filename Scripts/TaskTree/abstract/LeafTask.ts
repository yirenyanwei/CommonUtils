import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";

/**
 * 叶子节点
 * 表示没有子节点的Node。
 * 因此 LeafNode 是业务代码的主要承载点。
 */
export abstract class LeafTask<T> extends Task<T> {
    public ChildCount(): number {
        return 0;
    }
    public GetChild(index: number): Task<T> {
        throw new Error("No Child");
    }
    public AddChild(child: Task<T>): void {
        throw new Error("No Child");
    }
    public RemoveChild(child: Task<T>): boolean {
        return false;
    }
     
}