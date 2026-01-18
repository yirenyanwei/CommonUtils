import { _decorator, Component, Node, Vec3, Quat, input, Input, EventKeyboard, KeyCode } from 'cc';
import { StateSyncManager } from './StateSyncManager';
import { StateSyncEvent, ActionType, EntityState } from './types';

const { ccclass, property } = _decorator;

/**
 * 状态同步测试组件
 * 演示如何使用状态同步管理器
 */
@ccclass('StateTest')
export class StateTest extends Component {
    @property({
        tooltip: '实体ID'
    })
    public entityId: string = 'player_001';

    @property({
        tooltip: '移动速度'
    })
    public moveSpeed: number = 5.0;

    private stateSyncManager: StateSyncManager | null = null;
    private currentState: EntityState | null = null;

    private actionData: any = null;
    private isAction: boolean = false;

    start() {
        // 获取状态同步管理器
        this.stateSyncManager = StateSyncManager.getInstance();
        
        if (!this.stateSyncManager) {
            console.error('StateSyncManager not found');
            return;
        }

        // 初始化状态同步
        this.stateSyncManager.init({
            syncRate: 20,
            enablePrediction: true,
            enableInterpolation: true
        });

        // 注册实体
        const initialState: EntityState = {
            id: this.entityId,
            position: this.node.position.clone(),
            rotation: this.node.rotation.clone(),
            velocity: new Vec3(0, 0, 0)
        };
        this.stateSyncManager.registerEntity(this.entityId, initialState, this);

        // 监听状态更新
        this.stateSyncManager.eventTarget.on(
            StateSyncEvent.STATE_UPDATE,
            this.onStateUpdate,
            this
        );

        // 监听预测不匹配
        this.stateSyncManager.eventTarget.on(
            StateSyncEvent.PREDICTION_MISMATCH,
            this.onPredictionMismatch,
            this
        );

        // 连接并开始同步
        this.stateSyncManager.connect();

        // 注册键盘输入
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    update(deltaTime: number) {
        // 状态同步管理器会自动更新
        // 这里可以添加其他逻辑
        if (this.isAction) {
            this.stateSyncManager.sendAction(this.entityId, ActionType.MOVE, this.actionData);
        }
    }

    /**
     * 状态更新回调
     */
    private onStateUpdate(state: any): void {
        const entityState = this.stateSyncManager?.getEntityState(this.entityId);
        if (entityState) {
            this.currentState = entityState;
            // 如果禁用插值，直接应用状态
            // 如果启用插值，StateSyncManager会自动处理
        }
    }

    /**
     * 预测不匹配回调
     */
    private onPredictionMismatch(entityId: string, prediction: any, serverState: any): void {
        console.log(`预测不匹配: ${entityId}`, {
            predicted: prediction.predictedState.position,
            server: serverState.position
        });
    }

    /**
     * 键盘输入处理
     */
    private onKeyDown(event: EventKeyboard): void {
        if (!this.stateSyncManager) return;

        const direction = new Vec3(0, 0, 0);
        let hasInput = false;

        switch (event.keyCode) {
            case KeyCode.ARROW_UP:
            case KeyCode.KEY_W:
                direction.y = 1;
                hasInput = true;
                break;
            case KeyCode.ARROW_DOWN:
            case KeyCode.KEY_S:
                direction.y = -1;
                hasInput = true;
                break;
            case KeyCode.ARROW_LEFT:
            case KeyCode.KEY_A:
                direction.x = -1;
                hasInput = true;
                break;
            case KeyCode.ARROW_RIGHT:
            case KeyCode.KEY_D:
                direction.x = 1;
                hasInput = true;
                break;
            case KeyCode.SPACE:
                // 跳跃
                this.stateSyncManager.sendAction(this.entityId, ActionType.JUMP, {
                    velocity: new Vec3(0, 10, 0)
                });
                break;
        }

        if (hasInput) {
            this.actionData = {
                direction: direction,
                speed: this.moveSpeed
            };
            this.isAction = true;
        }
    }
    private onKeyUp(event: EventKeyboard): void {
        if (!this.stateSyncManager) return;
        this.isAction = false;
    }

    protected onDestroy(): void {
        if (this.stateSyncManager) {
            this.stateSyncManager.eventTarget.off(
                StateSyncEvent.STATE_UPDATE,
                this.onStateUpdate,
                this
            );
            this.stateSyncManager.eventTarget.off(
                StateSyncEvent.PREDICTION_MISMATCH,
                this.onPredictionMismatch,
                this
            );
            this.stateSyncManager.unregisterEntity(this.entityId);
        }

        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }
}

