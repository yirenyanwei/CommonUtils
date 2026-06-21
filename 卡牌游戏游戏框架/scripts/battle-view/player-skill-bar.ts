/*
 * @Desc: 我方主动技能按钮栏（底部）。展示能量条 + 每个主动技能按钮，点击回调交给入口处理
 */
import { Color, Graphics, Label, Node, UITransform, Vec3 } from 'cc';
import { PlayerSkillInfo } from '../battle-core';
import { ResolvedBattleLayout, BattleLayout } from './battle-layout';

const BTN_W = 150;
const BTN_H = 56;
const BTN_GAP = 24;
const BAR_W = 360;
const BAR_H = 14;

export type SkillClickHandler = (skillId: string) => void;

interface SkillButton {
    info: PlayerSkillInfo;
    node: Node;
    bg: Graphics;
    label: Label;
    enabled: boolean;
    pending: boolean;
}

export class PlayerSkillBar {
    private readonly buttons: SkillButton[] = [];
    private readonly energyBar: Graphics;
    private readonly energyLabel: Label;
    private selectingSkillId: string | null = null;

    constructor(
        parent: Node,
        skills: PlayerSkillInfo[],
        private readonly onClick: SkillClickHandler,
        layout: ResolvedBattleLayout = BattleLayout,
    ) {
        const bottomY = layout.skillButtonY;
        const energyY = bottomY + layout.skillEnergyOffsetY;

        const energyNode = this.createChild(parent, 'player-energy-bar', 0, energyY);
        this.energyBar = energyNode.addComponent(Graphics);
        this.energyLabel = this.createLabel(parent, 'player-energy-text', '能量 0/0', 0, energyY, 16, Color.WHITE);

        const totalWidth = skills.length * BTN_W + (skills.length - 1) * BTN_GAP;
        let x = -totalWidth / 2 + BTN_W / 2;
        for (const info of skills) {
            this.buttons.push(this.createButton(parent, info, x, bottomY));
            x += BTN_W + BTN_GAP;
        }
        this.drawEnergy(0, 1);
    }

    setEnergy(energy: number, max: number): void {
        this.drawEnergy(energy, max);
        this.energyLabel.string = `能量 ${energy}/${max}`;
    }

    setButtonState(skillId: string, enabled: boolean, pending: boolean): void {
        const button = this.buttons.find((b) => b.info.skillId === skillId);
        if (!button) {
            return;
        }
        button.enabled = enabled;
        button.pending = pending;
        this.drawButton(button);
    }

    /** 进入/退出目标选择提示态（高亮某个按钮为"选择目标中"） */
    setSelecting(skillId: string | null): void {
        this.selectingSkillId = skillId;
        for (const button of this.buttons) {
            this.drawButton(button);
        }
    }

    private createButton(parent: Node, info: PlayerSkillInfo, x: number, y: number): SkillButton {
        const node = this.createChild(parent, `skill-btn-${info.skillId}`, x, y);
        node.getComponent(UITransform)!.setContentSize(BTN_W, BTN_H);
        const bg = node.addComponent(Graphics);
        const label = this.createLabel(node, 'label', '', 0, 0, 18, Color.WHITE);
        const button: SkillButton = { info, node, bg, label, enabled: false, pending: false };
        node.on(Node.EventType.TOUCH_END, () => {
            if (button.enabled && !button.pending) {
                this.onClick(info.skillId);
            }
        });
        this.drawButton(button);
        return button;
    }

    private drawButton(button: SkillButton): void {
        const g = button.bg;
        g.clear();
        let fill: Color;
        if (button.pending) {
            fill = new Color(90, 90, 110, 255);
        } else if (button.enabled) {
            fill = new Color(70, 130, 220, 255);
        } else {
            fill = new Color(55, 55, 60, 255);
        }
        g.fillColor = fill;
        g.roundRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, 10);
        g.fill();
        button.label.string = this.computeLabel(button);
        button.label.color = button.enabled || button.pending ? Color.WHITE : new Color(150, 150, 150, 255);
    }

    private computeLabel(button: SkillButton): string {
        if (this.selectingSkillId === button.info.skillId) {
            return '选择目标…';
        }
        if (button.pending) {
            return `已排入\n${button.info.name}`;
        }
        return `${button.info.name}\n耗能${button.info.cost}`;
    }

    private drawEnergy(energy: number, max: number): void {
        const g = this.energyBar;
        g.clear();
        g.fillColor = new Color(35, 35, 35, 255);
        g.rect(-BAR_W / 2, -BAR_H / 2, BAR_W, BAR_H);
        g.fill();
        const ratio = max > 0 ? Math.max(0, Math.min(1, energy / max)) : 0;
        g.fillColor = new Color(245, 200, 60, 255);
        g.rect(-BAR_W / 2, -BAR_H / 2, BAR_W * ratio, BAR_H);
        g.fill();
    }

    private createChild(parent: Node, name: string, x: number, y: number): Node {
        const node = new Node(name);
        node.addComponent(UITransform);
        parent.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        return node;
    }

    private createLabel(parent: Node, name: string, text: string, x: number, y: number, fontSize: number, color: Color): Label {
        const node = this.createChild(parent, name, x, y);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 2;
        label.color = color;
        label.enableOutline = true;
        label.outlineColor = new Color(0, 0, 0, 200);
        label.outlineWidth = 2;
        return label;
    }
}
