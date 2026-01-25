/**
 * ECS世界
 * 管理所有实体、组件和系统
 */

import { EntityId, ComponentType, IComponent, ISystem, IWorld } from './types';
import { ComponentManager } from './ComponentManager';
import { SystemManager } from './SystemManager';
import { EventTarget } from 'cc';

/**
 * ECS世界
 */
export class World implements IWorld {
    // 实体ID生成器
    private nextEntityId: EntityId = 1;
    
    // 已回收的实体ID（用于复用）
    private recycledEntityIds: EntityId[] = [];
    
    // 活跃的实体集合
    private activeEntities: Set<EntityId> = new Set();
    
    // 组件管理器
    private componentManager: ComponentManager = new ComponentManager();
    
    // 系统管理器
    private systemManager: SystemManager = new SystemManager();
    
    // 事件系统
    public readonly onEntityCreated: EventTarget = new EventTarget();
    public readonly onEntityDestroyed: EventTarget = new EventTarget();
    
    // 性能统计
    private stats = {
        totalEntitiesCreated: 0,
        totalEntitiesDestroyed: 0,
        maxEntitiesAlive: 0
    };
    
    /**
     * 创建实体
     */
    public createEntity(): EntityId {
        let entityId: EntityId;
        
        // 优先复用已回收的实体ID
        if (this.recycledEntityIds.length > 0) {
            entityId = this.recycledEntityIds.pop()!;
        } else {
            entityId = this.nextEntityId++;
        }
        
        this.activeEntities.add(entityId);
        this.stats.totalEntitiesCreated++;
        this.stats.maxEntitiesAlive = Math.max(this.stats.maxEntitiesAlive, this.activeEntities.size);
        
        // 触发实体创建事件
        this.onEntityCreated.emit('entity_created', { entityId });
        
        return entityId;
    }
    
    /**
     * 销毁实体
     */
    public destroyEntity(entityId: EntityId): void {
        if (!this.activeEntities.has(entityId)) {
            return;
        }
        
        // 移除实体的所有组件
        this.componentManager.removeAllComponents(entityId);
        
        // 从活跃实体集合中移除
        this.activeEntities.delete(entityId);
        
        // 回收实体ID（限制回收数量，避免内存泄漏）
        if (this.recycledEntityIds.length < 1000) {
            this.recycledEntityIds.push(entityId);
        }
        
        this.stats.totalEntitiesDestroyed++;
        
        // 触发实体销毁事件
        this.onEntityDestroyed.emit('entity_destroyed', { entityId });
    }
    
    /**
     * 检查实体是否存在
     */
    public hasEntity(entityId: EntityId): boolean {
        return this.activeEntities.has(entityId);
    }
    
    /**
     * 添加组件
     */
    public addComponent<T extends IComponent>(entityId: EntityId, component: T): T {
        if (!this.activeEntities.has(entityId)) {
            throw new Error(`Entity ${entityId} does not exist`);
        }
        
        this.componentManager.addComponent(entityId, component);
        return component;
    }
    
    /**
     * 移除组件
     */
    public removeComponent(entityId: EntityId, componentType: ComponentType): void {
        if (!this.activeEntities.has(entityId)) {
            return;
        }
        
        this.componentManager.removeComponent(entityId, componentType);
    }
    
    /**
     * 获取组件
     */
    public getComponent<T extends IComponent>(entityId: EntityId, componentType: ComponentType): T | null {
        if (!this.activeEntities.has(entityId)) {
            return null;
        }
        
        return this.componentManager.getComponent<T>(entityId, componentType);
    }
    
    /**
     * 检查实体是否拥有组件
     */
    public hasComponent(entityId: EntityId, componentType: ComponentType): boolean {
        if (!this.activeEntities.has(entityId)) {
            return false;
        }
        
        return this.componentManager.hasComponent(entityId, componentType);
    }
    
    /**
     * 注册系统
     */
    public registerSystem(system: ISystem): void {
        this.systemManager.registerSystem(system);
        
        // 如果系统有初始化方法，立即调用
        if (system.onInit) {
            system.onInit(this);
        }
    }
    
    /**
     * 移除系统
     */
    public removeSystem(systemType: string): void {
        const system = this.systemManager.getSystem(systemType);
        if (system && system.onDestroy) {
            system.onDestroy(this);
        }
        
        this.systemManager.removeSystem(systemType);
    }
    
    /**
     * 获取系统
     */
    public getSystem<T extends ISystem>(systemType: string): T | null {
        return this.systemManager.getSystem<T>(systemType);
    }
    
    /**
     * 查询拥有指定组件的所有实体
     */
    public queryEntities(...componentTypes: ComponentType[]): EntityId[] {
        return this.componentManager.queryEntities(...componentTypes);
    }
    
    /**
     * 更新世界（执行所有系统）
     */
    public update(deltaTime: number): void {
        // 验证deltaTime
        if (deltaTime <= 0 || !isFinite(deltaTime)) {
            console.warn(`Invalid deltaTime: ${deltaTime}, using 0.016 (60fps) instead`);
            deltaTime = 0.016;
        }
        
        this.systemManager.updateSystems(this, deltaTime);
    }
    
    /**
     * 清空世界
     */
    public clear(): void {
        // 销毁所有实体
        const entities = Array.from(this.activeEntities);
        for (const entityId of entities) {
            this.destroyEntity(entityId);
        }
        
        // 清空组件管理器
        this.componentManager.clear();
        
        // 销毁所有系统
        this.systemManager.destroySystems(this);
        this.systemManager.clear();
        
        // 重置实体ID生成器和回收池
        this.nextEntityId = 1;
        this.recycledEntityIds = [];
        
        // 重置统计
        this.stats = {
            totalEntitiesCreated: 0,
            totalEntitiesDestroyed: 0,
            maxEntitiesAlive: 0
        };
    }
    
    /**
     * 获取统计信息
     */
    public getStats(): {
        entityCount: number;
        componentStats: ReturnType<ComponentManager['getStats']>;
        systemStats: ReturnType<SystemManager['getStats']>;
        performance: typeof this.stats;
    } {
        return {
            entityCount: this.activeEntities.size,
            componentStats: this.componentManager.getStats(),
            systemStats: this.systemManager.getStats(),
            performance: { ...this.stats }
        };
    }
    
    /**
     * 获取组件管理器（用于高级操作）
     */
    public getComponentManager(): ComponentManager {
        return this.componentManager;
    }
    
    /**
     * 获取系统管理器（用于高级操作）
     */
    public getSystemManager(): SystemManager {
        return this.systemManager;
    }
}
