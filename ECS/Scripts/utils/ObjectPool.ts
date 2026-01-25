/**
 * 对象池
 * 用于减少频繁创建/销毁对象带来的性能开销
 */

/**
 * 对象池
 */
export class ObjectPool<T> {
    private pool: T[] = [];
    private createFn: () => T;
    private resetFn?: (obj: T) => void;
    private maxSize: number;
    
    /**
     * 创建对象池
     * @param createFn 创建对象的函数
     * @param resetFn 重置对象的函数（可选）
     * @param initialSize 初始大小
     * @param maxSize 最大大小（0表示无限制）
     */
    constructor(
        createFn: () => T,
        resetFn?: (obj: T) => void,
        initialSize: number = 10,
        maxSize: number = 0
    ) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
        
        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }
    
    /**
     * 获取对象
     */
    public acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.createFn();
    }
    
    /**
     * 释放对象
     */
    public release(obj: T): void {
        if (this.resetFn) {
            this.resetFn(obj);
        }
        
        if (this.maxSize === 0 || this.pool.length < this.maxSize) {
            this.pool.push(obj);
        }
    }
    
    /**
     * 清空对象池
     */
    public clear(): void {
        this.pool.length = 0;
    }
    
    /**
     * 获取当前池大小
     */
    public getSize(): number {
        return this.pool.length;
    }
}

