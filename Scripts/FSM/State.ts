import { StateContext } from "./StateMachine";

export interface IState {
    onEnter();
    execute();
    onExit();
}

export class State implements IState {
    public ctx: StateContext;
    public onEnter() {
    }
    public execute() {
    }
    public onExit() {
    }

}