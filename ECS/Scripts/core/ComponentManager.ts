/**
 * 组件管理器
 * 负责管理所有实体的组件
 */

import { EntityId, ComponentType, IComponent, ComponentAddedEvent, ComponentRemovedEvent } from './types';
import { EventTarget } from 'cc';

/**
 * 组件管理器
 */
export class ComponentManager {
    // 实体ID到组件映射表：entityId -> Map<componentType, component>
    private entityComponents: Map<EntityId, Map<ComponentType, IComponent>> = new Map();
    
    // 组件类型到实体映射表：componentType -> Set<entityId>
    private componentEntities: Map<ComponentType, Set<EntityId>> = new Map();
    
    // 事件系统
    public readonly onComponentAdded: EventTarget = new EventTarget();
    public readonly onComponentRemoved: EventTarget = new EventTarget();
    
    /**
     * 添加组件
     */
    public addComponent(entityId: EntityId, component: IComponent): void {
        const componentType = component.type;
        
        // 获取实体的组件映射，如果不存在则创建
        let entityComponentMap = this.entityComponents.get(entityId);
        if (!entityComponentMap) {
            entityComponentMap = new Map();
            this.entityComponents.set(entityId, entityComponentMap);
        }
        
        // 如果组件已存在，先移除旧的
        if (entityComponentMap.has(componentType)) {
            this.removeComponent(entityId, componentType);
        }
        
        // 添加组件
        entityComponentMap.set(componentType, component);
        
        // 更新组件类型到实体的映射
        let entitySet = this.componentEntities.get(componentType);
        if (!entitySet) {
            entitySet = new Set();
            this.componentEntities.set(componentType, entitySet);
        }
        entitySet.add(entityId);
        
        // 触发组件添加事件
        this.onComponentAdded.emit('component_added', {
            entityId,
            component
        } as ComponentAddedEvent);
    }
    
    /**
     * 移除组件
     */
    public removeComponent(entityId: EntityId, componentType: ComponentType): void {
        const entityComponentMap = this.entityComponents.get(entityId);
        if (!entityComponentMap) {
            return;
        }
        
        const component = entityComponentMap.get(componentType);
        if (!component) {
            return;
        }
        
        // 移除组件
        entityComponentMap.delete(componentType);
        
        // 如果实体没有组件了，移除实体映射
        if (entityComponentMap.size === 0) {
            this.entityComponents.delete(entityId);
        }
        
        // 更新组件类型到实体的映射
        const entitySet = this.componentEntities.get(componentType);
        if (entitySet) {
            entitySet.delete(entityId);
            if (entitySet.size === 0) {
                this.componentEntities.delete(componentType);
            }
        }
        
        // 触发组件移除事件
        this.onComponentRemoved.emit('component_removed', {
            entityId,
            componentType
        } as ComponentRemovedEvent);
    }
    
    /**
     * 获取组件
     */
    public getComponent<T extends IComponent>(entityId: EntityId, componentType: ComponentType): T | null {
        const entityComponentMap = this.entityComponents.get(entityId);
        if (!entityComponentMap) {
            return null;
        }
        
        return (entityComponentMap.get(componentType) as T) || null;
    }
    
    /**
     * 检查实体是否拥有组件
     */
    public hasComponent(entityId: EntityId, componentType: ComponentType): boolean {
        const entityComponentMap = this.entityComponents.get(entityId);
        if (!entityComponentMap) {
            return false;
        }
        
        return entityComponentMap.has(componentType);
    }
    
    /**
     * 获取实体拥有的所有组件
     */
    public getComponents(entityId: EntityId): IComponent[] {
        const entityComponentMap = this.entityComponents.get(entityId);
        if (!entityComponentMap) {
            return [];
        }
        
        return Array.from(entityComponentMap.values());
    }
    
    /**
     * 移除实体的所有组件
     */
    public removeAllComponents(entityId: EntityId): void {
        const entityComponentMap = this.entityComponents.get(entityId);
        if (!entityComponentMap) {
            return;
        }
        
        // 复制组件类型列表，避免在迭代时修改
        const componentTypes = Array.from(entityComponentMap.keys());
        
        // 移除所有组件
        for (const componentType of componentTypes) {
            this.removeComponent(entityId, componentType);
        }
    }
    
    /**
     * 查询拥有指定组件的所有实体
     */
    public queryEntities(...componentTypes: ComponentType[]): EntityId[] {
        if (componentTypes.length === 0) {
            return Array.from(this.entityComponents.keys());
        }
        
        if (componentTypes.length === 1) {
            const entitySet = this.componentEntities.get(componentTypes[0]);
            return entitySet ? Array.from(entitySet) : [];
        }
        
        // 多个组件类型：找到拥有所有指定组件的实体
        const entitySets = componentTypes.map(type => this.componentEntities.get(type));
        
        // 如果任何一个组件类型没有实体，返回空数组
        if (entitySets.some(set => !set || set.size === 0)) {
            return [];
        }
        
        // 找到所有集合的交集
        let result = Array.from(entitySets[0]!);
        for (let i = 1; i < entitySets.length; i++) {
            const set = entitySets[i]!;
            result = result.filter(entityId => set.has(entityId));
        }
        
        return result;
    }
    
    /**
     * 清空所有组件
     */
    public clear(): void {
        this.entityComponents.clear();
        this.componentEntities.clear();
    }
    
    /**
     * 获取统计信息
     */
    public getStats(): { entityCount: number; componentTypeCount: number; totalComponents: number } {
        let totalComponents = 0;
        for (const componentMap of this.entityComponents.values()) {
            totalComponents += componentMap.size;
        }
        
        return {
            entityCount: this.entityComponents.size,
            componentTypeCount: this.componentEntities.size,
            totalComponents
        };
    }
}

