/*
 * @Desc: 单个武将的表现节点（纯代码构建，无需 Prefab）。只负责渲染，不含战斗逻辑
 */
import { Color, Graphics, Label, Node, UIOpacity, UITransform, Vec3, tween } from 'cc';
import { Camp } from '../battle-core';
import { HeroSnapshot } from '../battle-core/record/battle-record';
import { BattleLayout, heroRowY, resolveBattleLayout, ResolvedBattleLayout } from './battle-layout';

export type HeroTapHandler = (instanceId: number) => void;

const BODY_W = 96;
const BODY_H = 96;
const BAR_W = 110;
const BAR_H = 12;

const ALLY_COLOR = new Color(70, 130, 220, 255);
const ENEMY_COLOR = new Color(210, 80, 80, 255);

export class HeroView {
    readonly root: Node;
    readonly instanceId: number;
    readonly camp: Camp;

    private readonly maxHp: number;
    private readonly maxEnergy: number;
    private hp: number;
    private energy: number;
    private readonly baseColor: Color;

    private readonly body: Graphics;
    private readonly highlight: Graphics;
    private readonly hpBar: Graphics;
    private readonly energyBar: Graphics;
    private readonly hpLabel: Label;
    private readonly buffLabel: Label;

    private tapHandler?: HeroTapHandler;
    private selectable = false;
    private alive = true;

    constructor(parent: Node, snapshot: HeroSnapshot, layout: ResolvedBattleLayout = BattleLayout) {
        this.instanceId = snapshot.instanceId;
        this.camp = snapshot.camp;
        this.maxHp = snapshot.maxHp;
        this.maxEnergy = snapshot.maxEnergy;
        this.hp = snapshot.hp;
        this.energy = snapshot.energy;
        this.baseColor = snapshot.camp === Camp.ALLY ? ALLY_COLOR : ENEMY_COLOR;

        this.root = new Node(`hero-${snapshot.instanceId}`);
        this.root.addComponent(UITransform).setContentSize(BODY_W, BODY_H);
        this.root.addComponent(UIOpacity);
        parent.addChild(this.root);
        this.root.setPosition(this.computePosition(snapshot, layout));

        this.highlight = this.createChild('highlight', 0, 0).addComponent(Graphics);
        this.body = this.createChild('body', 0, 0).addComponent(Graphics);
        this.drawBody(this.baseColor);

        this.root.on(Node.EventType.TOUCH_END, this.onTouch, this);

        this.createLabel('name', snapshot.name, 0, BODY_H / 2 + 10, 20, Color.WHITE);

        this.hpBar = this.createChild('hp-bar', 0, -BODY_H / 2 - 10).addComponent(Graphics);
        this.hpLabel = this.createLabel('hp-text', '', 0, -BODY_H / 2 - 10, 14, Color.WHITE);
        this.energyBar = this.createChild('energy-bar', 0, -BODY_H / 2 - 24).addComponent(Graphics);
        this.buffLabel = this.createLabel('buff', '', 0, -BODY_H / 2 - 38, 14, new Color(255, 220, 120, 255));

        this.drawHpBar();
        this.drawEnergyBar();
    }

    get worldPosition(): Vec3 {
        return this.root.getWorldPosition();
    }

    setHp(hp: number): void {
        this.hp = Math.max(0, hp);
        this.drawHpBar();
    }

    setEnergy(energy: number): void {
        this.energy = Math.max(0, energy);
        this.drawEnergyBar();
    }

    setBuffText(text: string): void {
        this.buffLabel.string = text;
    }

    /** 受击闪烁 */
    playHurt(): void {
        this.drawBody(new Color(255, 255, 255, 255));
        tween(this.body)
            .delay(0.1)
            .call(() => this.drawBody(this.baseColor))
            .start();
        tween(this.root)
            .by(0.05, { position: new Vec3(8, 0, 0) })
            .by(0.05, { position: new Vec3(-16, 0, 0) })
            .by(0.05, { position: new Vec3(8, 0, 0) })
            .start();
    }

    /** 出手前冲一下（默认缩放） */
    playCast(): void {
        this.playCastMotion('scale', 0.24);
    }

