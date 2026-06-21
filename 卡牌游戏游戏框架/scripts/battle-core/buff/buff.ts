/*
 * @Desc: Buff 运行时实例，携带剩余回合与层数
 */
import { BuffConfig } from '../config/config-types';

export class Buff {
    remainingRounds: number;
    stacks: number;
    /** 护盾剩余可吸收量（仅护盾类 Buff 使用） */
    shieldRemaining: number;

    /** @param sourceId 施加者实例 id */
    constructor(readonly config: BuffConfig, readonly sourceId: number) {
        this.remainingRounds = config.duration;
        this.stacks = 1;
        this.shieldRemaining = config.shield ?? 0;
    }

    get id(): string {
        return this.config.id;
    }

    get name(): string {
        return this.config.name;
    }

    get expired(): boolean {
        return this.remainingRounds <= 0;
    }
}
