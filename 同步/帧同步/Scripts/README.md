# 帧同步框架使用说明（简化版）

## 概述

这是一个简化的帧同步框架，适用于单机游戏，实现**逻辑帧和渲染帧分离**。

### 核心特性

- ✅ **纯本地**：不需要网络，单机运行
- ✅ **单玩家**：简化的输入处理
- ✅ **逻辑帧和渲染帧分离**：逻辑帧固定时间步长，渲染帧支持插值
- ✅ **确定性随机数**：保证可重现性

## 核心概念

### 逻辑帧（Logic Frame）
- 固定时间步长执行（如60 FPS）
- 处理游戏逻辑：物理、AI、碰撞检测、输入处理等
- 保证确定性，不受渲染帧率影响

### 渲染帧（Render Frame）
- 跟随引擎的update循环
- 在逻辑帧之间进行插值渲染
- 让画面更平滑，不受逻辑帧率限制

### 插值渲染
在逻辑帧之间进行插值，让渲染更平滑：
```
上一逻辑帧位置 + (当前逻辑帧位置 - 上一逻辑帧位置) * alpha
```
其中 `alpha` 是渲染插值系数（0-1之间）

## 快速开始

### 1. 在场景中添加FrameSyncManager

在场景中添加一个GameObject，挂载`FrameSyncManager`组件。

### 2. 创建游戏逻辑组件

```typescript
import { _decorator, Component, Vec3 } from 'cc';
import { FrameSyncManager } from './FrameSyncManager';
import { FrameSyncEvent, InputType } from './types';

@ccclass('GameLogic')
export class GameLogic extends Component {
    private frameSyncManager: FrameSyncManager | null = null;
    
    // 逻辑帧状态
    private logicPosition: Vec3 = new Vec3(0, 0, 0);
    private lastLogicPosition: Vec3 = new Vec3(0, 0, 0);
    private logicVelocity: Vec3 = new Vec3(0, 0, 0);

    start() {
        // 获取帧同步管理器
        this.frameSyncManager = FrameSyncManager.getInstance();
        
        if (!this.frameSyncManager) {
            console.error('FrameSyncManager not found');
            return;
        }

        // 监听逻辑帧事件
        this.frameSyncManager.eventTarget.on(
            FrameSyncEvent.LOGIC_FRAME_START, 
            this.onLogicFrame, 
            this
        );

        // 监听渲染帧事件（用于插值）
        this.frameSyncManager.eventTarget.on(
            FrameSyncEvent.RENDER_FRAME, 
            this.onRenderFrame, 
            this
        );

        // 初始化并启动
        this.frameSyncManager.init({
            logicFrameRate: 60,
            enableInterpolation: true
        });
        this.frameSyncManager.start();
    }

    // 逻辑帧回调 - 在这里执行游戏逻辑
    private onLogicFrame(frameIndex: number) {
        if (!this.frameSyncManager) return;

        // 获取该帧的输入
        const input = this.frameSyncManager.getInput(frameIndex);
        
        // 处理输入
        if (input) {
            this.processInput(input);
        }

        // 更新游戏逻辑
        this.updateGameLogic();
    }

    // 处理输入
    private processInput(input: any) {
        switch (input.inputType) {
            case InputType.MOVE:
                if (input.data) {
                    this.logicVelocity.set(
                        input.data.x || 0, 
                        input.data.y || 0, 
                        input.data.z || 0
                    );
                }
                break;
        }
    }

    // 更新游戏逻辑（物理、AI等）
    private updateGameLogic() {
        // 保存上一帧位置（用于插值）
        this.lastLogicPosition.set(this.logicPosition);

        // 更新逻辑位置
        const frameTime = this.frameSyncManager?.getLogicFrameTime() || (1/60);
        this.logicPosition.x += this.logicVelocity.x * frameTime;
        this.logicPosition.y += this.logicVelocity.y * frameTime;
        this.logicPosition.z += this.logicVelocity.z * frameTime;

        // 应用摩擦力
        this.logicVelocity.multiplyScalar(0.9);
    }

    // 渲染帧回调 - 在这里进行插值渲染
    private onRenderFrame(alpha: number) {
        // alpha: 0 表示上一逻辑帧，1 表示当前逻辑帧
        const renderX = this.lastLogicPosition.x + 
            (this.logicPosition.x - this.lastLogicPosition.x) * alpha;
        const renderY = this.lastLogicPosition.y + 
            (this.logicPosition.y - this.lastLogicPosition.y) * alpha;
        const renderZ = this.lastLogicPosition.z + 
            (this.logicPosition.z - this.lastLogicPosition.z) * alpha;

        // 更新渲染位置
        this.node.setPosition(renderX, renderY, renderZ);
    }

    // 记录输入
    public recordMove(direction: { x?: number, y?: number, z?: number }) {
        if (this.frameSyncManager) {
            this.frameSyncManager.recordInput(InputType.MOVE, direction);
        }
    }

    protected onDestroy(): void {
        if (this.frameSyncManager) {
            this.frameSyncManager.eventTarget.off(
                FrameSyncEvent.LOGIC_FRAME_START, 
                this.onLogicFrame, 
                this
            );
            this.frameSyncManager.eventTarget.off(
                FrameSyncEvent.RENDER_FRAME, 
                this.onRenderFrame, 
                this
            );
        }
    }
}
```