    /** 按表现配置播放施法动作 */
    playCastMotion(motion: 'lunge' | 'scale' | 'shake', duration: number): void {
        const half = Math.max(0.06, duration / 2);
        if (motion === 'lunge') {
            const dir = this.camp === Camp.ALLY ? 1 : -1;
            tween(this.root)
                .by(half, { position: new Vec3(40 * dir, 0, 0) })
                .by(half, { position: new Vec3(-40 * dir, 0, 0) })
                .start();
            return;
        }
        if (motion === 'shake') {
            tween(this.root)
                .by(half / 3, { position: new Vec3(0, 10, 0) })
                .by(half / 3, { position: new Vec3(0, -20, 0) })
                .by(half / 3, { position: new Vec3(0, 10, 0) })
                .start();
            return;
        }
        tween(this.root)
            .by(half, { scale: new Vec3(0.18, 0.18, 0) })
            .by(half, { scale: new Vec3(-0.18, -0.18, 0) })
            .start();
    }

    die(): void {
        this.alive = false;
        this.setSelectable(false);
        const opacity = this.root.getComponent(UIOpacity)!;
        tween(opacity).to(0.3, { opacity: 70 }).start();
    }

    setTapHandler(handler?: HeroTapHandler): void {
        this.tapHandler = handler;
    }

    /** 设为可选目标（目标选择模式下高亮，可点击） */
    setSelectable(value: boolean): void {
        this.selectable = value && this.alive;
        this.drawHighlight();
    }

    private onTouch(): void {
        if (this.selectable && this.alive && this.tapHandler) {
            this.tapHandler(this.instanceId);
        }
    }

    private drawHighlight(): void {
        const g = this.highlight;
        g.clear();
        if (!this.selectable) {
            return;
        }
        g.lineWidth = 6;
        g.strokeColor = new Color(255, 230, 90, 255);
        g.roundRect(-BODY_W / 2 - 6, -BODY_H / 2 - 6, BODY_W + 12, BODY_H + 12, 12);
        g.stroke();
    }

    private computePosition(snapshot: HeroSnapshot, layout: ResolvedBattleLayout): Vec3 {
        const x = snapshot.camp === Camp.ALLY ? layout.heroAllyX : layout.heroEnemyX;
        const y = heroRowY(snapshot.position, layout);
        return new Vec3(x, y, 0);
    }

    private drawBody(fill: Color): void {
        const g = this.body;
        g.clear();
        g.fillColor = fill;
        g.roundRect(-BODY_W / 2, -BODY_H / 2, BODY_W, BODY_H, 10);
        g.fill();
    }

    private drawHpBar(): void {
        const g = this.hpBar;
        g.clear();
        g.fillColor = new Color(35, 35, 35, 255);
        g.rect(-BAR_W / 2, -BAR_H / 2, BAR_W, BAR_H);
        g.fill();
        const ratio = this.maxHp > 0 ? Math.max(0, this.hp / this.maxHp) : 0;
        g.fillColor = new Color(70, 200, 90, 255);
        g.rect(-BAR_W / 2, -BAR_H / 2, BAR_W * ratio, BAR_H);
        g.fill();
        this.hpLabel.string = `${this.hp}/${this.maxHp}`;
    }

    private drawEnergyBar(): void {
        const g = this.energyBar;
        g.clear();
        g.fillColor = new Color(35, 35, 35, 255);
        g.rect(-BAR_W / 2, -BAR_H / 2, BAR_W, BAR_H);
        g.fill();
        const ratio = this.maxEnergy > 0 ? Math.max(0, this.energy / this.maxEnergy) : 0;
        g.fillColor = new Color(245, 200, 60, 255);
        g.rect(-BAR_W / 2, -BAR_H / 2, BAR_W * ratio, BAR_H);
        g.fill();
    }

    private createChild(name: string, x: number, y: number): Node {
        const node = new Node(name);
        node.addComponent(UITransform);
        this.root.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        return node;
    }

    private createLabel(name: string, text: string, x: number, y: number, fontSize: number, color: Color): Label {
        const node = this.createChild(name, x, y);
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
