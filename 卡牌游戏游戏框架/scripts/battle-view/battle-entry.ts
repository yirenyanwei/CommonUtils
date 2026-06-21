/*
 * @Desc: 战斗入口组件（交互式）。挂到场景 Canvas 上即可运行：
 *        逐回合推进 → 玩家可随时点击主动技能（攒满能量后），指令在下一回合开始结算 → 表现层回放
 */
import { _decorator, Color, Component, Label, Node, UIOpacity, UITransform, Vec3 } from 'cc';
import { Battle, Camp, PlayerSkillInfo, TargetType, createBattle } from '../battle-core';
import { BattleFrame, FrameType } from '../battle-core/record/battle-record';
import { SAMPLE_CONFIG, SAMPLE_SETUP } from '../data/sample-data';
import { HeroView } from './hero-view';
import { BattlePlayer } from './battle-player';
import { PlayerSkillBar } from './player-skill-bar';
import { BattleLayout, resolveBattleLayout, ResolvedBattleLayout } from './battle-layout';

const { ccclass } = _decorator;
const MAX_ROUND_GUARD = 60;

@ccclass('BattleEntry')
export class BattleEntry extends Component {
    private battle!: Battle;
    private player!: BattlePlayer;
    private skillBar!: PlayerSkillBar;
    private readonly heroViews = new Map<number, HeroView>();
    private skillInfos: PlayerSkillInfo[] = [];
    private selectingSkillId: string | null = null;
    private roundLabel!: Label;
    private layout!: ResolvedBattleLayout;

    start(): void {
        void this.runInteractive();
    }

    private async runInteractive(): Promise<void> {
        const canvasTransform = this.node.getComponent(UITransform)!;
        this.layout = resolveBattleLayout(canvasTransform.contentSize.height);

        this.battle = createBattle(SAMPLE_CONFIG, SAMPLE_SETUP);
        const stage = this.createStage();

        const beginFrames = this.battle.begin();
        this.buildHeroViews(stage, beginFrames);

        this.roundLabel = this.createTopLabel('round-label', '准备战斗', this.layout.roundLabelY, 28, Color.WHITE);
        const resultLabel = this.createTopLabel('result-label', '', this.layout.resultLabelY, 56, new Color(255, 215, 80, 255));
        resultLabel.node.active = false;

        const fxLayer = new Node('fx-layer');
        fxLayer.addComponent(UITransform);
        stage.addChild(fxLayer);

        this.player = new BattlePlayer(this, this.heroViews, fxLayer, this.roundLabel, resultLabel, stage);

        this.skillInfos = this.battle.getPlayerSkills();
        this.skillBar = new PlayerSkillBar(this.node, this.skillInfos, (id) => this.onSkillClick(id), this.layout);
        this.roundLabel.node.setSiblingIndex(this.node.children.length - 1);
        for (const view of this.heroViews.values()) {
            view.setTapHandler((id) => this.onHeroTap(id));
        }
        this.refreshSkillBar();

        await this.player.play(beginFrames);

        let guard = 0;
        while (!this.battle.isEnded && guard++ < MAX_ROUND_GUARD) {
            const begin = this.battle.stepBeginRound();
            this.refreshSkillBar();
            await this.player.play(begin);
            if (this.battle.isOver) {
                break;
            }
            const { frames } = this.battle.stepResolveRound();
            await this.player.play(frames);
            this.refreshSkillBar();
            if (this.battle.isOver) {
                break;
            }
        }

        const endFrames = this.battle.finish();
        this.refreshSkillBar();
        await this.player.play(endFrames);
        console.log(`[battle] 结束：${this.battle.battleResult}，指令日志=${JSON.stringify(this.battle.commandLog)}`);
    }

    private onSkillClick(skillId: string): void {
        if (!this.battle.canEnqueue(skillId)) {
            return;
        }
        const info = this.skillInfos.find((s) => s.skillId === skillId);
        if (!info) {
            return;
        }
        if (this.needsTarget(info.targetType)) {
            this.enterTargetSelection(skillId, info.targetType);
        } else {
            this.battle.enqueuePlayerSkill(skillId);
            this.refreshSkillBar();
        }
    }

    private onHeroTap(instanceId: number): void {
        if (!this.selectingSkillId) {
            return;
        }
        this.battle.enqueuePlayerSkill(this.selectingSkillId, instanceId);
        this.exitTargetSelection();
        this.refreshSkillBar();
    }

    private enterTargetSelection(skillId: string, targetType: string): void {
        this.selectingSkillId = skillId;
        this.skillBar.setSelecting(skillId);
        const camp = targetType === TargetType.SINGLE_ENEMY ? Camp.ENEMY : Camp.ALLY;
        for (const view of this.heroViews.values()) {
            view.setSelectable(view.camp === camp);
        }
    }

    private exitTargetSelection(): void {
        this.selectingSkillId = null;
        this.skillBar.setSelecting(null);
        for (const view of this.heroViews.values()) {
            view.setSelectable(false);
        }
    }

    private needsTarget(targetType: string): boolean {
        return targetType === TargetType.SINGLE_ENEMY || targetType === TargetType.SINGLE_ALLY;
    }

    private refreshSkillBar(): void {
        this.skillBar.setEnergy(this.battle.playerEnergy, this.battle.playerMaxEnergy);
        for (const info of this.skillInfos) {
            this.skillBar.setButtonState(
                info.skillId,
                this.battle.canEnqueue(info.skillId),
                this.battle.isPending(info.skillId),
            );
        }
    }

    private createStage(): Node {
        const stage = new Node('battle-stage');
        stage.addComponent(UITransform);
        this.node.addChild(stage);
        stage.setPosition(new Vec3(0, 0, 0));
        return stage;
    }

    private buildHeroViews(stage: Node, frames: BattleFrame[]): void {
        const snapshot = frames.find((f) => f.type === FrameType.BATTLE_START)?.snapshot;
        if (!snapshot) {
            return;
        }
        for (const hero of snapshot.heroes) {
            this.heroViews.set(hero.instanceId, new HeroView(stage, hero, this.layout));
        }
    }

    /** 顶部 HUD（回合/结果），始终置于最上层避免被战斗层遮挡 */
    private createTopLabel(name: string, text: string, y: number, fontSize: number, color: Color): Label {
        const label = this.createLabel(name, text, 0, y, fontSize, color);
        label.node.setSiblingIndex(this.node.children.length - 1);
        return label;
    }

    private createLabel(name: string, text: string, x: number, y: number, fontSize: number, color: Color): Label {
        const node = new Node(name);
        node.addComponent(UITransform);
        node.addComponent(UIOpacity);
        this.node.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.color = color;
        label.enableOutline = true;
        label.outlineColor = new Color(0, 0, 0, 220);
        label.outlineWidth = 3;
        return label;
    }
}
