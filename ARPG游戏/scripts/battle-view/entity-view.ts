import { _decorator, Component, Node, Label, ProgressBar, Color, Sprite } from 'cc';
import { EntitySnapshot } from '../battle-core/event/battle-event';

const { ccclass, property } = _decorator;

// ============================================================
// EntityView — 单个角色的表现层节点
// 由 BattleEntry 创建并绑定 entityId，
// 消费 ENTITY_MOVE / DAMAGE / GE_APPLIED 等事件更新显示。
// ============================================================

@ccclass('EntityView')
export class EntityView extends Component {
    @property(ProgressBar) hpBar: ProgressBar | null = null;
    @property(ProgressBar) mpBar: ProgressBar | null = null;
    @property(Label) nameLabel: Label | null = null;

    entityId: string = '';

    private maxHp = 1;
    private maxMp = 1;

    /** 根据 BATTLE_START 快照初始化 */
    init(snapshot: EntitySnapshot): void {
        this.entityId = snapshot.entityId;
        this.maxHp = snapshot.maxHp;
        this.maxMp = snapshot.maxMp;
        if (this.hpBar) this.hpBar.progress = 1;
        if (this.mpBar) this.mpBar.progress = 1;
    }

    onMove(x: number, y: number, facing: 1 | -1): void {
        this.node.setPosition(x, y, 0);
        // 面向翻转（Spine 在子节点）
        const child = this.node.children[0];
        if (child) {
            const s = child.scale;
            child.setScale(Math.abs(s.x) * facing, s.y, s.z);
        }
    }

    onHpChange(hp: number): void {
        if (this.hpBar) this.hpBar.progress = hp / this.maxHp;
    }

    onMpChange(mp: number): void {
        if (this.mpBar) this.mpBar.progress = mp / this.maxMp;
    }

    onDeath(): void {
        this.node.active = false;
    }
}
