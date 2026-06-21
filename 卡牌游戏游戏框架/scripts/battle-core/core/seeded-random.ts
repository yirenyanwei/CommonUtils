/*
 * @Desc: 确定性随机数（mulberry32）。相同种子产生相同序列，是战斗可重放、可服务器校验的基础
 */

export class SeededRandom {
    private state: number;

    constructor(seed: number) {
        this.state = seed >>> 0;
    }

    /** 返回 [0, 1) 的浮点数 */
    next(): number {
        this.state = (this.state + 0x6d2b79f5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /** 返回 [0, maxExclusive) 的整数 */
    nextInt(maxExclusive: number): number {
        return Math.floor(this.next() * maxExclusive);
    }

    /** 返回 [min, maxInclusive] 的整数 */
    range(min: number, maxInclusive: number): number {
        return min + this.nextInt(maxInclusive - min + 1);
    }

    /** 命中概率判定 */
    chance(probability: number): boolean {
        return this.next() < probability;
    }

    /** 从数组中随机取一个元素 */
    pick<T>(items: T[]): T {
        return items[this.nextInt(items.length)];
    }
}
