import { BattleEventType } from "../event/battle_event";
import { BattleWorld } from "../core/battle_world";
import { RoundController } from "./round_controller";
import { SpawnPlan } from "./spawn_plan";
/**
 * 波次调度器
 */
export class WaveScheduler {
    private readonly roundController: RoundController = new RoundController();
    private spawnPlans: SpawnPlan[] = [];
    private waveStartTick: number = 0;
    private isWaveActive: boolean = false;
    private isComplete: boolean = false;

    update(world: BattleWorld): void {
        if (this.isComplete || world.result.isFinished) {
            return;
        }

        if (!this.isWaveActive) {
            this.startCurrentWave(world);
        }

        this.spawnEnemies(world);

        if (this.isCurrentWaveFinished(world)) {
            this.finishCurrentWave(world);
        }
    }

    getIsComplete(): boolean {
        return this.isComplete;
    }

    private startCurrentWave(world: BattleWorld): void {
        // Round/Wave 只负责调度刷怪节奏，真正创建单位仍交给 BattleWorld。
        const round = world.config.rounds[this.roundController.roundIndex];
        if (!round) {
            this.isComplete = true;
            return;
        }

        const wave = round.waves[this.roundController.waveIndex];
        if (!wave) {
            this.roundController.moveNextRound();
            this.startCurrentWave(world);
            return;
        }

        this.waveStartTick = world.tick;
        this.spawnPlans = wave.spawns.map((spawnConfig) => ({
            spawnConfig,
            spawnedCount: 0,
        }));
        this.isWaveActive = true;

        if (this.roundController.waveIndex === 0) {
            world.eventBus.emit({
                type: BattleEventType.ROUND_STARTED,
                tick: world.tick,
                roundIndex: this.roundController.roundIndex,
                roundId: round.roundId,
            });
        }

        world.eventBus.emit({
            type: BattleEventType.WAVE_STARTED,
            tick: world.tick,
            roundIndex: this.roundController.roundIndex,
            waveIndex: this.roundController.waveIndex,
            waveId: wave.waveId,
        });
    }

    private spawnEnemies(world: BattleWorld): void {
        const elapsedTicks = world.tick - this.waveStartTick;

        for (const plan of this.spawnPlans) {
            const config = plan.spawnConfig;

            // while 可以补齐低帧率下同一逻辑帧内应该刷出的多个敌人。
            while (
                plan.spawnedCount < config.count &&
                elapsedTicks >= config.startTick + plan.spawnedCount * config.intervalTicks
            ) {
                world.unitManager.spawnUnit(config.unitConfigId, config.position);
                plan.spawnedCount += 1;
            }
        }
    }

    private isCurrentWaveFinished(world: BattleWorld): boolean {
        const isAllSpawned = this.spawnPlans.every((plan) => plan.spawnedCount >= plan.spawnConfig.count);
        return isAllSpawned && world.unitManager.getEnemyCount() === 0;
    }

    private finishCurrentWave(world: BattleWorld): void {
        const round = world.config.rounds[this.roundController.roundIndex];
        const wave = round.waves[this.roundController.waveIndex];

        world.eventBus.emit({
            type: BattleEventType.WAVE_FINISHED,
            tick: world.tick,
            roundIndex: this.roundController.roundIndex,
            waveIndex: this.roundController.waveIndex,
            waveId: wave.waveId,
        });

        this.roundController.moveNextWave();
        this.isWaveActive = false;

        if (this.roundController.waveIndex >= round.waves.length) {
            world.eventBus.emit({
                type: BattleEventType.ROUND_FINISHED,
                tick: world.tick,
                roundIndex: this.roundController.roundIndex,
                roundId: round.roundId,
            });
            this.roundController.moveNextRound();
        }

        if (this.roundController.roundIndex >= world.config.rounds.length) {
            this.isComplete = true;
        }
    }
}
