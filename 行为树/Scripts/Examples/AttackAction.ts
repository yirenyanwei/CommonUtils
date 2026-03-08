import { Action } from "../Action";
import { BehaviorStatus } from "../BehaviorStatus";

/**
 * 攻击动作示例
 */
export class AttackAction extends Action {
    private attackDuration: number = 1.0; // 攻击持续时间（秒）
    private elapsedTime: number = 0;

    constructor(name: string = "Attack") {
        super(name);
    }

    protected onEnter(): void {
        this.elapsedTime = 0;
        console.log("开始攻击！");
    }

    protected onUpdate(): BehaviorStatus {
        this.elapsedTime += 0.016; // 假设每帧16ms

        if (this.elapsedTime >= this.attackDuration) {
            console.log("攻击完成！");
            return BehaviorStatus.Success;
        }

        return BehaviorStatus.Running;
    }

    protected onExit(): void {
        console.log("攻击结束");
    }
}
