import { Node } from "cc";
import { Action } from "../Action";
import { BehaviorStatus } from "../BehaviorStatus";

/**
 * 移动到目标位置动作示例
 */
export class MoveToAction extends Action {
    private targetX: number = 0;
    private targetY: number = 0;
    private speed: number = 2;
    private threshold: number = 0.1;
    private currentX: number = 0;
    private currentY: number = 0;
    private node: Node | null = null;
    constructor(name: string = "MoveTo") {
        super(name);
    }

    setNode(node: Node) {
        this.node = node;
    }

    protected onEnter(): void {
        // 从黑板获取目标位置
        this.targetX = this.blackboard.get<number>("targetX", 0);
        this.targetY = this.blackboard.get<number>("targetY", 0);
        
        // 从黑板获取当前位置
        this.currentX = this.blackboard.get<number>("currentX", 0);
        this.currentY = this.blackboard.get<number>("currentY", 0);
    }

    protected onUpdate(): BehaviorStatus {
        // 计算距离
        const dx = this.targetX - this.currentX;
        const dy = this.targetY - this.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果已经到达目标位置
        if (distance < this.threshold) {
            this.currentX = this.targetX;
            this.currentY = this.targetY;
            this.blackboard.set("currentX", this.currentX);
            this.blackboard.set("currentY", this.currentY);
            this.node?.setPosition(this.currentX, this.currentY);
            return BehaviorStatus.Success;
        }

        // 移动向目标位置
        const moveDistance = Math.min(this.speed, distance);
        const ratio = moveDistance / distance;
        this.currentX += dx * ratio;
        this.currentY += dy * ratio;

        // 更新黑板中的当前位置
        this.blackboard.set("currentX", this.currentX);
        this.blackboard.set("currentY", this.currentY);
        this.node?.setPosition(this.currentX, this.currentY);
        return BehaviorStatus.Running;
    }
}
