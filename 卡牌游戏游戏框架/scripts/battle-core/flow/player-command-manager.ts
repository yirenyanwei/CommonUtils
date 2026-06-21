/*
 * @Desc: 玩家主动技能指令队列。负责排队、结算、指令日志（录像/校验输入）
 */
import { BattleContext } from '../core/battle-context';
import { PlayerSkill } from '../command/player-skill';
import { PendingCommand, PlayerCommandRecord } from '../command/battle-command';

/** 主动技能的可释放信息（供 UI 渲染按钮） */
export interface PlayerSkillInfo {
    skillId: string;
    name: string;
    cost: number;
    targetType: string;
}

export class PlayerCommandManager {
    /** 已结算的玩家指令日志（录像/校验输入） */
    readonly commandLog: PlayerCommandRecord[] = [];

    private pending: PendingCommand[] = [];

    constructor(private readonly playerSkills: PlayerSkill[]) {}

    getPlayerSkills(): PlayerSkillInfo[] {
        return this.playerSkills.map((ps) => ({
            skillId: ps.skill.id,
            name: ps.skill.name,
            cost: ps.cost,
            targetType: ps.targetType,
        }));
    }

    isPending(skillId: string): boolean {
        return this.pending.some((c) => c.skillId === skillId);
    }

    /** 当前是否可以排入该主动技能（能量足够且未在队列中） */
    canEnqueue(ctx: BattleContext, skillId: string): boolean {
        const ps = this.findPlayerSkill(skillId);
        if (!ps || this.isPending(skillId)) {
            return false;
        }
        return ctx.playerEnergy >= ps.cost;
    }

    /** 玩家点击释放：把指令排入队列，将在下一个回合开始时结算 */
    enqueue(skillId: string, targetId?: number): boolean {
        if (this.isPending(skillId)) {
            return false;
        }
        this.pending.push({ skillId, targetId });
        return true;
    }

    /** headless 回放：在指定回合开始前注入待结算指令 */
    injectForRound(round: number, commands: PlayerCommandRecord[]): void {
        for (const cmd of commands) {
            if (cmd.round === round) {
                this.pending.push({ skillId: cmd.skillId, targetId: cmd.targetId });
            }
        }
    }

    /** 回合开始时结算排队指令：能量足够才释放并扣能、写入指令日志 */
    commit(ctx: BattleContext): void {
        for (const cmd of this.pending) {
            const ps = this.findPlayerSkill(cmd.skillId);
            if (!ps || ctx.playerEnergy < ps.cost) {
                continue;
            }
            ctx.playerEnergy -= ps.cost;
            ps.cast(ctx, cmd.targetId);
            this.commandLog.push({ round: ctx.round, skillId: cmd.skillId, targetId: cmd.targetId });
        }
        this.pending = [];
    }

    private findPlayerSkill(skillId: string): PlayerSkill | undefined {
        return this.playerSkills.find((ps) => ps.skill.id === skillId);
    }
}
