import { _decorator, Component, Label, tween, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

// ============================================================
// DamageNumber — 飘字特效组件（Pool 管理由 BattleEntry 负责）
// ============================================================

@ccclass('DamageNumber')
export class DamageNumber extends Component {
    @property(Label) label: Label | null = null;

    show(damage: number, isCrit: boolean, x: number, y: number): void {
        this.node.setPosition(x, y + 30, 0);
        if (this.label) {
            this.label.string = isCrit ? `${damage}!` : `${damage}`;
            this.label.color = isCrit
                ? { r: 255, g: 200, b: 0, a: 255 } as any
                : { r: 255, g: 255, b: 255, a: 255 } as any;
        }
        this.node.active = true;

        // 上浮 + 淡出
        tween(this.node)
            .to(0.6, { position: new Vec3(x, y + 80, 0) })
            .call(() => { this.node.active = false; })
            .start();
    }
}