## 配置选项

```typescript
interface FrameSyncConfig {
    logicFrameRate: number;        // 逻辑帧率（FPS），默认60
    enableInterpolation: boolean;  // 是否启用渲染插值，默认true
}
```

## 事件系统

框架提供了以下事件：

- `LOGIC_FRAME_START`: 逻辑帧开始
- `LOGIC_FRAME_END`: 逻辑帧结束
- `RENDER_FRAME`: 渲染帧（传递插值系数alpha）
- `STATE_CHANGED`: 状态改变

```typescript
frameSyncManager.eventTarget.on(
    FrameSyncEvent.LOGIC_FRAME_START, 
    (frameIndex) => {
        console.log(`Logic frame ${frameIndex} started`);
    }, 
    this
);
```

## API参考

### FrameSyncManager

#### 初始化
- `init(config?)`: 初始化帧同步
- `start()`: 开始帧同步
- `pause()`: 暂停帧同步
- `resume()`: 恢复帧同步
- `stop()`: 停止帧同步

#### 输入
- `recordInput(inputType, data)`: 记录玩家输入

#### 查询
- `getCurrentLogicFrameIndex()`: 获取当前逻辑帧索引
- `getInput(frameIndex)`: 获取指定帧的输入
- `getRenderAlpha()`: 获取渲染插值系数 (0-1)
- `getLogicFrameTime()`: 获取逻辑帧时间
- `getCurrentLogicFrameTime()`: 获取当前逻辑帧累计时间
- `getLastLogicFrameTime()`: 获取上一逻辑帧时间

#### 随机数
- `getRandom()`: 获取确定性随机数生成器
- `setRandomSeed(seed)`: 设置随机数种子

#### 统计
- `getStats()`: 获取统计信息
- `resetStats()`: 重置统计信息

## 使用确定性随机数

```typescript
const random = frameSyncManager.getRandom();
if (random) {
    const damage = random.nextInt(10, 20); // 确定性随机数
    const crit = random.next() < 0.1; // 10%暴击率
}
```

## 重要注意事项

1. **逻辑帧和渲染帧分离**：
   - 游戏逻辑必须在逻辑帧中执行
   - 渲染更新在渲染帧中进行插值
   - 不要在渲染帧中修改游戏状态

2. **输入处理**：
   - 输入会延迟一帧执行（记录到下一帧）
   - 在逻辑帧中处理输入

3. **插值渲染**：
   - 需要保存上一逻辑帧的状态
   - 使用 `renderAlpha` 进行插值
   - 只在渲染时使用插值，不要修改逻辑状态

4. **性能考虑**：
   - 逻辑帧率通常设置为60 FPS
   - 如果逻辑计算很重，可以降低逻辑帧率
   - 渲染帧率不受影响，仍然可以保持高帧率

## 工作流程

```
引擎Update (可变帧率)
    ↓
FrameSyncManager.update()
    ↓
执行逻辑帧 (固定时间步长，60 FPS)
    ├─ 触发 LOGIC_FRAME_START
    ├─ 处理输入
    ├─ 执行游戏逻辑
    └─ 触发 LOGIC_FRAME_END
    ↓
计算渲染插值系数 (alpha)
    ↓
触发 RENDER_FRAME (alpha)
    ↓
在渲染帧中插值更新显示
```

## 示例场景

查看 `FrameTest.ts` 获取完整的使用示例。
