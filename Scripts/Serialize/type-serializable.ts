/**
 * 类型定义
 */
export interface ISerializable {
    /**
     * 初始化
     */
    initialize(): void;
    /**
     * 序列化
     */
    serialize(): any;
    /**
     * 反序列化
     */
    deserialize(data: any): void;
}
/**
 * 序列化对象参数
 */
export interface SerializedOptions {
    type?: Function | Array<Function>;
    serialize?: (value: any) => any;
    deserialize?: (value: any) => any;
}
/**
 * 序列化元数据
 */
export interface SerializedMetaData {
    [key: string]: any;
}

export function array_t(t: Function | Array<Function>) {
    if (Array.isArray(t)) {
        const array: Array<Function> = [Array];
        return array.concat(t);
    } else {
        return [Array, t];
    }
}

export function map_t(k: Function, v: Function | Array<Function>) {
    if (Array.isArray(v)) {
        const array: Array<Function> = [Map, k];
        return array.concat(v);
    } else {
        return [Map, k, v]
    }
}