import { _decorator, Component, EventTarget } from 'cc';
import { FrameSyncConfig, FrameSyncState, FrameSyncEvent, PlayerInput, InputType } from './types';
import { DeterministicRandom } from './DeterministicRandom';

const { ccclass, property } = _decorator;

/**
 * 帧同步管理器（简化版 - 单玩家本地）
 * 实现逻辑帧和渲染帧分离
 */
@ccclass('FrameSyncManager')
export class FrameSyncManager extends Component {
    // 单例实例
    private static instance: FrameSyncManager | null = null;

    @property({
        tooltip: '逻辑帧率（FPS）'
    })
    public logicFrameRate: number = 60;

    @property({
        tooltip: '是否启用渲染插值'
    })
    public enableInterpolation: boolean = true;

    // 配置
    private config: FrameSyncConfig = {
        logicFrameRate: 60,
        enableInterpolation: true
    };

    // 状态
    private state: FrameSyncState = FrameSyncState.IDLE;
    private currentLogicFrameIndex: number = 0;

    // 组件
    private random: DeterministicRandom | null = null;

    // 逻辑帧相关
    private logicFrameTime: number = 0;        // 每逻辑帧时间（秒）
    private accumulatedTime: number = 0;      // 累积时间（用于固定时间步长）
    private inputBuffer: Map<number, PlayerInput> = new Map(); // 输入缓冲区 frameIndex -> Input

    // 渲染帧相关（用于插值）
    private lastLogicFrameTime: number = 0;    // 上一个逻辑帧的时间
    private currentLogicFrameTime: number = 0; // 当前逻辑帧的时间
    private renderAlpha: number = 0;           // 渲染插值系数 (0-1)

    // 事件系统
    public eventTarget: EventTarget = new EventTarget();

    // 统计信息
    private stats = {
        totalLogicFrames: 0,
        totalRenderFrames: 0,
    };

    /**
     * 获取单例实例
     */
    public static getInstance(): FrameSyncManager | null {
        return FrameSyncManager.instance;
    }

    protected onLoad(): void {
        // 设置单例
        if (FrameSyncManager.instance === null) {
            FrameSyncManager.instance = this;
        }

        // 初始化配置
        this.config.logicFrameRate = this.logicFrameRate;
        this.config.enableInterpolation = this.enableInterpolation;
        this.logicFrameTime = 1.0 / this.config.logicFrameRate;
        
        // 初始化组件
        this.random = new DeterministicRandom(12345); // 使用固定种子
    }

    protected onDestroy(): void {
        FrameSyncManager.instance = null;
    }

    /**
     * 初始化帧同步
     * @param config 配置（可选）
     */
    public init(config?: Partial<FrameSyncConfig>): void {
        if (config) {
            this.config = { ...this.config, ...config };
            this.logicFrameTime = 1.0 / this.config.logicFrameRate;
        }

        this.currentLogicFrameIndex = 0;
        this.accumulatedTime = 0;
        this.lastLogicFrameTime = 0;
        this.currentLogicFrameTime = 0;
        this.renderAlpha = 0;
        this.inputBuffer.clear();

        this.setState(FrameSyncState.RUNNING);
    }

    /**
     * 开始帧同步
     */
    public start(): void {
        this.setState(FrameSyncState.RUNNING);
    }

    /**
     * 暂停帧同步
     */
    public pause(): void {
        this.setState(FrameSyncState.PAUSED);
    }

    /**
     * 恢复帧同步
     */
    public resume(): void {
        if (this.state === FrameSyncState.PAUSED) {
            this.setState(FrameSyncState.RUNNING);
        }
    }

    /**
     * 停止帧同步
     */
    public stop(): void {
        this.setState(FrameSyncState.IDLE);
        this.inputBuffer.clear();
    }

    /**
     * 记录玩家输入
     * @param inputType 输入类型
     * @param data 输入数据
     */
    public recordInput(inputType: InputType, data: any = null): void {
        if (this.state !== FrameSyncState.RUNNING) {
            return;
        }

        // 记录到下一帧（当前帧+1）
        const targetFrame = this.currentLogicFrameIndex + 1;
        const input: PlayerInput = {
            frameIndex: targetFrame,
            inputType: inputType,
            data: data
        };

        this.inputBuffer.set(targetFrame, input);
    }

