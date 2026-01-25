/**
 * 系统管理器
 * 负责管理所有系统
 */

import { ISystem, IWorld } from './types';

/**
 * 系统管理器
 */
export class SystemManager {
    // 系统映射表：systemType -> system
    private systems: Map<string, ISystem> = new Map();
    
    // 系统执行列表（按优先级排序）
    private systemList: ISystem[] = [];
    
    /**
     * 注册系统
     */
    public registerSystem(system: ISystem): void {
        const systemType = system.type;
        
        // 如果系统已存在，先移除
        if (this.systems.has(systemType)) {
            this.removeSystem(systemType);
        }
        
        // 添加系统
        this.systems.set(systemType, system);
        
        // 插入到正确的位置（按优先级排序）
        this.insertSystem(system);
    }
    
    /**
     * 移除系统
     */
    public removeSystem(systemType: string): void {
        const system = this.systems.get(systemType);
        if (!system) {
            return;
        }
        
        this.systems.delete(systemType);
        
        // 从执行列表中移除
        const index = this.systemList.indexOf(system);
        if (index !== -1) {
            this.systemList.splice(index, 1);
        }
    }
    
    /**
     * 获取系统
     */
    public getSystem<T extends ISystem>(systemType: string): T | null {
        return (this.systems.get(systemType) as T) || null;
    }
    
    /**
     * 获取所有系统
     */
    public getAllSystems(): ISystem[] {
        return Array.from(this.systems.values());
    }
    
    /**
     * 初始化所有系统
     */
    public initSystems(world: IWorld): void {
        for (const system of this.systemList) {
            if (system.onInit) {
                system.onInit(world);
            }
        }
    }
    
    /**
     * 更新所有系统
     */
    public updateSystems(world: IWorld, deltaTime: number): void {
        for (const system of this.systemList) {
            if (system.enabled && system.onUpdate) {
                system.onUpdate(world, deltaTime);
            }
        }
    }
    
    /**
     * 销毁所有系统
     */
    public destroySystems(world: IWorld): void {
        for (const system of this.systemList) {
            if (system.onDestroy) {
                system.onDestroy(world);
            }
        }
    }
    
    /**
     * 清空所有系统
     */
    public clear(): void {
        this.systems.clear();
        this.systemList = [];
    }
    
    /**
     * 插入系统到正确位置（按优先级排序）
     */
    private insertSystem(system: ISystem): void {
        const priority = system.priority;
        
        // 找到插入位置
        let insertIndex = this.systemList.length;
        for (let i = 0; i < this.systemList.length; i++) {
            if (this.systemList[i].priority > priority) {
                insertIndex = i;
                break;
            }
        }
        
        // 插入系统
        this.systemList.splice(insertIndex, 0, system);
    }
    
    /**
     * 获取统计信息
     */
    public getStats(): { systemCount: number; enabledCount: number } {
        let enabledCount = 0;
        for (const system of this.systems.values()) {
            if (system.enabled) {
                enabledCount++;
            }
        }
        
        return {
            systemCount: this.systems.size,
            enabledCount
        };
    }
}

