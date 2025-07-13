import { Task } from "../Task";

/**
 * 组合节点 CompositeNode，即组合节点，又称分支节点，表示拥有 0 ~ N 个子节点的Node
 */
export abstract class BranchTask<T> extends Task<T> {
    protected children: Task<T>[] = [];
    public ChildCount(): number {
        return this.children.length;
    }
    public GetChild(index: number): Task<T> {
        return this.children[index];
    }
    public AddChild(child: Task<T>): void {
        this.children.push(child);
    }
    public RemoveChild(child: Task<T>): boolean {
        const index = this.children.indexOf(child);
        if(index >= 0) {
            this.children.splice(index, 1);
            return true;
        }
        return false;
    }
     
}