    /**
     * 更新（在Component的update中调用）
     * 这里处理逻辑帧和渲染帧
     */
    protected update(deltaTime: number): void {
        if (this.state !== FrameSyncState.RUNNING) {
            return;
        }

        // 更新累积时间
        this.accumulatedTime += deltaTime;

        // 执行固定时间步长的逻辑帧
        while (this.accumulatedTime >= this.logicFrameTime) {
            this.executeLogicFrame();
            this.accumulatedTime -= this.logicFrameTime;
        }

        // 计算渲染插值系数
        if (this.config.enableInterpolation) {
            this.renderAlpha = this.accumulatedTime / this.logicFrameTime;
        } else {
            this.renderAlpha = 0;
        }

        // 触发渲染帧事件（用于插值渲染）
        this.eventTarget.emit(FrameSyncEvent.RENDER_FRAME, this.renderAlpha);
        this.stats.totalRenderFrames++;
    }

    /**
     * 执行逻辑帧
     */
    private executeLogicFrame(): void {
        // 更新逻辑帧时间
        this.lastLogicFrameTime = this.currentLogicFrameTime;
        this.currentLogicFrameTime += this.logicFrameTime;

        // 触发逻辑帧开始事件
        this.eventTarget.emit(FrameSyncEvent.LOGIC_FRAME_START, this.currentLogicFrameIndex);

        // 获取该帧的输入
        const input = this.inputBuffer.get(this.currentLogicFrameIndex);
        
        // 执行游戏逻辑（由外部实现）
        this.onLogicFrame(this.currentLogicFrameIndex, input);

        // 清理已使用的输入
        this.inputBuffer.delete(this.currentLogicFrameIndex);

        // 触发逻辑帧结束事件
        this.eventTarget.emit(FrameSyncEvent.LOGIC_FRAME_END, this.currentLogicFrameIndex);

        this.currentLogicFrameIndex++;
        this.stats.totalLogicFrames++;
    }

    /**
     * 逻辑帧回调（由子类或外部实现）
     * @param frameIndex 帧索引
     * @param input 该帧的输入（可能为undefined）
     */
    protected onLogicFrame(frameIndex: number, input: PlayerInput | undefined): void {
        // 子类可以重写此方法来实现游戏逻辑
        // 或者通过事件系统监听 LOGIC_FRAME_START 事件
    }

    /**
     * 获取指定帧的输入
     */
    public getInput(frameIndex: number): PlayerInput | undefined {
        return this.inputBuffer.get(frameIndex);
    }

    /**
     * 设置状态
     */
    private setState(newState: FrameSyncState): void {
        if (this.state !== newState) {
            const oldState = this.state;
            this.state = newState;
            this.eventTarget.emit(FrameSyncEvent.STATE_CHANGED, oldState, newState);
        }
    }

    /**
     * 获取当前状态
     */
    public getState(): FrameSyncState {
        return this.state;
    }

    /**
     * 获取当前逻辑帧索引
     */
    public getCurrentLogicFrameIndex(): number {
        return this.currentLogicFrameIndex;
    }

    /**
     * 获取渲染插值系数 (0-1)
     * 用于在逻辑帧之间进行插值渲染
     */
    public getRenderAlpha(): number {
        return this.renderAlpha;
    }

    /**
     * 获取逻辑帧时间
     */
    public getLogicFrameTime(): number {
        return this.logicFrameTime;
    }

    /**
     * 获取当前逻辑帧时间（累计时间）
     */
    public getCurrentLogicFrameTime(): number {
        return this.currentLogicFrameTime;
    }

    /**
     * 获取上一个逻辑帧时间
     */
    public getLastLogicFrameTime(): number {
        return this.lastLogicFrameTime;
    }

    /**
     * 获取确定性随机数生成器
     */
    public getRandom(): DeterministicRandom | null {
        return this.random;
    }

    /**
     * 设置随机数种子
     */
    public setRandomSeed(seed: number): void {
        if (this.random) {
            this.random.setSeed(seed);
        }
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
            totalLogicFrames: 0,
            totalRenderFrames: 0,
        };
    }
}
