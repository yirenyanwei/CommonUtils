/**
 * 黑板报
 * 充当了内存组件的作用
 */
export class Blockboard {
    /**
     * 共享数据，一般是父节点的数据
     */
    private shared: Blockboard;
    private data: Map<string, any> = new Map();
    public GetData<T>(key: string): T {
        if (this.data.has(key)) {
            return this.data.get(key);
        }
        return this.shared?.GetData<T>(key);
    }
    public SetData(key: string, value: any): void {
        this.data.set(key, value);
    }
    public RemoveData(key: string): void {
        this.data.delete(key);
    }
}