import { _decorator, Component, Node } from 'cc';
import { BehaviorTree } from './BehaviorTree';
import { Sequence } from './Sequence';
import { Selector } from './Selector';
import { Inverter } from './Inverter';
import { Repeat } from './Repeat';
import { CheckHealthCondition } from './Examples/CheckHealthCondition';
import { CheckEnemyNearbyCondition } from './Examples/CheckEnemyNearbyCondition';
import { MoveToAction } from './Examples/MoveToAction';
import { AttackAction } from './Examples/AttackAction';
import { PatrolAction } from './Examples/PatrolAction';
import { BehaviorStatus } from './BehaviorStatus';

const { ccclass, property } = _decorator;

/**
 * 行为树测试组件
 * 演示如何使用行为树系统
 */
@ccclass('BehaviorTreeTest')
export class BehaviorTreeTest extends Component {
    private behaviorTree: BehaviorTree | null = null;
    @property(Node)
    enemyNode: Node = null!;

    start() {
        // 创建行为树
        this.createBehaviorTree();
    }

    update(deltaTime: number) {
        // 每帧更新行为树
        if (this.behaviorTree) {
            const status = this.behaviorTree.update();
            
            // 如果行为树完成，可以重置或执行其他逻辑
            if (this.behaviorTree.isComplete()) {
                // 这里可以重置行为树或执行其他逻辑
                // this.behaviorTree.reset();
            }
        }
    }

    /**
     * 创建一个示例行为树
     * 行为树结构：
     * Selector (选择器)
     *   ├─ Sequence (攻击序列)
     *   │   ├─ CheckEnemyNearbyCondition (检查附近是否有敌人)
     *   │   └─ AttackAction (攻击动作)
     *   └─ Sequence (巡逻序列)
     *       ├─ CheckHealthCondition (检查生命值)
     *       └─ PatrolAction (巡逻动作)
     */
    private createBehaviorTree(): void {
        // 创建行为树和黑板
        this.behaviorTree = new BehaviorTree();
        const blackboard = this.behaviorTree.getBlackboard();

        // 初始化黑板数据
        blackboard.set("health", 80);
        blackboard.set("currentX", 0);
        blackboard.set("currentY", 0);
        blackboard.set("hasEnemyNearby", false);

        // 创建根节点 - 选择器（优先攻击，否则巡逻）
        const rootSelector = new Selector("RootSelector");

        // 创建攻击序列
        const attackSequence = new Sequence("AttackSequence");
        const checkEnemyCondition = new CheckEnemyNearbyCondition(10);
        const attackAction = new AttackAction();
        attackSequence.addChild(checkEnemyCondition);
        attackSequence.addChild(attackAction);

        // 创建巡逻序列
        const patrolSequence = new Sequence("PatrolSequence");
        const checkHealthCondition = new CheckHealthCondition(50);
        const patrolPoints = [
            { x: 100, y: 100 },
            { x: 100, y: 200 },
            { x: 200, y: 200 },
            { x: 200, y: 100 }
        ];
        const patrolAction = new PatrolAction(patrolPoints);
        patrolAction.setNode(this.enemyNode);
        patrolSequence.addChild(checkHealthCondition);
        patrolSequence.addChild(patrolAction);

        // 组装行为树
        rootSelector.addChild(attackSequence);
        rootSelector.addChild(patrolSequence);
        this.behaviorTree.setRoot(rootSelector);

        console.log("行为树创建完成！");
    }

    /**
     * 示例：动态修改黑板数据
     */
    public setEnemyNearby(hasEnemy: boolean): void {
        if (this.behaviorTree) {
            this.behaviorTree.getBlackboard().set("hasEnemyNearby", hasEnemy);
        }
    }

    /**
     * 示例：设置生命值
     */
    public setHealth(health: number): void {
        if (this.behaviorTree) {
            this.behaviorTree.getBlackboard().set("health", health);
        }
    }

    /**
     * 示例：重置行为树
     */
    public resetTree(): void {
        if (this.behaviorTree) {
            this.behaviorTree.reset();
        }
    }

    private onClickNearby(): void {
        this.setEnemyNearby(true);
    }
}

