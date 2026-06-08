/** 带种子的伪随机数生成器，用于保证同一场战斗输入可以复现随机结果。 */
export class SeededRandom {
    private state: number;

    constructor(seed: number) {
        // seed 为 0 时会导致 xorshift 停在 0，因此兜底成 1。
        this.state = seed || 1;
    }

    /** 返回 [0, 1) 附近的随机浮点数，战斗逻辑不要直接使用 Math.random()。 */
    next(): number {
        let value = this.state;
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        this.state = value >>> 0;
        return this.state / 0xffffffff;
    }

    /** 返回 [min, max) 范围内的随机浮点数。 */
    range(min: number, max: number): number {
        return min + (max - min) * this.next();
    }
}
