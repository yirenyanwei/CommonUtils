import { _decorator, Component, Node, Prefab, instantiate, Label, Button } from 'cc';
import { BattleApp } from '../battle-core/application/battle-app';
import { EntityView } from './entity-view';
import { DamageNumber } from './damage-number';
import { VirtualJoystick } from './virtual-joystick';
import { SkillButton } from './skill-button';
import {
    BattleEvent, BattleEventType,
    BattleStartPayload, EntityMovePayload,
    DamagePayload, EntityDeathPayload,
    AttributeChangePayload, AbilityActivatePayload,
    GEAppliedPayload, GERemovedPayload, ComboChangedPayload,
    BattleEndPayload,
} from '../battle-core/event/battle-event';
import { gasRegistry } from '../data/gas-registry';
import { FIXED_DT } from '../battle-core/core/fixed-tick';

const { ccclass, property } = _decorator;

// ============================================================
// BattleEntry — 战斗场景根组件（Cocos Creator 节点挂载）
//
// 职责：
//   1. 创建 BattleApp（逻辑层）
//   2. update(dt) 驱动 BattleRunner
//   3. 消费 BattleEvent，更新 EntityView / DamageNumber / UI
//   4. 采集玩家输入（摇杆 + 按钮），发送 InputCommand
//
// 严格禁止：在此文件做任何战斗计算
// ============================================================

@ccclass('BattleEntry')
export class BattleEntry extends Component {
    // ── 摇杆 & 按钮 ─────────────────────────────────────────
    @property(VirtualJoystick) joystick:  VirtualJoystick | null = null;
    @property(Node)  attackBtn:  Node | null = null;
    @property(SkillButton) skill1Btn: SkillButton | null = null;
    @property(SkillButton) skill2Btn: SkillButton | null = null;
    @property(SkillButton) skill3Btn: SkillButton | null = null;

    // ── Entity Prefab ────────────────────────────────────────
    @property(Prefab) playerPrefab: Prefab | null = null;
    @property(Prefab) enemyPrefab:  Prefab | null = null;
    @property(Prefab) damageNumPrefab: Prefab | null = null;

    // ── UI ───────────────────────────────────────────────────
    @property(Node) entityLayer: Node | null = null;
    @property(Node) effectLayer: Node | null = null;
    @property(Label) comboLabel: Label | null = null;
    @property(Label) resultLabel: Label | null = null;
    @property(Node) pausePanel: Node | null = null;

    // ── 逻辑层 ───────────────────────────────────────────────
    private app: BattleApp | null = null;
    private readonly entityViewMap = new Map<string, EntityView>();

    // ── 输入节流（每 FIXED_DT 最多发一次 Move）──────────────
    private moveTimer = 0;

    onLoad(): void {
        this.setupButtons();
    }

    start(): void {
        this.app = new BattleApp();

        // 立即消费 BATTLE_START 事件（第一次 step 之前已 emit）
        const startEvents = this.app.core.world.eventBus.drain();
        this.consumeEvents(startEvents);
    }

    update(dt: number): void {
        if (!this.app) return;

        // 采集摇杆并节流发送 Move 指令
        this.moveTimer += dt;
        if (this.moveTimer >= FIXED_DT && this.joystick?.isActive()) {
            this.moveTimer = 0;
            const { dx, dy } = this.joystick.getDirection();
            this.app.sendInput({ type: 'Move', tick: this.app.getCurrentTick(), dx, dy });
        }

        // 逻辑 tick 推进
        const events = this.app.update(dt);
        this.consumeEvents(events);

        // 更新技能 CD 显示
        this.updateCooldownDisplay();
    }

    // ─── 事件消费（View 只画不算）──────────────────────────

    private consumeEvents(events: BattleEvent[]): void {
        for (const ev of events) {
            switch (ev.type) {
                case BattleEventType.BATTLE_START:
                    this.onBattleStart(ev as BattleStartPayload);
                    break;
                case BattleEventType.ENTITY_MOVE:
                    this.onEntityMove(ev as EntityMovePayload);
                    break;
                case BattleEventType.DAMAGE:
                    this.onDamage(ev as DamagePayload);
                    break;
                case BattleEventType.ENTITY_DEATH:
                    this.onEntityDeath(ev as EntityDeathPayload);
                    break;
                case BattleEventType.ATTRIBUTE_CHANGE:
                    this.onAttributeChange(ev as AttributeChangePayload);
                    break;
                case BattleEventType.ABILITY_ACTIVATE:
                    this.onAbilityActivate(ev as AbilityActivatePayload);
                    break;
                case BattleEventType.COMBO_CHANGED:
                    this.onComboChanged(ev as ComboChangedPayload);
                    break;
                case BattleEventType.BATTLE_END:
                    this.onBattleEnd(ev as BattleEndPayload);
                    break;
            }
        }
    }

