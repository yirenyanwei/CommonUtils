import { Node } from "cc";
import { Action } from "../Action";
import { BehaviorStatus } from "../BehaviorStatus";
import { MoveToAction } from "./MoveToAction";

/**
 * 巡逻动作示例
 */
export class PatrolAction extends Action {
    private patrolPoints: { x: number; y: number }[] = [];
    private currentPointIndex: number = 0;
    private moveAction: MoveToAction;

    constructor(patrolPoints: { x: number; y: number }[], name: string = "Patrol") {
        super(name);
        this.patrolPoints = patrolPoints;
        this.moveAction = new MoveToAction();
    }

    setNode(node: Node) {
        this.moveAction.setNode(node);
    }

    protected onEnter(): void {
        this.currentPointIndex = 0;
        if (this.patrolPoints.length > 0) {
            this.moveToNextPoint();
        }
    }

    protected onUpdate(): BehaviorStatus {
        if (this.patrolPoints.length === 0) {
            return BehaviorStatus.Failure;
        }

        // 初始化移动动作
        if (this.moveAction.getStatus() === BehaviorStatus.Inactive) {
            this.moveAction.initialize(this.blackboard);
        }

        // 执行移动
        const status = this.moveAction.execute();

        // 判断是否满足攻击状态
        if (this.blackboard.get("hasEnemyNearby")) {
            return BehaviorStatus.Failure;
        }

        // 如果到达当前巡逻点，移动到下一个
        if (status === BehaviorStatus.Success) {
            this.currentPointIndex = (this.currentPointIndex + 1) % this.patrolPoints.length;
            this.moveToNextPoint();
            return BehaviorStatus.Running;
        }

        return status;
    }

    private moveToNextPoint(): void {
        const point = this.patrolPoints[this.currentPointIndex];
        this.blackboard.set("targetX", point.x);
        this.blackboard.set("targetY", point.y);
        this.moveAction.reset();
    }
}
