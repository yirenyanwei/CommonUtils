/*
 * @Desc: 战斗回放器。逐帧消费逻辑层产出的战斗记录，驱动表现层动画。完全不参与战斗计算
 */
import { Color, Component, Label, Node, Vec3, tween } from 'cc';
import { BattleResult } from '../battle-core';
import { BattleFrame, FrameType } from '../battle-core/record/battle-record';
import { getSkillView } from '../data/skill-view-config';
import { HeroView } from './hero-view';
import { showFloatingText } from './floating-text';

const RESULT_TEXT: Record<string, string> = {
    [BattleResult.ALLY_WIN]: '胜利！',
    [BattleResult.ENEMY_WIN]: '失败…',
    [BattleResult.DRAW]: '平局',
};

export class BattlePlayer {
    /** 每个武将当前的 Buff 名称列表，用于刷新展示 */
    private readonly buffNames = new Map<number, string[]>();

    constructor(
        private readonly host: Component,
        private readonly heroViews: Map<number, HeroView>,
        private readonly fxLayer: Node,
        private readonly roundLabel: Label,
        private readonly resultLabel: Label,
        private readonly stage: Node,
    ) {}

    async play(frames: BattleFrame[]): Promise<void> {
        for (const frame of frames) {
            await this.playFrame(frame);
        }
    }

    private async playFrame(frame: BattleFrame): Promise<void> {
        switch (frame.type) {
            case FrameType.ROUND_START:
                this.roundLabel.string = `第 ${frame.round} 回合`;
                await this.sleep(0.35);
                break;
            case FrameType.SKILL_CAST: {
                const view = getSkillView(frame.skillId);
                const caster = this.getView(frame.casterId);
                caster?.playCastMotion(view.castMotion, view.castDuration);
                if (view.banner && caster && frame.skillName) {
                    showFloatingText(this.host, this.fxLayer, caster.worldPosition, frame.skillName, new Color(255, 235, 150, 255), 26);
                }
                await this.sleep(view.castDuration);
                break;
            }
            case FrameType.PLAYER_SKILL_CAST: {
                this.roundLabel.string = `主动技：${frame.skillName ?? ''}`;
                const view = getSkillView(frame.skillId);
                const caster = this.getView(frame.casterId);
                if (caster && frame.skillName) {
                    showFloatingText(this.host, this.fxLayer, caster.worldPosition, frame.skillName, new Color(255, 235, 150, 255), 28);
                }
                if (view.shakeOnHit) {
                    this.shakeStage();
                }
                await this.sleep(0.4);
                break;
            }
            case FrameType.DAMAGE: {
                const view = this.getView(frame.targetId);
                const skillView = getSkillView(frame.skillId);
                if (view) {
                    view.playHurt();
                    view.setHp(frame.hpAfter ?? 0);
                    const [r, g, b] = skillView.hitColor;
                    const color = frame.isCrit ? new Color(255, 200, 40, 255) : new Color(r, g, b, 255);
                    const text = frame.isCrit ? `${frame.value} 暴击!` : `${frame.value}`;
                    showFloatingText(this.host, this.fxLayer, view.worldPosition, text, color, frame.isCrit ? 36 : 30);
                    if ((frame.absorbed ?? 0) > 0) {
                        showFloatingText(this.host, this.fxLayer, view.worldPosition, `护盾 -${frame.absorbed}`, new Color(120, 200, 255, 255), 22);
                    }
                    if (skillView.shakeOnHit) {
                        this.shakeStage();
                    }
                }
                await this.sleep(0.3);
                break;
            }
            case FrameType.HEAL: {
                const view = this.getView(frame.targetId);
                if (view && (frame.value ?? 0) > 0) {
                    view.setHp(frame.hpAfter ?? 0);
                    showFloatingText(this.host, this.fxLayer, view.worldPosition, `+${frame.value}`, new Color(90, 220, 110, 255));
                }
                await this.sleep(0.2);
                break;
            }
            case FrameType.ENERGY_CHANGE:
                this.getView(frame.casterId)?.setEnergy(frame.energyAfter ?? 0);
                break;
            case FrameType.BUFF_ADD: {
                const view = this.getView(frame.targetId);
                if (view && frame.targetId !== undefined) {
                    this.addBuff(frame.targetId, frame.buffName ?? '');
                    view.setBuffText(this.buffText(frame.targetId));
                    showFloatingText(this.host, this.fxLayer, view.worldPosition, `[${frame.buffName}]`, new Color(255, 220, 120, 255), 22);
                }
                await this.sleep(0.2);
                break;
            }
            case FrameType.BUFF_REMOVE: {
                const view = this.getView(frame.targetId);
                if (view && frame.targetId !== undefined) {
                    this.removeBuff(frame.targetId, frame.buffName ?? '');
                    view.setBuffText(this.buffText(frame.targetId));
                }
                break;
            }
            case FrameType.DEATH:
                this.getView(frame.targetId)?.die();
                await this.sleep(0.3);
                break;
            case FrameType.BATTLE_END:
                this.resultLabel.string = RESULT_TEXT[frame.result ?? BattleResult.DRAW] ?? '';
                this.resultLabel.node.active = true;
                break;
            default:
                break;
        }
    }

    private getView(instanceId?: number): HeroView | undefined {
        return instanceId === undefined ? undefined : this.heroViews.get(instanceId);
    }

    private addBuff(instanceId: number, name: string): void {
        const list = this.buffNames.get(instanceId) ?? [];
        list.push(name);
        this.buffNames.set(instanceId, list);
    }

    private removeBuff(instanceId: number, name: string): void {
        const list = this.buffNames.get(instanceId);
        if (!list) {
            return;
        }
        const index = list.indexOf(name);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }

    private buffText(instanceId: number): string {
        const list = this.buffNames.get(instanceId) ?? [];
        return list.join(' ');
    }

    private shakeStage(): void {
        tween(this.stage)
            .by(0.04, { position: new Vec3(10, 0, 0) })
            .by(0.04, { position: new Vec3(-20, 0, 0) })
            .by(0.04, { position: new Vec3(20, 0, 0) })
            .by(0.04, { position: new Vec3(-10, 0, 0) })
            .start();
    }

    private sleep(seconds: number): Promise<void> {
        return new Promise((resolve) => {
            this.host.scheduleOnce(() => resolve(), seconds);
        });
    }
}
