/**
 * 确定性随机数生成器
 * 使用线性同余生成器（LCG）算法，保证所有客户端生成相同的随机数序列
 */
export class DeterministicRandom {
    private seed: number;
    private currentValue: number;

    /**
     * 构造函数
     * @param seed 随机数种子，所有客户端必须使用相同的种子
     */
    constructor(seed: number = 12345) {
        this.seed = seed;
        this.currentValue = seed;
    }

    /**
     * 设置随机数种子
     * @param seed 新的种子值
     */
    public setSeed(seed: number): void {
        this.seed = seed;
        this.currentValue = seed;
    }

    /**
     * 重置随机数生成器到初始状态
     */
    public reset(): void {
        this.currentValue = this.seed;
    }

    /**
     * 生成下一个随机数（0-1之间的浮点数）
     * LCG算法: (a * x + c) mod m
     */
    public next(): number {
        // 使用标准的LCG参数
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);
        
        this.currentValue = (a * this.currentValue + c) % m;
        return this.currentValue / m;
    }

    /**
     * 生成指定范围内的随机整数 [min, max]
     */
    public nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * 生成指定范围内的随机浮点数 [min, max)
     */
    public nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    /**
     * 随机选择数组中的一个元素
     */
    public choice<T>(array: T[]): T {
        if (array.length === 0) {
            throw new Error('Array is empty');
        }
        return array[this.nextInt(0, array.length - 1)];
    }

    /**
     * 随机打乱数组（Fisher-Yates洗牌算法）
     */
    public shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * 获取当前随机数状态（用于调试）
     */
    public getState(): number {
        return this.currentValue;
    }
}

