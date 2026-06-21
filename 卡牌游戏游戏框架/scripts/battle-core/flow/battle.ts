/*
 * @Desc: 战斗流程编排（BattleFlow）。只负责生命周期与分步推进，具体逻辑委托子模块：
 *   - PlayerCommandManager：玩家主动技能指令
 *   - RoundResolver：回合内武将出手
 * 支持 headless 一次性跑完（run）与交互式分步推进（begin/step/finish）
 */
import { BattleEventType, BattleResult } from '../config/config-types';
import { BattleContext } from '../core/battle-context';
import { PlayerSkill } from '../command/player-skill';
import { PlayerCommandRecord } from '../command/battle-command';
import { BattleFrame, FrameType } from '../record/battle-record';
import { checkBattleEnd } from './battle-outcome';
import { PlayerCommandManager, PlayerSkillInfo } from './player-command-manager';
import { RoundResolver } from './round-resolver';

export type { PlayerSkillInfo };

const MAX_ROUNDS = 50;

export class Battle {
    private readonly commandManager: PlayerCommandManager;
    private readonly roundResolver: RoundResolver;

    private started = false;
    private finished = false;
    private result = BattleResult.DRAW;

    constructor(
        private readonly ctx: BattleContext,
        playerSkills: PlayerSkill[],
        private readonly playerEnergyPerRound: number,
    ) {
        this.commandManager = new PlayerCommandManager(playerSkills);
        this.roundResolver = new RoundResolver();
    }

    get commandLog(): PlayerCommandRecord[] {
        return this.commandManager.commandLog;
    }

    get frames(): BattleFrame[] {
        return this.ctx.recorder.frames;
    }

    get round(): number {
        return this.ctx.round;
    }

    get isEnded(): boolean {
        return this.finished;
    }

    get isOver(): boolean {
        return checkBattleEnd(this.ctx) !== null;
    }

    get battleResult(): BattleResult {
        return this.result;
    }

    get playerEnergy(): number {
        return this.ctx.playerEnergy;
    }

    get playerMaxEnergy(): number {
        return this.ctx.playerMaxEnergy;
    }

    getPlayerSkills(): PlayerSkillInfo[] {
        return this.commandManager.getPlayerSkills();
    }

    isPending(skillId: string): boolean {
        return this.commandManager.isPending(skillId);
    }

    canEnqueue(skillId: string): boolean {
        return this.commandManager.canEnqueue(this.ctx, skillId);
    }

    enqueuePlayerSkill(skillId: string, targetId?: number): boolean {
        if (!this.canEnqueue(skillId)) {
            return false;
        }
        return this.commandManager.enqueue(skillId, targetId);
    }

    // ---------------- headless：一次性跑完 ----------------

    run(replayCommands: PlayerCommandRecord[] = []): BattleResult {
        this.begin();
        while (!this.finished && this.ctx.round < MAX_ROUNDS) {
            this.commandManager.injectForRound(this.ctx.round + 1, replayCommands);
            this.stepBeginRound();
            if (this.isOver) {
                break;
            }
            this.stepResolveRound();
            if (this.isOver) {
                break;
            }
        }
        this.finish();
        return this.result;
    }

    // ---------------- 交互式：分步推进 ----------------

    begin(): BattleFrame[] {
        if (this.started) {
            return [];
        }
        this.started = true;
        return this.capture(() => {
            this.ctx.recorder.add({
                type: FrameType.BATTLE_START,
                snapshot: {
                    seed: this.ctx.seed,
                    heroes: this.ctx.allHeroes.map((h) => h.toSnapshot()),
                    playerMaxEnergy: this.ctx.playerMaxEnergy,
                    playerEnergy: this.ctx.playerEnergy,
                },
            });
            this.ctx.events.emit({ type: BattleEventType.BATTLE_START });
        });
    }

    stepBeginRound(): BattleFrame[] {
        return this.capture(() => {
            this.ctx.round += 1;
            this.ctx.recorder.add({ type: FrameType.ROUND_START, round: this.ctx.round });
            this.ctx.events.emit({ type: BattleEventType.ROUND_START });
            this.ctx.playerEnergy = Math.min(
                this.ctx.playerMaxEnergy,
                this.ctx.playerEnergy + this.playerEnergyPerRound,
            );
            this.commandManager.commit(this.ctx);
        });
    }

    stepResolveRound(): { frames: BattleFrame[]; ended: boolean } {
        const frames = this.capture(() => {
            this.roundResolver.resolveRound(this.ctx);
        });
        return { frames, ended: this.isOver };
    }

    finish(): BattleFrame[] {
        if (this.finished) {
            return [];
        }
        this.finished = true;
        this.result = checkBattleEnd(this.ctx) ?? BattleResult.DRAW;
        return this.capture(() => {
            this.ctx.recorder.add({
                type: FrameType.BATTLE_END,
                round: this.ctx.round,
                result: this.result,
            });
            this.ctx.events.emit({ type: BattleEventType.BATTLE_END });
        });
    }

    private capture(action: () => void): BattleFrame[] {
        const from = this.frames.length;
        action();
        return this.frames.slice(from);
    }
}
