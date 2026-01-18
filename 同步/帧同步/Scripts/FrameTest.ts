import { _decorator, Component, Node, log, Vec3, EventTouch } from 'cc';
import { FrameSyncManager } from './FrameSyncManager';
import { FrameSyncEvent, InputType } from './types';

const { ccclass, property } = _decorator;

/**
 * 帧同步测试组件
 * 演示如何使用简化的帧同步框架（逻辑帧和渲染帧分离）
 */
@ccclass('FrameTest')
export class FrameTest extends Component {
    @property(Node)
    public playerNode: Node = null!;
    @property(Node)
    public touchNode: Node = null!;

    private frameSyncManager: FrameSyncManager | null = null;
    
    // 逻辑帧状态（用于演示）
    private logicPosition: Vec3 = new Vec3(0, 0, 0);
    private lastLogicPosition: Vec3 = new Vec3(0, 0, 0);
    private logicVelocity: Vec3 = new Vec3(0, 0, 0);

    private isTouching: boolean = false;
    protected onEnable(): void {
        this.touchNode.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.touchNode.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.touchNode.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
    protected onDisable(): void {
        this.touchNode.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.touchNode.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.touchNode.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    start() {
        // 获取帧同步管理器
        this.frameSyncManager = FrameSyncManager.getInstance();
        
        if (!this.frameSyncManager) {
            log('FrameSyncManager not found, please add it to scene');
            return;
        }

        // 初始化帧同步
        this.initFrameSync();
    }

    /**
     * 初始化帧同步
     */
    private initFrameSync() {
        if (!this.frameSyncManager) return;

        // 监听逻辑帧事件
        this.frameSyncManager.eventTarget.on(
            FrameSyncEvent.LOGIC_FRAME_START, 
            this.onLogicFrameStart, 
            this
        );
        
        // 监听渲染帧事件（用于插值）
        this.frameSyncManager.eventTarget.on(
            FrameSyncEvent.RENDER_FRAME, 
            this.onRenderFrame, 
            this
        );

        // 初始化并启动帧同步
        this.frameSyncManager.init({
            logicFrameRate: 30,
            enableInterpolation: false
        });

        this.frameSyncManager.start();
        log('FrameSync initialized and started');
    }

    update(deltaTime: number) {
        // 帧同步管理器会在自己的update中处理逻辑帧和渲染帧
        // 这里可以处理其他渲染相关的逻辑

        if(this.isTouching) {
            this.recordMoveInput({
                x: 50,
                y: 0,
                z: 0
            });
        }
    }

    /**
     * 逻辑帧开始回调
     * 在这里执行游戏逻辑（物理、AI、碰撞检测等）
     */
    private onLogicFrameStart(frameIndex: number) {
        if (!this.frameSyncManager) return;

        // 获取该帧的输入
        const input = this.frameSyncManager.getInput(frameIndex);
        
        // 处理输入
        if (input) {
            this.processInput(input);
        }

        // 执行游戏逻辑
        this.updateGameLogic();
    }

    /**
     * 处理输入
     */
    private processInput(input: any) {
        switch (input.inputType) {
            case InputType.MOVE:
                // 处理移动输入
                if (input.data) {
                    this.logicVelocity.set(input.data.x || 0, input.data.y || 0, input.data.z || 0);
                }
                break;
            case InputType.ATTACK:
                // 处理攻击输入
                log(`Attack at frame ${input.frameIndex}`);
                break;
            // ... 其他输入类型
        }
    }

    /**
     * 更新游戏逻辑
     */
    private updateGameLogic() {
        // 保存上一帧的位置（用于插值）
        this.lastLogicPosition.set(this.logicPosition);

        // 更新位置（逻辑帧）
        const frameTime = this.frameSyncManager?.getLogicFrameTime() || (1/60);
        this.logicPosition.x += this.logicVelocity.x * frameTime;
        this.logicPosition.y += this.logicVelocity.y * frameTime;
        this.logicPosition.z += this.logicVelocity.z * frameTime;

        // 应用摩擦力
        this.logicVelocity.multiplyScalar(0.9);
    }

    /**
     * 渲染帧回调
     * 在这里进行插值渲染，让画面更平滑
     */
    private onRenderFrame(alpha: number) {
        if (!this.playerNode) return;

        // 使用插值系数在上一帧和当前帧之间插值
        // alpha: 0 表示上一逻辑帧，1 表示当前逻辑帧
        const renderX = this.lastLogicPosition.x + (this.logicPosition.x - this.lastLogicPosition.x) * alpha;
        const renderY = this.lastLogicPosition.y + (this.logicPosition.y - this.lastLogicPosition.y) * alpha;
        const renderZ = this.lastLogicPosition.z + (this.logicPosition.z - this.lastLogicPosition.z) * alpha;

        // 更新渲染位置
        this.playerNode.setPosition(renderX, renderY, renderZ);
    }

    private onTouchStart(event: EventTouch) {
        this.isTouching = true;
    }

    private onTouchMove(event: EventTouch) {
    }

    private onTouchEnd(event: EventTouch) {
        this.isTouching = false;
    }

    /**
     * 示例：记录移动输入
     */
    public recordMoveInput(direction: { x?: number, y?: number, z?: number }) {
        if (this.frameSyncManager) {
            this.frameSyncManager.recordInput(InputType.MOVE, direction);
        }
    }

    /**
     * 示例：记录攻击输入
     */
    public recordAttackInput() {
        if (this.frameSyncManager) {
            this.frameSyncManager.recordInput(InputType.ATTACK);
        }
    }

    protected onDestroy(): void {
        if (this.frameSyncManager) {
            this.frameSyncManager.eventTarget.off(FrameSyncEvent.LOGIC_FRAME_START, this.onLogicFrameStart, this);
            this.frameSyncManager.eventTarget.off(FrameSyncEvent.RENDER_FRAME, this.onRenderFrame, this);
        }
    }
}
