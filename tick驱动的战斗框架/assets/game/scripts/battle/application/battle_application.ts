import { BattleCommandType } from "../command/battle_command";
import { BattleCore } from "../core/battle_core";
import { BattleRunner } from "../core/battle_runner";
import { BattleConfig, BattleResult, BattleStartParams, BattleVector } from "../data/battle_config";
import { BattleEvent } from "../event/battle_event";

export class BattleApplication {
    private battleCore?: BattleCore;
    private battleRunner?: BattleRunner;
    private commandSequence: number = 1;

    // 用例层入口：外部只需要传入配置和开局参数，不需要关心 BattleCore 的内部组合。
    startBattle(config: BattleConfig, startParams: BattleStartParams): void {
        this.battleCore = new BattleCore(config, startParams);
        this.battleRunner = new BattleRunner(this.battleCore);
        this.commandSequence = 1;
    }

    update(deltaTime: number): BattleEvent[] {
        if (!this.battleRunner) {
            return [];
        }

        return this.battleRunner.update(deltaTime);
    }

    // 玩家操作先转成命令进入队列，避免 UI 或场景层直接修改战斗世界。
    placeTower(towerConfigId: string, position: BattleVector, tick: number = this.getNextCommandTick()): void {
        const battleCore = this.requireBattleCore();
        battleCore.enqueueCommand({
            type: BattleCommandType.PLACE_TOWER,
            tick,
            sequence: this.getNextSequence(),
            towerConfigId,
            position,
        });
    }

    castAbility(
        casterUnitId: number,
        abilityId: string,
        tick: number = this.getNextCommandTick(),
        targetUnitId?: number,
        targetPosition?: BattleVector
    ): void {
        const battleCore = this.requireBattleCore();
        // 技能释放也走命令流，后续保存命令日志或做 Replay 时可以复用。
        battleCore.enqueueCommand({
            type: BattleCommandType.CAST_ABILITY,
            tick,
            sequence: this.getNextSequence(),
            casterUnitId,
            abilityId,
            targetUnitId,
            targetPosition,
        });
    }

    getResult(): BattleResult | undefined {
        return this.battleCore?.world.result;
    }

    getCurrentTick(): number {
        return this.battleCore?.world.tick ?? 0;
    }

    private getNextCommandTick(): number {
        return this.getCurrentTick() + 1;
    }

    private getNextSequence(): number {
        const sequence = this.commandSequence;
        this.commandSequence += 1;
        return sequence;
    }

    private requireBattleCore(): BattleCore {
        if (!this.battleCore) {
            throw new Error("BattleApplication has not started a battle.");
        }

        return this.battleCore;
    }
}
