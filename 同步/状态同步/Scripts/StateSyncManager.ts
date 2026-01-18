import { _decorator, Component, EventTarget, Vec3, Quat } from 'cc';
import { 
    StateSyncConfig, 
    StateSyncState, 
    StateSyncEvent, 
    PlayerAction, 
    EntityState, 
    GameState,
    ActionType,
    PredictionState
} from './types';

const { ccclass, property } = _decorator;

/**
 * 状态同步管理器
 * 实现服务器权威的状态同步机制
 * 
 * 注意：这是一个简化版本，实际项目中需要实现网络通信部分
 */
@ccclass('StateSyncManager')
export class StateSyncManager extends Component {
    // 单例实例
    private static instance: StateSyncManager | null = null;

    @property({
        tooltip: '同步频率（Hz）'
    })
    public syncRate: number = 20;

    @property({
        tooltip: '启用客户端预测'
    })
    public enablePrediction: boolean = true;

    @property({
        tooltip: '启用状态插值'
    })
    public enableInterpolation: boolean = true;

    // 配置
    private config: StateSyncConfig = {
        syncRate: 20,
        enablePrediction: true,
        enableInterpolation: true,
        maxStateHistory: 3,
        serverAuthority: true
    };

    // 状态
    private state: StateSyncState = StateSyncState.IDLE;
    private currentFrameIndex: number = 0;

    // 实体管理
    private entities: Map<string, EntityState> = new Map();
    private entityComponents: Map<string, any> = new Map(); // 实体ID -> 组件引用

    // 状态历史（用于插值）
    private stateHistory: GameState[] = [];

    // 操作队列
    private actionQueue: PlayerAction[] = [];
    private pendingActions: Map<string, PlayerAction> = new Map(); // actionId -> Action

    // 客户端预测
    private predictions: Map<string, PredictionState> = new Map(); // entityId -> Prediction

    // 同步相关
    private syncInterval: number = 0; // 同步间隔（秒）
    private accumulatedTime: number = 0;

    // 事件系统
    public eventTarget: EventTarget = new EventTarget();

    // 统计信息
    private stats = {
        totalStateUpdates: 0,
        totalActionsSent: 0,
        totalPredictions: 0,
        totalRollbacks: 0,
    };

    /**
     * 获取单例实例
     */
    public static getInstance(): StateSyncManager | null {
        return StateSyncManager.instance;
    }

    protected onLoad(): void {
        // 设置单例
        if (StateSyncManager.instance === null) {
            StateSyncManager.instance = this;
        }

        // 初始化配置
        this.config.syncRate = this.syncRate;
        this.config.enablePrediction = this.enablePrediction;
        this.config.enableInterpolation = this.enableInterpolation;
        this.syncInterval = 1.0 / this.config.syncRate;
    }

    protected onDestroy(): void {
        StateSyncManager.instance = null;
    }

    /**
     * 初始化状态同步
     * @param config 配置（可选）
     */
    public init(config?: Partial<StateSyncConfig>): void {
        if (config) {
            this.config = { ...this.config, ...config };
            this.syncInterval = 1.0 / this.config.syncRate;
        }

        this.currentFrameIndex = 0;
        this.accumulatedTime = 0;
        this.entities.clear();
        this.entityComponents.clear();
        this.stateHistory = [];
        this.actionQueue = [];
        this.pendingActions.clear();
        this.predictions.clear();

        this.setState(StateSyncState.IDLE);
    }

    /**
     * 连接（模拟网络连接）
     */
    public connect(): void {
        this.setState(StateSyncState.CONNECTING);
        // 模拟连接延迟
        setTimeout(() => {
            this.setState(StateSyncState.CONNECTED);
            this.startSync();
        }, 100);
    }

    /**
     * 断开连接
     */
    public disconnect(): void {
        this.setState(StateSyncState.DISCONNECTED);
        this.stopSync();
    }

    /**
     * 开始同步
     */
    private startSync(): void {
        this.setState(StateSyncState.SYNCING);
    }

    /**
     * 停止同步
     */
    private stopSync(): void {
        this.setState(StateSyncState.IDLE);
    }

    /**
     * 注册实体
     * @param entityId 实体ID
     * @param initialState 初始状态
     * @param component 实体组件（可选，用于直接更新）
     */
    public registerEntity(entityId: string, initialState: EntityState, component?: any): void {
        this.entities.set(entityId, initialState);
        if (component) {
            this.entityComponents.set(entityId, component);
        }
        this.eventTarget.emit(StateSyncEvent.ENTITY_ADDED, entityId, initialState);
    }

    /**
     * 注销实体
     * @param entityId 实体ID
     */
    public unregisterEntity(entityId: string): void {
        this.entities.delete(entityId);
        this.entityComponents.delete(entityId);
        this.eventTarget.emit(StateSyncEvent.ENTITY_REMOVED, entityId);
    }

