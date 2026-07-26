// ============================================================
// 确定性随机（mulberry32 算法）
// 战斗中所有随机必须走此类，保证同 seed 同结果可回放
// ============================================================

export class SeededRandom {
    private state: number;

    constructor(seed: number) {
        this.state = seed >>> 0;
    }

    /** 返回 [0, 1) 的浮点数 */
    next(): number {
        let t = (this.state += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    }

    /** 返回 [min, max) 的整数 */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min)) + min;
    }

    /** 按概率 p 返回 true */
    chance(p: number): boolean {
        return this.next() < p;
    }
}
