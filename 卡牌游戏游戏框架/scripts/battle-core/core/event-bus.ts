/*
 * @Desc: 战斗事件总线。Buff/被动通过订阅事件实现"触发器"机制，实现技能与流程解耦
 */
import { BattleEventType } from '../config/config-types';
import type { Hero } from '../entity/hero';

/** 战斗事件载荷 */
export interface BattleEvent {
    type: BattleEventType;
    /** 事件来源（施法者/行动者） */
    source?: Hero;
    /** 事件目标 */
    target?: Hero;
    /** 数值（伤害量/治疗量等） */
    value?: number;
    /** 附加数据 */
    data?: Record<string, unknown>;
}

export type BattleEventListener = (event: BattleEvent) => void;

export class BattleEventBus {
    private listeners = new Map<BattleEventType, BattleEventListener[]>();

    on(type: BattleEventType, listener: BattleEventListener): () => void {
        let list = this.listeners.get(type);
        if (!list) {
            list = [];
            this.listeners.set(type, list);
        }
        list.push(listener);
        return () => this.off(type, listener);
    }

    off(type: BattleEventType, listener: BattleEventListener): void {
        const list = this.listeners.get(type);
        if (!list) {
            return;
        }
        const index = list.indexOf(listener);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }

    emit(event: BattleEvent): void {
        const list = this.listeners.get(event.type);
        if (!list) {
            return;
        }
        for (const listener of list.slice()) {
            listener(event);
        }
    }

    clear(): void {
        this.listeners.clear();
    }
}
