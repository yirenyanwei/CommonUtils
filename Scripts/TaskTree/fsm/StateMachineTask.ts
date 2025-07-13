import { DecoratorTask } from "../abstract/DecoratorTask";
import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";

/**
 * 状态机
 */
export class StateMachineTask<T> extends DecoratorTask<T> {
    /**
     * 状态机名称
     */
    private name = "";
    /**
     * 下一个状态
     */
    private nextState: Task<T>;
    public override Execute(): TaskStatus {
        const curState = this.child;
        const nextState = this.nextState;
        if(nextState != null) {
            this.StopCurState();
            this.child = nextState;

            return this.Template_StartChild(this.child, true);
        }
        if(curState.IsRunning()) {
            return curState.Template_Execute();
        }
        return this.Template_StartChild(curState, true);
    }
    
    private StopCurState() {
        if(this.child == null) {
            return;
        }
        this.child.Stop();
        this.child = null;
    }
    public ChangeState(state: Task<T>) {
        this.nextState = state;
        if(this.IsRunning()) {
            this.Template_Execute();
        }
    }
}