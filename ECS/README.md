# ECS框架使用说明

## 概述

这是一个成熟的、实用的ECS（Entity-Component-System）框架，专为游戏开发设计。ECS是一种数据驱动的架构模式，将游戏对象分解为实体（Entity）、组件（Component）和系统（System），提供了良好的代码组织和性能优化。

### 核心特性

- ✅ **完整的ECS实现**：Entity、Component、System三大核心要素
- ✅ **高性能查询**：基于组件类型的快速实体查询
- ✅ **系统优先级**：支持系统执行顺序控制
- ✅ **事件系统**：实体和组件的生命周期事件
- ✅ **类型安全**：完整的TypeScript类型支持
- ✅ **易于扩展**：简洁的接口设计，方便添加新组件和系统

## 核心概念

### Entity（实体）
- 实体是一个唯一的ID，用于标识游戏对象
- 实体本身不包含任何数据，只是一个标识符

### Component（组件）
- 组件是纯数据容器，存储实体的属性
- 例如：位置、速度、生命值等
- 组件必须实现 `IComponent` 接口

### System（系统）
- 系统包含游戏逻辑，处理拥有特定组件的实体
- 系统在每帧更新时执行
- 系统必须实现 `ISystem` 接口

## 快速开始

### 1. 创建World

```typescript
import { World } from './core/World';

const world = new World();
```

### 2. 创建实体并添加组件

```typescript
// 创建实体
const entityId = world.createEntity();

// 添加Transform组件
import { Transform } from './components/Transform';
import { Vec3 } from 'cc';

const transform = new Transform(new Vec3(0, 0, 0));
world.addComponent(entityId, transform);

// 添加Velocity组件
import { Velocity } from './components/Velocity';
const velocity = new Velocity(new Vec3(1, 0, 0));
world.addComponent(entityId, velocity);
```

### 3. 注册系统

```typescript
import { MovementSystem } from './systems/MovementSystem';

world.registerSystem(new MovementSystem());
```

### 4. 更新世界

```typescript
// 在游戏循环中调用
world.update(deltaTime);
```

## 详细使用

### 创建自定义组件

```typescript
import { IComponent } from './core/types';

export class MyComponent implements IComponent {
    readonly type = 'MyComponent';
    
    public value: number = 0;
    
    constructor(value: number = 0) {
        this.value = value;
    }
}
```

### 创建自定义系统

```typescript
import { ISystem, IWorld } from './core/types';
import { MyComponent } from './components/MyComponent';

export class MySystem implements ISystem {
    readonly type = 'MySystem';
    readonly priority = 100;  // 优先级，数字越小越先执行
    public enabled: boolean = true;
    
    onUpdate(world: IWorld, deltaTime: number): void {
        // 查询所有拥有MyComponent的实体
        const entities = world.queryEntities('MyComponent');
        
        for (const entityId of entities) {
            const component = world.getComponent<MyComponent>(entityId, 'MyComponent');
            if (component) {
                // 处理逻辑
                component.value += deltaTime;
            }
        }
    }
}
```

### 查询实体

```typescript
// 查询拥有单个组件的实体
const entities = world.queryEntities('Transform');

// 查询拥有多个组件的实体（必须同时拥有所有组件）
const movableEntities = world.queryEntities('Transform', 'Velocity');
```

### 组件操作

```typescript
// 添加组件
world.addComponent(entityId, component);

// 获取组件
const component = world.getComponent<Transform>(entityId, 'Transform');

// 检查是否有组件
if (world.hasComponent(entityId, 'Transform')) {
    // ...
}

// 移除组件
world.removeComponent(entityId, 'Transform');
```

### 实体操作

```typescript
// 创建实体
const entityId = world.createEntity();

// 检查实体是否存在
if (world.hasEntity(entityId)) {
    // ...
}

// 销毁实体（会自动移除所有组件）
world.destroyEntity(entityId);
```

### 事件监听

