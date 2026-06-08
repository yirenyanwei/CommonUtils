import { Node } from "cc";
import { BattleEvent, BattleEventType } from "../event/battle_event";
import { UnitView } from "./unit_view";

export class BattleViewAdapter {
    private readonly unitViews = new Map<number, UnitView>();
    private readonly projectileViews = new Map<number, UnitView>();

    constructor(private readonly root: Node) {}

    applyEvents(events: readonly BattleEvent[]): void {
        for (const event of events) {
            // Adapter 只把逻辑事件翻译成 Cocos 节点操作，不参与任何战斗计算。
            switch (event.type) {
                case BattleEventType.UNIT_SPAWNED:
                    this.unitViews.set(
                        event.unitId,
                        new UnitView(`unit_${event.unitId}_${event.configId}`, this.root, event.position)
                    );
                    break;
                case BattleEventType.UNIT_MOVED:
                    this.unitViews.get(event.unitId)?.setPosition(event.position);
                    break;
                case BattleEventType.UNIT_DIED:
                    this.unitViews.get(event.unitId)?.destroy();
                    this.unitViews.delete(event.unitId);
                    break;
                case BattleEventType.PROJECTILE_SPAWNED:
                    this.projectileViews.set(
                        event.projectileId,
                        new UnitView(`projectile_${event.projectileId}`, this.root, event.position)
                    );
                    break;
                case BattleEventType.PROJECTILE_MOVED:
                    this.projectileViews.get(event.projectileId)?.setPosition(event.position);
                    break;
                case BattleEventType.PROJECTILE_HIT:
                    this.projectileViews.get(event.projectileId)?.destroy();
                    this.projectileViews.delete(event.projectileId);
                    break;
                case BattleEventType.BATTLE_FINISHED:
                    console.log(`Battle finished: ${event.reason}, win=${event.isWin}`);
                    break;
                default:
                    break;
            }
        }
    }
}
