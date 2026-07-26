import { BattleWorld } from './battle-world';
import { InputCommand } from '../command/input-command';

// ============================================================
// BattleSystem 接口 — 每个 System 只负责一个战斗阶段
// ============================================================

export interface BattleSystemContext {
    /** 本 tick 所有输入指令 */
    readonly commands: readonly InputCommand[];
    /** InputSystem 解析后的移动意图 */
    moveX: number;
    moveY: number;
    /** 本 tick 是否请求跳跃 */
    jumpRequested: boolean;
    /** 本 tick 是否请求普攻 */
    attackRequested: boolean;
    /** 本 tick 请求的技能槽（0=无，1/2/3） */
    skillSlot: 0 | 1 | 2 | 3;
    /** 本 tick 碰撞检测产出的命中记录（供 HitReactionSystem 读取） */
    hitResults: HitResult[];
}

export interface HitResult {
    attackerId: string;
    targetId: string;
    hitboxId: string;
    knockbackX: number;
    knockbackY: number;
    onHitGeIds: string[];
}

export interface BattleSystem {
    readonly name: string;
    update(world: BattleWorld, context: BattleSystemContext): void;
}

// ============================================================
// BattleDirector — 按固定顺序调度 System 管线
// System 间禁止直接调用，通过 world / context 通信
// ============================================================

export class BattleDirector {
    private readonly systems: BattleSystem[];

    constructor(systems: BattleSystem[]) {
        this.systems = systems;
    }

    update(world: BattleWorld, commands: readonly InputCommand[]): void {
        if (world.result.isFinished) return;

        const context: BattleSystemContext = {
            commands,
            moveX: 0,
            moveY: 0,
            jumpRequested: false,
            attackRequested: false,
            skillSlot: 0,
            hitResults: [],
        };

        for (const system of this.systems) {
            system.update(world, context);
            if (world.result.isFinished) break;
        }
    }
}
