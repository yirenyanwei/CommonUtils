import { BattleConfig, BattleResult } from "../data/battle_config";
import { BattleEventBus } from "../event/battle_event_bus";
import { BattleEventType } from "../event/battle_event";
import { ProjectileManager } from "../manager/projectile_manager";
import { UnitManager } from "../manager/unit_manager";
import { SeededRandom } from "../random/seeded_random";
import { DamageResolver } from "../resolver/damage_resolver";
import { TargetSelector } from "../resolver/target_selector";

/** 战斗世界上下文，负责聚合战斗配置、服务和各类对象管理器。 */
export class BattleWorld {
    readonly config: BattleConfig;
    /** 本场战斗统一随机源。所有会影响战斗结果的随机逻辑都应该从这里取数。 */
    readonly random: SeededRandom;
    readonly eventBus: BattleEventBus = new BattleEventBus();
    readonly targetSelector: TargetSelector = new TargetSelector();
    readonly damageResolver: DamageResolver = new DamageResolver();
    readonly unitManager: UnitManager;
    readonly projectileManager: ProjectileManager;
    tick: number = 0;
    result: BattleResult = {
        isFinished: false,
        isWin: false,
        reason: "",
        tick: 0,
    };

    constructor(config: BattleConfig, seed: number) {
        this.config = config;
        this.random = new SeededRandom(seed);
        this.unitManager = new UnitManager(config, this.eventBus, () => this.tick);
        this.projectileManager = new ProjectileManager(
            this.eventBus,
            this.unitManager,
            this.damageResolver,
            () => this.tick
        );
    }

    finish(isWin: boolean, reason: string): void {
        if (this.result.isFinished) {
            return;
        }

        this.result = {
            isFinished: true,
            isWin,
            reason,
            tick: this.tick,
        };

        this.eventBus.emit({
            type: BattleEventType.BATTLE_FINISHED,
            tick: this.tick,
            isWin,
            reason,
        });
    }
}