    /**
     * 发送操作
     * @param entityId 实体ID
     * @param actionType 操作类型
     * @param data 操作数据
     */
    public sendAction(entityId: string, actionType: ActionType, data: any = null): void {
        if (this.state !== StateSyncState.SYNCING && this.state !== StateSyncState.CONNECTED) {
            console.warn('StateSyncManager is not syncing, action ignored');
            return;
        }

        const action: PlayerAction = {
            actionId: `${entityId}_${Date.now()}_${Math.random()}`,
            entityId: entityId,
            actionType: actionType,
            data: data,
            timestamp: Date.now()
        };

        // 客户端预测
        if (this.config.enablePrediction) {
            this.predictAction(action);
        }

        // 添加到队列
        this.actionQueue.push(action);
        this.pendingActions.set(action.actionId, action);

        this.eventTarget.emit(StateSyncEvent.ACTION_SENT, action);
        this.stats.totalActionsSent++;
    }

    /**
     * 预测操作结果（客户端预测）
     * @param action 操作
     */
    private predictAction(action: PlayerAction): void {
        const entity = this.entities.get(action.entityId);
        if (!entity) return;

        // 创建预测状态
        const predictedState: EntityState = this.applyActionToState(entity, action);
        
        // 保存预测
        this.predictions.set(action.entityId, {
            actionId: action.actionId,
            predictedState: predictedState,
            timestamp: action.timestamp
        });

        // 立即应用预测（减少延迟感）
        this.entities.set(action.entityId, predictedState);
        this.stats.totalPredictions++;
    }

    /**
     * 将操作应用到状态（预测逻辑）
     * @param currentState 当前状态
     * @param action 操作
     * @returns 新状态
     */
    private applyActionToState(currentState: EntityState, action: PlayerAction): EntityState {
        const newState: EntityState = {
            id: currentState.id,
            position: new Vec3(currentState.position),
            rotation: currentState.rotation ? new Quat(currentState.rotation) : new Quat(),
            ...currentState
        };

        // 根据操作类型更新状态
        switch (action.actionType) {
            case ActionType.MOVE:
                if (action.data && action.data.direction) {
                    const dir = action.data.direction as Vec3;
                    const speed = action.data.speed || 5.0;
                    newState.position.x += dir.x * speed * this.syncInterval;
                    newState.position.y += dir.y * speed * this.syncInterval;
                    newState.position.z += dir.z * speed * this.syncInterval;
                }
                break;
            case ActionType.JUMP:
                if (action.data && action.data.velocity) {
                    const vel = action.data.velocity as Vec3;
                    if (newState.velocity) {
                        newState.velocity.set(vel);
                    } else {
                        newState.velocity = new Vec3(vel);
                    }
                }
                break;
            // 其他操作类型...
        }

        return newState;
    }

    /**
     * 接收服务器状态更新（模拟）
     * 实际项目中，这里应该从网络接收数据
     * @param serverState 服务器状态
     */
    public receiveStateUpdate(serverState: GameState): void {
        // 检查预测是否匹配
        if (this.config.enablePrediction) {
            this.checkPredictions(serverState);
        }

        // 更新状态历史（用于插值）
        this.stateHistory.push(serverState);
        if (this.stateHistory.length > this.config.maxStateHistory) {
            this.stateHistory.shift();
        }

        // 应用服务器状态
        this.applyServerState(serverState);

        this.eventTarget.emit(StateSyncEvent.STATE_UPDATE, serverState);
        this.stats.totalStateUpdates++;
    }

    /**
     * 检查预测是否匹配
     * @param serverState 服务器状态
     */
    private checkPredictions(serverState: GameState): void {
        for (const [entityId, prediction] of this.predictions.entries()) {
            const serverEntity = serverState.entities.get(entityId);
            if (!serverEntity) continue;

            // 检查预测是否匹配（简化版本，实际需要更复杂的比较）
            const mismatch = this.compareStates(prediction.predictedState, serverEntity);
            if (mismatch) {
                // 预测不匹配，需要回滚
                this.rollback(entityId, serverEntity);
                this.eventTarget.emit(StateSyncEvent.PREDICTION_MISMATCH, entityId, prediction, serverEntity);
                this.stats.totalRollbacks++;
            } else {
                // 预测匹配，确认操作
                const action = this.pendingActions.get(prediction.actionId);
                if (action) {
                    this.eventTarget.emit(StateSyncEvent.ACTION_CONFIRMED, action);
                    this.pendingActions.delete(prediction.actionId);
                }
            }

            // 清理已处理的预测
            this.predictions.delete(entityId);
        }
    }

    /**
     * 比较两个状态是否不同
     * @param state1 状态1
     * @param state2 状态2
     * @returns 是否不同
     */
    private compareStates(state1: EntityState, state2: EntityState): boolean {
        // 简化比较，实际需要更精确的比较逻辑
        const pos1 = state1.position;
        const pos2 = state2.position;
        const threshold = 0.1; // 阈值

        return Math.abs(pos1.x - pos2.x) > threshold ||
               Math.abs(pos1.y - pos2.y) > threshold ||
               Math.abs(pos1.z - pos2.z) > threshold;
    }

