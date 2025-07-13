/**
 * Task代表任务数（行为树）中的一个任务。
 */

import { TaskStatus } from "./TaskStatus";
import { ITaskEntry } from "./types-taskTree";

export abstract class Task<T> {
    // 行为树入口引用
    public tree: ITaskEntry<T>;
    // 父节点
    public parent: Task<T>;
    // 前置条件 -- precondition
    public guard: Task<T> ;
    // 数据黑板 -- 每一个节点都可以有独立的黑板
    public blackboard: T;
    // 当前状态
    public status = TaskStatus.New;
    
    // 在Enter方法之前调用，用于数据初始化
    public BeforeEnter() {}
    // 从非运行状态进入运行状态时执行
    public Enter() {}
    // 每帧执行
    public abstract Execute(): TaskStatus;
    // 运行结束时执行
    public Exit() {} 
    // 外部事件
    public OnEvent(evt: any) {}
    // 重置以用于重新启动(清理所有临时状态)
    public ResetForRestart(){
        if (this.status == TaskStatus.New) return; // 未运行过
        if (this.status == TaskStatus.Running) this.Stop(); // 停止运行
        
        this.guard?.ResetForRestart(); // 重置guard
        this.ResetChildrenForRestart(); // 重置所有子节点
        if (!this["root"]) { // 重置上下文
            this.tree = null;
            this.blackboard = null;    
        }
        this.status = TaskStatus.New;
    }
    // 重置所有子节点，逆序重置，与stop一致
    protected ResetChildrenForRestart() {
        for (let idx = this.ChildCount() - 1; idx >= 0; idx--) {
            const child = this.GetChild(idx);
            if (child.status != TaskStatus.New) {
                child.ResetForRestart();
            }
        }
    }
    // 停止所有运行状态的子节点，逆序停止
    protected StopRuningChildren() {
        for (let idx = this.ChildCount() - 1; idx >= 0; idx--) {
            const child: Task<T> = this.GetChild(idx);
            if (child.status == TaskStatus.Running) {
                child.Stop();
            }
        }
    }

    // 停止执行
    public Stop() {
        if (this.status == TaskStatus.Running) {
            this.status = TaskStatus.Failed;
            this.Template_Exit();
        }
    }
    
    // 一些模板方法
    // 用于启动Node的模板方法
    public Template_StartChild(child: Task<T>, checkGuard = true): TaskStatus {
        if (checkGuard && child.guard != null && !this.Template_CheckGuard(child.guard)) {
            child.status = TaskStatus.Failed;
            return TaskStatus.Failed; // 不满足前置条件
        }
        child.tree = this.tree; // 缓存tree引用
        if (child.blackboard = null) { // 自动继承黑板
            child.blackboard = this.blackboard;
        }    
        child.status = TaskStatus.Running; // 先更新为running
        child.BeforeEnter(); // 初始化数据
        child.Enter(); // 启动
        return child.Template_Execute(); // 同步执行Execute
    }
    // 用于调用Execute方法的模板方法
    public Template_Execute(): TaskStatus {
        if(this.IsCompleted()) {
            return this.status;
        }
        const status = this.Execute();
        if (status != TaskStatus.Running) {
            this.status = status;
            this.Template_Exit();        
        }
        return status;
    }
    // 用于调用Exit的模板方法
    private Template_Exit() {
        // 停止所有运行中的子节点
        this.StopRuningChildren();
        // 执行自身的Exit方法
        this.Exit();
        // 可能的其它扩展...
    }
    // 用于检查条件的模板方法
    public Template_CheckGuard(guard?: Task<T>) {
        if (guard == null) return true;
        if (guard.guard != null && !this.Template_CheckGuard(guard.guard)) return false;
        
        const status = this.Template_StartChild(guard, false); // guard.guard已检查
        if (status == TaskStatus.Success) return true;
        if (status == TaskStatus.Failed) return false;
        throw Error("Illegal guard status {status}. Guards must either succeed or fail in one step.");
    }
    
    // 子节点管理等... 
    public abstract ChildCount(): number
    public abstract GetChild(index: number): Task<T>;    
    public abstract AddChild(child: Task<T>): void;
    public abstract RemoveChild(child: Task<T>): boolean;
    

    public IsSucceeded() {
        return this.status == TaskStatus.Success;
    }

    public IsCompleted() {
        return this.status >= TaskStatus.Success;
    }
    public IsRunning() {
        return this.status == TaskStatus.Running;
    }
}