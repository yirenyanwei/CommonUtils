import { InputCommand } from './input-command';

// ============================================================
// 输入指令队列
// 支持预输入：跳跃/普攻/技能可缓冲若干 tick，
// 在目标 tick 的 step 开始时出队给 InputSystem。
// ============================================================

const BUFFER_TICKS = 5;  // 预输入缓冲窗口

export class InputCommandQueue {
    /** key = 目标 tick（entry.tick + 可能的延迟偏移） */
    private readonly queue = new Map<number, InputCommand[]>();

    enqueue(cmd: InputCommand): void {
        const key = cmd.tick;
        if (!this.queue.has(key)) {
            this.queue.set(key, []);
        }
        this.queue.get(key)!.push(cmd);
    }

    /**
     * 取出 currentTick 及其之前所有未消费的指令（追帧处理），
     * 并从队列中移除。
     */
    dequeueForTick(currentTick: number): InputCommand[] {
        const result: InputCommand[] = [];
        for (const [tick, cmds] of this.queue) {
            if (tick <= currentTick) {
                result.push(...cmds);
                this.queue.delete(tick);
            }
        }
        return result;
    }

    clear(): void {
        this.queue.clear();
    }
}
