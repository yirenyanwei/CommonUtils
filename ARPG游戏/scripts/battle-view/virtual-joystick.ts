import { _decorator, Component, Node, Vec2, EventTouch, UITransform, v2 } from 'cc';

const { ccclass, property } = _decorator;

// ============================================================
// VirtualJoystick — 8 方向虚拟摇杆
// 向 BattleEntry 提供归一化方向向量，不处理游戏逻辑
// ============================================================

@ccclass('VirtualJoystick')
export class VirtualJoystick extends Component {
    @property(Node) background: Node | null = null;
    @property(Node) thumb: Node | null = null;

    private readonly RADIUS = 80;
    private direction: Vec2 = v2(0, 0);
    private touching = false;
    private basePos: Vec2 = v2(0, 0);

    onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START,  this.onTouchStart,  this);
        this.node.on(Node.EventType.TOUCH_MOVE,   this.onTouchMove,   this);
        this.node.on(Node.EventType.TOUCH_END,    this.onTouchEnd,    this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd,    this);
    }

    private onTouchStart(e: EventTouch): void {
        this.touching = true;
        const uiPos = e.getUILocation();
        this.basePos.set(uiPos.x, uiPos.y);
        this.updateThumb(uiPos.x, uiPos.y);
    }

    private onTouchMove(e: EventTouch): void {
        if (!this.touching) return;
        const uiPos = e.getUILocation();
        this.updateThumb(uiPos.x, uiPos.y);
    }

    private onTouchEnd(_e: EventTouch): void {
        this.touching = false;
        this.direction.set(0, 0);
        if (this.thumb) this.thumb.setPosition(0, 0, 0);
    }

    private updateThumb(x: number, y: number): void {
        const dx = x - this.basePos.x;
        const dy = y - this.basePos.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(len, this.RADIUS);

        if (len > 0.01) {
            this.direction.set(dx / len, dy / len);
            if (this.thumb) {
                this.thumb.setPosition(
                    (dx / len) * clamped,
                    (dy / len) * clamped,
                    0,
                );
            }
        } else {
            this.direction.set(0, 0);
        }
    }

    /** 返回归一化方向（x: -1~1，y: -1~1） */
    getDirection(): { dx: number; dy: number } {
        // 8 方向量化
        const dx = Math.abs(this.direction.x) > 0.2 ? Math.sign(this.direction.x) : 0;
        const dy = Math.abs(this.direction.y) > 0.5 ? Math.sign(this.direction.y) : 0;
        return { dx, dy };
    }

    isActive(): boolean {
        return this.touching;
    }
}
