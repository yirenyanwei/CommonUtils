# 行为树系统使用指南

这是一个完整的行为树（Behavior Tree）实现，参考了成熟项目的最佳实践，适用于游戏AI开发。

## 核心概念

### 节点类型

1. **组合节点（Composite Nodes）**
   - `Sequence`（顺序节点）：按顺序执行所有子节点，所有子节点成功才返回成功
   - `Selector`（选择节点）：按顺序执行子节点，有一个成功就返回成功

2. **叶子节点（Leaf Nodes）**
   - `Action`（动作节点）：执行具体的游戏逻辑
   - `Condition`（条件节点）：检查条件，立即返回成功或失败

3. **装饰节点（Decorator Nodes）**
   - `Inverter`（反转节点）：反转子节点的结果
   - `Repeat`（重复节点）：重复执行子节点指定次数
   - `UntilSuccess`（直到成功）：重复执行直到成功
   - `UntilFailure`（直到失败）：重复执行直到失败

### 节点状态

- `Inactive`：初始状态，尚未运行
- `Running`：运行中
- `Success`：执行成功
- `Failure`：执行失败

## 快速开始

### 1. 创建行为树

```typescript
import { BehaviorTree } from './BehaviorTree';
import { Sequence } from './Sequence';
import { Selector } from './Selector';

// 创建行为树
const behaviorTree = new BehaviorTree();
const blackboard = behaviorTree.getBlackboard();

// 初始化黑板数据
blackboard.set("health", 100);
blackboard.set("hasEnemy", false);
```

### 2. 构建行为树结构

```typescript
// 创建根节点（选择器）
const root = new Selector("Root");

// 创建攻击序列
const attackSequence = new Sequence("AttackSequence");
const checkEnemy = new CheckEnemyCondition();
const attack = new AttackAction();
attackSequence.addChild(checkEnemy);
attackSequence.addChild(attack);

// 创建巡逻序列
const patrolSequence = new Sequence("PatrolSequence");
const checkHealth = new CheckHealthCondition(50);
const patrol = new PatrolAction();
patrolSequence.addChild(checkHealth);
patrolSequence.addChild(patrol);

// 组装行为树
root.addChild(attackSequence);
root.addChild(patrolSequence);
behaviorTree.setRoot(root);
```

### 3. 每帧更新

```typescript
update(deltaTime: number) {
    if (this.behaviorTree) {
        this.behaviorTree.update();
    }
}
```

## 创建自定义节点

### 创建自定义条件节点

```typescript
import { Condition } from './Condition';
import { BehaviorStatus } from './BehaviorStatus';

export class CheckHealthCondition extends Condition {
    private minHealth: number;

    constructor(minHealth: number = 50) {
        super("CheckHealth");
        this.minHealth = minHealth;
    }

    protected check(): BehaviorStatus {
        const health = this.blackboard.get<number>("health", 100);
        if (health >= this.minHealth) {
            return BehaviorStatus.Success;
        }
        return BehaviorStatus.Failure;
    }
}
```

### 创建自定义动作节点

```typescript
import { Action } from './Action';
import { BehaviorStatus } from './BehaviorStatus';

export class MoveToAction extends Action {
    private targetX: number = 0;
    private targetY: number = 0;
    private speed: number = 5;

    protected onEnter(): void {
        // 节点启动时调用
        this.targetX = this.blackboard.get<number>("targetX", 0);
        this.targetY = this.blackboard.get<number>("targetY", 0);
    }

    protected onUpdate(): BehaviorStatus {
        // 每帧调用，返回运行状态
        // 执行移动逻辑...
        
        // 如果完成，返回Success
        if (/* 到达目标 */) {
            return BehaviorStatus.Success;
        }
        
        // 如果失败，返回Failure
        if (/* 移动失败 */) {
            return BehaviorStatus.Failure;
        }
        
        // 继续运行，返回Running
        return BehaviorStatus.Running;
    }

    protected onExit(): void {
        // 节点结束时调用
    }
}
```

## 黑板系统

黑板用于在节点之间共享数据：

```typescript
const blackboard = behaviorTree.getBlackboard();

// 设置数据
blackboard.set("health", 100);
blackboard.set("targetX", 50);
blackboard.set("hasEnemy", true);

// 获取数据
const health = blackboard.get<number>("health", 0);
const hasEnemy = blackboard.get<boolean>("hasEnemy", false);

// 检查是否存在
if (blackboard.has("health")) {
    // ...
}

// 删除数据
blackboard.delete("health");
```

## 示例场景

### 敌人AI示例

```typescript
// 行为树结构：
// Selector
//   ├─ Sequence (攻击)
//   │   ├─ CheckEnemyNearby
//   │   └─ AttackAction
//   ├─ Sequence (追击)
//   │   ├─ CheckEnemyInRange
//   │   └─ ChaseAction
//   └─ Sequence (巡逻)
//       ├─ CheckHealth
//       └─ PatrolAction
```

### 使用装饰节点

```typescript
// 重复攻击3次
const repeatAttack = new Repeat(3);
repeatAttack.addChild(new AttackAction());

// 直到成功
const untilSuccess = new UntilSuccess();
untilSuccess.addChild(new MoveToAction());

// 反转条件
const inverter = new Inverter();
inverter.addChild(new CheckHealthCondition());
```

## 最佳实践

1. **节点命名**：为每个节点设置有意义的名称，便于调试
2. **黑板数据**：使用黑板共享数据，避免节点之间的直接依赖
3. **状态管理**：确保节点正确重置状态，避免状态污染
4. **错误处理**：在自定义节点中添加适当的错误处理
5. **性能优化**：避免在每帧创建新节点，复用节点实例

## 文件结构

```
行为树/Scripts/
├── BehaviorStatus.ts          # 状态枚举
├── BehaviorNode.ts            # 节点基类
├── Blackboard.ts              # 黑板系统
├── BehaviorTree.ts            # 行为树主类
├── Sequence.ts                # 顺序节点
├── Selector.ts                # 选择节点
├── Action.ts                  # 动作节点基类
├── Condition.ts               # 条件节点基类
├── Decorator.ts               # 装饰节点基类
├── Inverter.ts                # 反转节点
├── Repeat.ts                  # 重复节点
├── UntilSuccess.ts            # 直到成功节点
├── UntilFailure.ts            # 直到失败节点
├── BehaviorTreeTest.ts        # 测试组件
└── Examples/                  # 示例节点
    ├── CheckHealthCondition.ts
    ├── CheckEnemyNearbyCondition.ts
    ├── MoveToAction.ts
    ├── AttackAction.ts
    └── PatrolAction.ts
```

## 参考资源

本实现参考了以下成熟项目：
- Unity Behavior Tree 实现
- 游戏AI行为树最佳实践
- 行为树设计模式

## 许可证

本项目仅供学习和参考使用。
