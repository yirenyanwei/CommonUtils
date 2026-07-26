import { GameConfig, StageConfig } from '../../data/config-types';
import { BattleEventBus } from '../event/battle-event-bus';
import { BattleEventType } from '../event/battle-event';
import { SeededRandom } from './seeded-random';

// ── 由 manager 层延迟填入（避免循环依赖先声明类型）──
import type { EntityManager } from '../manager/entity-manager';
import type { HitboxManager } from '../manager/hitbox-manager';
import type { DamageResolver } from '../resolver/damage-resolver';

// ============================================================
// BattleWorld — 战斗世界上下文中心
// 聚合配置、随机源、事件总线、各管理器与结算器
// System 通过 world 读写战斗状态，不直接互相持有引用
// ============================================================

export interface BattleResult {
    isFinished: boolean;
    result: 'win' | 'lose' | null;
    tick: number;
}

export class BattleWorld {
    readonly gameConfig: GameConfig;
    readonly stageConfig: StageConfig;
    readonly random: SeededRandom;
    readonly eventBus: BattleEventBus;

    tick: number = 0;
    result: BattleResult = { isFinished: false, result: null, tick: 0 };

    // 由 BattleFactory 在装配阶段注入
    entityManager!: EntityManager;
    hitboxManager!: HitboxManager;
    damageResolver!: DamageResolver;

    constructor(gameConfig: GameConfig, stageConfig: StageConfig, seed: number) {
        this.gameConfig = gameConfig;
        this.stageConfig = stageConfig;
        this.random = new SeededRandom(seed);
        this.eventBus = new BattleEventBus();
    }

    finish(result: 'win' | 'lose'): void {
        if (this.result.isFinished) return;
        this.result = { isFinished: true, result, tick: this.tick };
        this.eventBus.emit({
            type: BattleEventType.BATTLE_END,
            tick: this.tick,
            result,
        });
    }
}