    /**
     * 回滚到服务器状态
     * @param entityId 实体ID
     * @param serverState 服务器状态
     */
    private rollback(entityId: string, serverState: EntityState): void {
        this.entities.set(entityId, serverState);
    }

    /**
     * 应用服务器状态
     * @param serverState 服务器状态
     */
    private applyServerState(serverState: GameState): void {
        for (const [entityId, entityState] of serverState.entities.entries()) {
            this.entities.set(entityId, entityState);
        }
    }

    /**
     * 更新（模拟服务器同步）
     */
    protected update(deltaTime: number): void {
        if (this.state !== StateSyncState.SYNCING) {
            return;
        }

        this.accumulatedTime += deltaTime;

        // 定期同步（模拟服务器发送状态）
        if (this.accumulatedTime >= this.syncInterval) {
            this.syncToServer();
            this.accumulatedTime = 0;
        }

        // 状态插值（如果有历史状态）
        if (this.config.enableInterpolation && this.stateHistory.length >= 2) {
            this.interpolateStates(deltaTime);
        }
    }

    /**
     * 同步到服务器（模拟）
     * 实际项目中，这里应该发送操作到服务器
     */
    private syncToServer(): void {
        // 处理待发送的操作
        if (this.actionQueue.length > 0) {
            // 实际项目中，这里应该通过网络发送操作
            // 这里模拟：直接处理操作并生成状态
            this.processActions();
        }

        // 生成当前状态快照
        const currentState: GameState = {
            frameIndex: this.currentFrameIndex++,
            timestamp: Date.now(),
            entities: new Map(this.entities)
        };

        // 模拟服务器返回状态（实际应该从网络接收）
        this.receiveStateUpdate(currentState);
    }

    /**
     * 处理操作队列（模拟服务器处理）
     */
    private processActions(): void {
        while (this.actionQueue.length > 0) {
            const action = this.actionQueue.shift();
            if (!action) continue;

            // 模拟服务器处理操作
            const entity = this.entities.get(action.entityId);
            if (entity) {
                const newState = this.applyActionToState(entity, action);
                this.entities.set(action.entityId, newState);
            }
        }
    }

    /**
     * 状态插值
     * @param deltaTime 时间增量
     */
    private interpolateStates(deltaTime: number): void {
        if (this.stateHistory.length < 2) return;

        const prevState = this.stateHistory[this.stateHistory.length - 2];
        const nextState = this.stateHistory[this.stateHistory.length - 1];
        const timeDiff = nextState.timestamp - prevState.timestamp;
        
        if (timeDiff <= 0) return;

        const currentTime = Date.now();
        const alpha = Math.min(1.0, (currentTime - prevState.timestamp) / timeDiff);

        // 对每个实体进行插值
        for (const [entityId, prevEntity] of prevState.entities.entries()) {
            const nextEntity = nextState.entities.get(entityId);
            if (!nextEntity) continue;

            const interpolated = this.interpolateEntity(prevEntity, nextEntity, alpha);
            
            // 更新实体状态
            this.entities.set(entityId, interpolated);

            // 如果有组件引用，直接更新组件
            const component = this.entityComponents.get(entityId);
            if (component && component.node) {
                component.node.setPosition(interpolated.position);
                if (interpolated.rotation) {
                    component.node.setRotation(interpolated.rotation);
                }
            }
        }
    }

    /**
     * 插值实体状态
     * @param prev 上一状态
     * @param next 下一状态
     * @param alpha 插值系数 (0-1)
     * @returns 插值后的状态
     */
    private interpolateEntity(prev: EntityState, next: EntityState, alpha: number): EntityState {
        const interpolated: EntityState = {
            id: prev.id,
            position: new Vec3(),
            rotation: prev.rotation ? new Quat() : undefined,
            ...prev
        };

        // 位置插值
        Vec3.lerp(interpolated.position, prev.position, next.position, alpha);

        // 旋转插值
        if (prev.rotation && next.rotation && interpolated.rotation) {
            Quat.slerp(interpolated.rotation, prev.rotation, next.rotation, alpha);
        }

        return interpolated;
    }

    /**
     * 设置状态
     */
    private setState(newState: StateSyncState): void {
        if (this.state !== newState) {
            const oldState = this.state;
            this.state = newState;
            this.eventTarget.emit(StateSyncEvent.STATE_CHANGED, oldState, newState);
        }
    }

    /**
     * 获取当前状态
     */
    public getState(): StateSyncState {
        return this.state;
    }

    /**
     * 获取实体状态
     * @param entityId 实体ID
     */
    public getEntityState(entityId: string): EntityState | undefined {
        return this.entities.get(entityId);
    }

    /**
     * 获取所有实体状态
     */
    public getAllEntities(): Map<string, EntityState> {
        return new Map(this.entities);
    }

    /**
     * 获取统计信息
     */
    public getStats() {
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this.stats = {
            totalStateUpdates: 0,
            totalActionsSent: 0,
            totalPredictions: 0,
            totalRollbacks: 0,
        };
    }
}

