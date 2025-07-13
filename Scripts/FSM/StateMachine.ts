import { State } from "./State";

export class StateContext {
    public machine: StateMachine = null;
}
export class StateMachine {
    public constext: StateContext = null!;
    public curState: State = null!;
    public setContext(ctx: StateContext) {
        this.constext = ctx;
    }

    // 每帧调用，驱动当前状态运行
    public update() {
        if (this.curState != null) {
            this.curState.execute();
        }
    }
    // 请求切换到新状态
    public changeState(state: State) {
        if (this.curState != null) {
            this.curState.onExit();
        }
        this.curState = state;
        if (state != null) {
            state.onEnter();
        }
    }
}