    private onBattleStart(ev: BattleStartPayload): void {
        for (const snapshot of ev.entities) {
            const prefab = snapshot.team === 'player' ? this.playerPrefab : this.enemyPrefab;
            if (!prefab || !this.entityLayer) continue;

            const node = instantiate(prefab);
            this.entityLayer.addChild(node);
            node.setPosition(snapshot.position.x, snapshot.position.y, 0);

            const view = node.getComponent(EntityView) ?? node.addComponent(EntityView);
            view.init(snapshot);
            this.entityViewMap.set(snapshot.entityId, view);
        }
    }

    private onEntityMove(ev: EntityMovePayload): void {
        this.entityViewMap.get(ev.entityId)?.onMove(ev.x, ev.y, ev.facing);
    }

    private onDamage(ev: DamagePayload): void {
        const targetView = this.entityViewMap.get(ev.targetId);
        if (!targetView) return;
        targetView.onHpChange(ev.hpAfter);

        // 飘字
        if (this.damageNumPrefab && this.effectLayer) {
            const dmgNode = instantiate(this.damageNumPrefab);
            this.effectLayer.addChild(dmgNode);
            const comp = dmgNode.getComponent(DamageNumber) ?? dmgNode.addComponent(DamageNumber);
            comp.show(ev.damage, ev.isCrit, targetView.node.position.x, targetView.node.position.y);
        }
    }

    private onEntityDeath(ev: EntityDeathPayload): void {
        this.entityViewMap.get(ev.entityId)?.onDeath();
    }

    private onAttributeChange(ev: AttributeChangePayload): void {
        const view = this.entityViewMap.get(ev.entityId);
        if (!view) return;
        if (ev.attribute === 'hp') view.onHpChange(ev.value);
        if (ev.attribute === 'mp') view.onMpChange(ev.value);
    }

    private onAbilityActivate(ev: AbilityActivatePayload): void {
        // TODO: 驱动 Spine 动画 view.playAnimation(ev.animName)
    }

    private onComboChanged(ev: ComboChangedPayload): void {
        if (this.comboLabel) {
            this.comboLabel.string = ev.count > 0 ? `${ev.count} HIT` : '';
        }
    }

    private onBattleEnd(ev: BattleEndPayload): void {
        if (this.resultLabel) {
            this.resultLabel.node.active = true;
            this.resultLabel.string = ev.result === 'win' ? '胜利！' : '失败…';
        }
    }

    // ─── 按钮绑定 ────────────────────────────────────────────

    private setupButtons(): void {
        this.attackBtn?.on(Node.EventType.TOUCH_END, () => {
            this.app?.sendInput({ type: 'NormalAttack', tick: this.app.getCurrentTick() });
        });

        if (this.skill1Btn) {
            this.skill1Btn.slot = 1;
            this.skill1Btn.onPressed = () => {
                this.app?.sendInput({ type: 'Skill1', tick: this.app.getCurrentTick() });
            };
        }
        if (this.skill2Btn) {
            this.skill2Btn.slot = 2;
            this.skill2Btn.onPressed = () => {
                this.app?.sendInput({ type: 'Skill2', tick: this.app.getCurrentTick() });
            };
        }
        if (this.skill3Btn) {
            this.skill3Btn.slot = 3;
            this.skill3Btn.onPressed = () => {
                this.app?.sendInput({ type: 'Skill3', tick: this.app.getCurrentTick() });
            };
        }
    }

    // ─── CD 显示 ──────────────────────────────────────────────

    private updateCooldownDisplay(): void {
        if (!this.app) return;
        const player = this.app.core.world.entityManager.getPlayer();
        if (!player) return;

        const skillIds = ['ga_skill1_dash_slash', 'ga_skill2_slow_field', 'ga_skill3_burst'];
        const btns = [this.skill1Btn, this.skill2Btn, this.skill3Btn];

        for (let i = 0; i < 3; i++) {
            const btn = btns[i];
            const spec = player.asc.getAbilitySpec(skillIds[i]);
            if (btn && spec) {
                const gaSpec = gasRegistry.getAbilitySpec(skillIds[i]);
                btn.updateCooldown(spec.remainingCooldownTicks, gaSpec.cooldownTicks);
            }
        }
    }

    // ─── 暂停 ─────────────────────────────────────────────────

    onPauseBtn(): void {
        this.app?.pause();
        if (this.pausePanel) this.pausePanel.active = true;
    }

    onResumeBtn(): void {
        this.app?.resume();
        if (this.pausePanel) this.pausePanel.active = false;
    }
}
