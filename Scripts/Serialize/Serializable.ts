/**
 * 对象序列化反序列化
 */

import { ISerializable, SerializedMetaData, SerializedOptions } from "./type-serializable";
import 'reflect-metadata';

// 存储序列化元数据的键
const SERIALIZABLE_METADATA_KEY = 'serializable_fields';

/**
 * 标记类可序列化
 */
export function Serializable() {
    return function (target: Function) {
        if (!target.prototype.initialize) {
            target.prototype.initialize = function () {
            }
        }
        if (!target.prototype.serialize) {
            target.prototype.serialize = function () {
                return serializeObject(this);
            }
        }
        if (!target.prototype.deserialize) {
            target.prototype.deserialize = function (data: any) {
                deserializeObject(this, data);
            }
        }
    }
}

/**
 * 标记属性需要被序列化
 */
export function SerializedFiled(options: SerializedOptions = {}) {
    return function (target: any, propertyKey: string) {
        // 元数据
        const fileds: SerializedMetaData = Reflect.getMetadata(SERIALIZABLE_METADATA_KEY, target.constructor) || {};
        //存储字段元属性
        fileds[propertyKey] = options;
        Reflect.defineMetadata(SERIALIZABLE_METADATA_KEY, fileds, target.constructor);
    }
}

/**
 * 实例化对象
 * @param obj 
 */
export function serializeObject(obj: any) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // 类的序列化元数据
    const fileds: SerializedMetaData = Reflect.getMetadata(SERIALIZABLE_METADATA_KEY, obj.constructor);
    if (!fileds) {
        return obj;
    }

    const result: Object = {};
    for (const propertyKey in fileds) {
        if (fileds.hasOwnProperty(propertyKey)) {
            const options: SerializedOptions = fileds[propertyKey];
            const value = obj[propertyKey];
            const { type } = options;

            // 判断有序列化函数
            if (options.serialize) {
                result[propertyKey] = options.serialize(value);
                continue;
            }
            if (Array.isArray(type)) {
                // 基础类型
                result[propertyKey] = serializeArrayValue(value, type, 0);
                continue;
            }

            // 其它类型
            result[propertyKey] = serializeValue(value, options.type as Function);
        }
    }
    return result;
}

function serializeArrayValue(values: any, type: Array<Function>, idx: number) {
    if (idx >= type.length) {
        return null;
    }
    const nowType = type[idx];
    switch (nowType) {
        case Array: {
            const array = [];
            idx += 1;
            for (const value of values) {
                array.push(serializeArrayValue(value, type, idx));
            }
            return array;
        } break;
        case Map: {
            const obj = {};
            const keyType = type[idx + 1];
            idx += 2;
            values.forEach((value, key) => {
                obj[key] = serializeArrayValue(value, type, idx);
            });
            return obj;
        } break;
        default: {
            return serializeValue(values, nowType);
        }
    }
}

// 序列化单个值
function serializeValue(value: any, type?: Function): any {
    if (value === null || value === undefined) {
        return value;
    }
    // 如果是日期对象
    if (value instanceof Date) {
        return value.toISOString();
    }
    // 如果是基本类型，直接返回
    if (typeof value !== 'object') {
        return value;
    }
    // 如果指定了类型且有自定义序列化方法
    if (type && value.serialize instanceof Function) {
        return value.serialize();
    }
    // 递归序列化普通对象
    return serializeObject(value);
}
/**
 * 反序列化对象
 * @param obj 
 * @param data 
 */
export function deserializeObject(obj: ISerializable, data: any): any {
    if (!data || typeof data !== 'object') {
        return obj;
    }
    // 类的元数据
    const fileds = Reflect.getMetadata(SERIALIZABLE_METADATA_KEY, obj.constructor);
    if (!fileds) {
        return obj;
    }
    // 遍历序列化字段
    for (const propertyKey in fileds) {
        if (data.hasOwnProperty(propertyKey)) {
            const options: SerializedOptions = fileds[propertyKey];
            const value = data[propertyKey];
            const { type } = options;

            // 如果有自定义反序列化函数，使用它
            if (options.deserialize) {
                obj[propertyKey] = options.deserialize(value);
                continue;
            }
            if (Array.isArray(type)) {
                // 判断是数组
                const result = deserializeArrayValue(value, type, 0);
                obj[propertyKey] = result;
                continue;

            }

            // 处理普通对象
            obj[propertyKey] = deserializeValue(value, options.type as Function);
        }
    }

    // 调用初始化方法（如果有）
    if (obj.initialize instanceof Function) {
        obj.initialize();
    }
    return obj;
}

function deserializeArrayValue(values: any, type: Array<Function>, idx: number) {
    if (idx >= type.length) {
        return null;
    }
    const nowType = type[idx];
    switch (nowType) {
        case Array: {
            const array = new Array();
            idx += 1;
            for (const value of values) {
                array.push(deserializeArrayValue(value, type, idx));
            }
            return array;
        } break;
        case Map: {
            const obj = new Map();
            const keyType = type[idx + 1];
            idx += 2;
            for (const key in values) {
                obj.set(key, deserializeArrayValue(values[key], type, idx));
            }
            return obj;
        } break;
        default: {
            return deserializeValue(values, nowType);
        }
    }
}

// 反序列化单个值
function deserializeValue(value: any, type?: Function): any {
    if (value === null || value === undefined) {
        return value;
    }

    // 如果是基本类型，直接返回
    if (typeof value !== 'object') {
        return value;
    }

    if (type && type.prototype.setTime) {
        return new Date(value);
    }

    const result = new (type as any)()
    deserializeObject(result, value);
    return result;
}