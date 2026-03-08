/**
 * 黑板系统 - 用于在行为树节点之间共享数据
 */
export class Blackboard {
    private data: Map<string, any> = new Map();

    /**
     * 设置数据
     */
    public set<T>(key: string, value: T): void {
        this.data.set(key, value);
    }

    /**
     * 获取数据
     */
    public get<T>(key: string, defaultValue?: T): T {
        if (this.data.has(key)) {
            return this.data.get(key) as T;
        }
        return defaultValue as T;
    }

    /**
     * 检查是否存在某个键
     */
    public has(key: string): boolean {
        return this.data.has(key);
    }

    /**
     * 删除数据
     */
    public delete(key: string): boolean {
        return this.data.delete(key);
    }

    /**
     * 清空所有数据
     */
    public clear(): void {
        this.data.clear();
    }

    /**
     * 获取所有键
     */
    public keys(): string[] {
        return Array.from(this.data.keys());
    }
}
