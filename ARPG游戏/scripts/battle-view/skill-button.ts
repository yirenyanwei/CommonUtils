import { _decorator, Component, Node, Label, ProgressBar, EventTouch } from 'cc';

const { ccclass, property } = _decorator;

// ============================================================
// SkillButton — 技能按钮（含 CD 进度条显示）
// ============================================================

@ccclass('SkillButton')
export class SkillButton extends Component {
    @property(Label) slotLabel: Label | null = null;
    @property(ProgressBar) cdMask: ProgressBar | null = null;

    slot: 1 | 2 | 3 = 1;
    onPressed: (() => void) | null = null;

    private cdTotal = 0;
    private cdRemain = 0;

    onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd(_e: EventTouch): void {
        if (this.cdRemain <= 0) {
            this.onPressed?.();
        }
    }

    /** 每帧调用，传入当前剩余 tick 和总 tick */
    updateCooldown(remainTicks: number, totalTicks: number): void {
        this.cdRemain  = remainTicks;
        this.cdTotal   = totalTicks;
        const progress = totalTicks > 0 ? remainTicks / totalTicks : 0;
        if (this.cdMask) this.cdMask.progress = progress;
    }
}