```typescript
// 监听实体创建
world.onEntityCreated.on('entity_created', (event) => {
    console.log(`实体已创建: ${event.entityId}`);
});

// 监听实体销毁
world.onEntityDestroyed.on('entity_destroyed', (event) => {
    console.log(`实体已销毁: ${event.entityId}`);
});

// 监听组件添加
world.getComponentManager().onComponentAdded.on('component_added', (event) => {
    console.log(`组件已添加: ${event.component.type}`);
});

// 监听组件移除
world.getComponentManager().onComponentRemoved.on('component_removed', (event) => {
    console.log(`组件已移除: ${event.componentType}`);
});
```

## 内置组件

### Transform（变换）
存储位置、旋转和缩放信息。

```typescript
const transform = new Transform(
    new Vec3(0, 0, 0),  // 位置
    new Quat(),         // 旋转
    new Vec3(1, 1, 1)   // 缩放
);
```

### Velocity（速度）
存储线性和角速度。

```typescript
const velocity = new Velocity(
    new Vec3(1, 0, 0),  // 线性速度
    new Vec3(0, 0, 0)   // 角速度
);
```

### Health（生命值）
存储当前和最大生命值，提供伤害和恢复方法。

```typescript
const health = new Health(100, 100);  // 最大100，当前100
health.takeDamage(20);                // 受到20点伤害
health.heal(10);                      // 恢复10点生命值
```

### Render（渲染）
关联Cocos Creator的Node节点，用于渲染同步。

```typescript
const render = new Render(node);
render.visible = true;
```

### Tag（标签）
用于给实体打标签，方便分类和查询。

```typescript
const tag = new Tag('player', 'enemy');
tag.addTag('boss');
tag.hasTag('player');  // true
```

## 内置系统

### MovementSystem（移动系统）
根据Velocity组件更新Transform组件的位置。

优先级：100

### HealthSystem（生命值系统）
处理生命值相关逻辑，如死亡检测。

优先级：200

### RenderSystem（渲染系统）
同步Transform组件到Cocos Creator的Node节点。

优先级：1000

## 系统优先级

系统按优先级从小到大执行：
- 数字越小，优先级越高
- 建议优先级范围：
  - 0-100：输入处理、物理计算
  - 100-500：游戏逻辑
  - 500-1000：渲染相关

## 性能优化建议

1. **组件查询优化**：系统应该只查询需要的组件类型
2. **避免频繁创建/销毁**：考虑使用对象池
3. **系统优先级**：合理安排系统执行顺序，避免不必要的计算
4. **批量操作**：尽量批量处理实体，减少函数调用开销

## 完整示例

查看 `ECSTest.ts` 获取完整的使用示例。

## 架构说明

```
ECS/
├── core/              # 核心模块
│   ├── types.ts       # 类型定义
│   ├── World.ts       # 世界类
│   ├── ComponentManager.ts  # 组件管理器
│   └── SystemManager.ts     # 系统管理器
├── components/        # 组件
│   ├── Transform.ts
│   ├── Velocity.ts
│   ├── Health.ts
│   ├── Render.ts
│   └── Tag.ts
├── systems/          # 系统
│   ├── MovementSystem.ts
│   ├── HealthSystem.ts
│   └── RenderSystem.ts
└── ECSTest.ts        # 使用示例
```

## 扩展指南

### 添加新组件

1. 创建组件类，实现 `IComponent` 接口
2. 定义 `type` 属性
3. 添加所需的数据字段

### 添加新系统

1. 创建系统类，实现 `ISystem` 接口
2. 定义 `type` 和 `priority` 属性
3. 实现 `onUpdate` 方法
4. 在World中注册系统

## 注意事项

1. 组件类型标识（`type`）必须是唯一的字符串或数字
2. 系统优先级应该合理设置，避免依赖问题
3. 销毁实体时会自动移除所有组件
4. 系统更新顺序按优先级执行，确保依赖关系正确

