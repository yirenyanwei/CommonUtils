import { GameplayCue, Vec2 } from '../../data/config-types';

// ============================================================
// 战斗事件类型枚举 + payload 定义
// 逻辑层产出事实事件，View 层只读消费
// ============================================================

export const enum BattleEventType {
    /** 战斗开始：View 根据初始快照创建角色、房间、UI */
    BATTLE_START        = 'BATTLE_START',
    /** 战斗结束：View 显示胜利/失败结果 */
    BATTLE_END          = 'BATTLE_END',
    /** 实体位置/面向变化：View 更新角色节点位置和朝向 */
    ENTITY_MOVE         = 'ENTITY_MOVE',
    /** 实体死亡：View 播放死亡表现或隐藏角色 */
    ENTITY_DEATH        = 'ENTITY_DEATH',
    /** 技能激活：View 播放对应动画 */
    ABILITY_ACTIVATE    = 'ABILITY_ACTIVATE',
    /** 技能结束：View 可恢复默认动画或清理表现状态 */
    ABILITY_END         = 'ABILITY_END',
    /** 造成伤害：View 更新血条并生成伤害数字 */
    DAMAGE              = 'DAMAGE',
    /** 受到治疗：View 更新血条并播放治疗表现 */
    HEAL                = 'HEAL',
    /** 属性变化：View 更新血量、蓝量等 UI */
    ATTRIBUTE_CHANGE    = 'ATTRIBUTE_CHANGE',
    /** GE 生效：View 显示 Buff/Debuff 图标 */
    GE_APPLIED          = 'GE_APPLIED',
    /** GE 移除：View 移除 Buff/Debuff 图标 */
    GE_REMOVED          = 'GE_REMOVED',
    /** GameplayTag 变化：View 可用于调试或状态表现 */
    TAG_CHANGED         = 'TAG_CHANGED',
    /** 连击数变化：View 更新连击 UI */
    COMBO_CHANGED       = 'COMBO_CHANGED',
    /** GameplayCue：View 播放特效、音效、震屏等表现 */
    GAMEPLAY_CUE        = 'GAMEPLAY_CUE',
    /** Hitbox 调试：View 绘制攻击判定框 */
    HITBOX_DEBUG        = 'HITBOX_DEBUG',
}

export interface EntitySnapshot {
    entityId: string;
    configId: string;
    team: 'player' | 'enemy';
    position: Vec2;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
}

export interface RoomSnapshot {
    bounds: { x: number; y: number; width: number; height: number };
    groundY: number;
}

// ── 事件 payload ──────────────────────────────────────────

export interface BattleStartPayload {
    type: BattleEventType.BATTLE_START;
    tick: number;
    entities: EntitySnapshot[];
    room: RoomSnapshot;
}

export interface BattleEndPayload {
    type: BattleEventType.BATTLE_END;
    tick: number;
    result: 'win' | 'lose';
}

export interface EntityMovePayload {
    type: BattleEventType.ENTITY_MOVE;
    tick: number;
    entityId: string;
    x: number;
    y: number;
    /** 1 = 右，-1 = 左 */
    facing: 1 | -1;
    isGrounded: boolean;
}

export interface EntityDeathPayload {
    type: BattleEventType.ENTITY_DEATH;
    tick: number;
    entityId: string;
}

export interface AbilityActivatePayload {
    type: BattleEventType.ABILITY_ACTIVATE;
    tick: number;
    entityId: string;
    abilityId: string;
    animName: string;
}

export interface AbilityEndPayload {
    type: BattleEventType.ABILITY_END;
    tick: number;
    entityId: string;
    abilityId: string;
}

export interface DamagePayload {
    type: BattleEventType.DAMAGE;
    tick: number;
    attackerId: string;
    targetId: string;
    damage: number;
    isCrit: boolean;
    hpAfter: number;
}

export interface HealPayload {
    type: BattleEventType.HEAL;
    tick: number;
    entityId: string;
    amount: number;
    hpAfter: number;
}

export interface AttributeChangePayload {
    type: BattleEventType.ATTRIBUTE_CHANGE;
    tick: number;
    entityId: string;
    attribute: string;
    value: number;
    maxValue?: number;
}

export interface GEAppliedPayload {
    type: BattleEventType.GE_APPLIED;
    tick: number;
    entityId: string;
    geId: string;
    iconKey?: string;
    remainingTicks?: number;
}

export interface GERemovedPayload {
    type: BattleEventType.GE_REMOVED;
    tick: number;
    entityId: string;
    geId: string;
}

export interface TagChangedPayload {
    type: BattleEventType.TAG_CHANGED;
    tick: number;
    entityId: string;
    tag: string;
    added: boolean;
}

export interface ComboChangedPayload {
    type: BattleEventType.COMBO_CHANGED;
    tick: number;
    entityId: string;
    count: number;
}

export interface GameplayCuePayload {
    type: BattleEventType.GAMEPLAY_CUE;
    tick: number;
    entityId: string;
    cueTag: GameplayCue;
    position: Vec2;
}

export interface HitboxDebugPayload {
    type: BattleEventType.HITBOX_DEBUG;
    tick: number;
    entityId: string;
    rects: Array<{ x: number; y: number; w: number; h: number; color: string }>;
}

export type BattleEvent =
    | BattleStartPayload
    | BattleEndPayload
    | EntityMovePayload
    | EntityDeathPayload
    | AbilityActivatePayload
    | AbilityEndPayload
    | DamagePayload
    | HealPayload
    | AttributeChangePayload
    | GEAppliedPayload
    | GERemovedPayload
    | TagChangedPayload
    | ComboChangedPayload
    | GameplayCuePayload
    | HitboxDebugPayload;
