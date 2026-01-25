/**
 * ECS框架核心类型定义
 */

/**
 * 实体ID类型
 */
export type EntityId = number;

/**
 * 组件类型标识
 */
export type ComponentType = string | number;

/**
 * 组件基类接口
 * 所有组件必须实现此接口
 */
export interface IComponent {
    /**
     * 组件类型标识
     */
    readonly type: ComponentType;
}

/**
 * 系统基类接口
 * 所有系统必须实现此接口
 */
export interface ISystem {
    /**
     * 系统类型标识
     */
    readonly type: string;
    
    /**
     * 系统优先级（数字越小优先级越高）
     */
    readonly priority: number;
    
    /**
     * 系统是否启用
     */
    enabled: boolean;
    
    /**
     * 初始化系统
     */
    onInit?(world: IWorld): void;
    
    /**
     * 系统更新
     * @param deltaTime 帧间隔时间（秒）
     */
    onUpdate?(world: IWorld, deltaTime: number): void;
    
    /**
     * 系统销毁
     */
    onDestroy?(world: IWorld): void;
}

/**
 * 世界接口
 */
export interface IWorld {
    /**
     * 创建实体
     */
    createEntity(): EntityId;
    
    /**
     * 销毁实体
     */
    destroyEntity(entityId: EntityId): void;
    
    /**
     * 检查实体是否存在
     */
    hasEntity(entityId: EntityId): boolean;
    
    /**
     * 添加组件
     */
    addComponent<T extends IComponent>(entityId: EntityId, component: T): T;
    
    /**
     * 移除组件
     */
    removeComponent(entityId: EntityId, componentType: ComponentType): void;
    
    /**
     * 获取组件
     */
    getComponent<T extends IComponent>(entityId: EntityId, componentType: ComponentType): T | null;
    
    /**
     * 检查实体是否拥有组件
     */
    hasComponent(entityId: EntityId, componentType: ComponentType): boolean;
    
    /**
     * 注册系统
     */
    registerSystem(system: ISystem): void;
    
    /**
     * 移除系统
     */
    removeSystem(systemType: string): void;
    
    /**
     * 获取系统
     */
    getSystem<T extends ISystem>(systemType: string): T | null;
    
    /**
     * 查询拥有指定组件的所有实体
     */
    queryEntities(...componentTypes: ComponentType[]): EntityId[];
    
    /**
     * 更新世界（执行所有系统）
     */
    update(deltaTime: number): void;
    
    /**
     * 清空世界
     */
    clear(): void;
}

/**
 * 组件添加事件
 */
export interface ComponentAddedEvent {
    entityId: EntityId;
    component: IComponent;
}

/**
 * 组件移除事件
 */
export interface ComponentRemovedEvent {
    entityId: EntityId;
    componentType: ComponentType;
}

/**
 * 实体创建事件
 */
export interface EntityCreatedEvent {
    entityId: EntityId;
}

/**
 * 实体销毁事件
 */
export interface EntityDestroyedEvent {
    entityId: EntityId;
}

