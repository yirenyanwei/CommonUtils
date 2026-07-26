# Gameplay Ability System（GAS）概念与设计原理

> 目标：理解 GAS 是什么、为什么要这样设计，以及它在本 ARPG Demo 中如何落地。  
> 建议配合阅读：
> - [目录.md](./目录.md)
> - [代码执行流程.md](./代码执行流程.md)
> - [设计文档.md](./设计文档.md)

---

## 1. GAS 是什么

Gameplay Ability System，简称 **GAS**，是一套用于管理“角色能力、属性、状态、Buff/Debuff、技能释放、效果结算”的通用战斗框架。

它最早被广泛熟知，是因为 Unreal Engine 的 Gameplay Ability System。商业项目中，类似架构常用于：

- 动作游戏：普攻、技能、霸体、无敌帧、硬直、击飞、连招
- RPG / ARPG：属性、Buff、Debuff、装备词条、技能成长
- MOBA / 射击：状态效果、技能 CD、资源消耗、伤害修正、预测与回滚

GAS 的核心思想不是“写一个技能类”，而是把战斗中容易混在一起的东西拆开：

```text
角色拥有什么能力？
角色当前有什么属性？
角色身上有哪些状态？
技能能不能释放？
技能释放后按什么时序执行？
技能命中后造成什么效果？
Buff/Debuff 怎么生效、持续、移除？
View 怎么知道该播什么动画和特效？
```

GAS 的价值，是把这些问题变成一套标准化的数据和流程。

---

## 2. 为什么需要 GAS

如果不用 GAS，常见写法通常会变成这样：

```ts
if (skillId === 'fireball') {
    if (mp >= 20 && cd <= 0 && !isStunned) {
        mp -= 20;
        cd = 3;
        playAnimation('fireball');
        spawnHitbox();
        if (hitEnemy) {
            enemy.hp -= damage;
            enemy.addBuff('burning');
        }
    }
}
```

这种写法在 Demo 早期很快，但项目稍微变大就会出现问题：

- 技能逻辑、资源消耗、动画、伤害、Buff 混在一起
- 每个技能都重复写 CD、MP、状态检查
- Buff/Debuff 无法统一管理
- 状态互斥关系越来越难维护，例如霸体、无敌、硬直、沉默、浮空
- 服务器校验和回放困难，因为逻辑散落在 View 和技能脚本里
- 配置难以驱动，策划想改数值必须改代码

GAS 的目标就是解决这些问题：

```text
技能 = 可配置的 Ability
效果 = 可配置的 GameplayEffect
状态 = GameplayTag
属性 = AttributeSet
执行过程 = AbilityTask
表现 = GameplayCue / BattleEvent
统一入口 = AbilitySystemComponent
```

---

## 3. GAS 的五个核心概念

### 3.1 ASC：AbilitySystemComponent

**ASC 是 GAS 的中枢。**

在本项目中对应：

```text
battle-core/gas/ability-system-component.ts
```

每个战斗实体都有一个 ASC：

```text
CharacterEntity
 └─ asc: AbilitySystemComponent
```

ASC 负责管理：

- 当前属性：HP、MP、攻击、防御、移动速度
- 当前状态标签：硬直、浮空、霸体、无敌、技能释放中
- 已授予技能：普攻、技能1、技能2、技能3
- 技能 CD 状态
- 正在执行的技能
- 正在生效的 Buff/Debuff

可以把 ASC 理解成“角色身上的战斗操作系统”。

角色本身只保存位置、速度、阵营、是否存活等实体状态；真正的战斗规则都通过 ASC 进入。

---

### 3.2 AttributeSet：属性集合

**AttributeSet 负责保存角色属性。**

在本项目中对应：

```text
battle-core/gas/attribute/attribute-set.ts
```

当前 Demo 中的属性包括：

```text
hp
maxHp
mp
maxMp
atk
def
moveSpeed
```

每个属性分两层：

```ts
interface Attribute {
    base: number;
    current: number;
}
```

含义：

- `base`：基础值，来自配置
- `current`：当前值，会被 GE、伤害、回复修改

例如减速 Buff：

```text
moveSpeed.base = 4
moveSpeed.current = 4

施加 -40% 减速：
moveSpeed.current = 2.4

Buff 到期：
moveSpeed.current 还原
```

为什么要区分 `base/current`？

因为战斗中很多效果是临时的：

- 加攻击
- 减速
- 加防御
- 沉默
- 中毒
- 护盾

如果只改一个数值，Buff 到期时很难知道应该还原到哪里。

---

### 3.3 GameplayTag：状态标签

**GameplayTag 是 GAS 中最重要的状态表达方式。**

在本项目中对应：

```text
data/config-types.ts
battle-core/gas/tag/gameplay-tag-container.ts
```

例如：

```text
State.Airborne      空中
State.Grounded      地面
State.Stunned       硬直
State.Invincible    无敌
State.SuperArmor    霸体
Block.Skill         禁止释放技能
Block.Move          禁止移动
Ability.Active      技能执行中
Debuff.Slowed       减速
Debuff.Poisoned     中毒
```

Tag 的作用不是“显示一个状态”，而是参与规则判断。

例如技能1配置：

```text
blockedTags:
  - State.Airborne
  - State.Stunned
  - Ability.Active
```

意思是：

```text
如果角色在空中，不能放技能1
如果角色硬直中，不能放技能1
如果角色已经有技能在执行，不能重复放技能1
```

这种设计的好处是：

- 技能不需要知道“为什么不能放”
- Buff 不需要知道“谁会被影响”
- 状态系统和技能系统通过 Tag 解耦

技能只声明：

```text
我需要哪些 Tag
我被哪些 Tag 阻止
我激活时给自己加哪些 Tag
```

至于这些 Tag 是从跳跃、受击、Buff、AI、关卡机制哪里来的，技能不关心。

---

### 3.4 GameplayAbility（GA）：技能

**GameplayAbility 表示一个可释放能力。**

在本项目中，静态配置在：

```text
data/gas-registry.ts
```

运行时实例在：

```text
battle-core/gas/ability/ability-spec.ts
```

一个 GA 配置大致包含：

```ts
interface GameplayAbilitySpec {
    id: string;
    costMp: number;
    cooldownTicks: number;
    requiredTags?: GameplayTag[];
    blockedTags?: GameplayTag[];
    activationOwnedTags?: GameplayTag[];
    tasks: AbilityTaskConfig[];
    defaultAnimName?: string;
}
```

它描述的是：

- 技能 ID
- 消耗多少 MP
- CD 多久
- 需要哪些状态
- 被哪些状态阻止
- 激活期间给自己加哪些状态
- 技能内部按什么时序执行

注意：GA 不直接等于“伤害”。

一个技能可能只是：

- 位移
- 加 Buff
- 召唤 Hitbox
- 播动画
- 等待几个 tick
- 分多段打击
- 给自己加霸体
- 给敌人加减速

所以 GA 更准确的理解是：

```text
一个能力的规则入口 + 执行脚本
```

---

### 3.5 GameplayEffect（GE）：效果

**GameplayEffect 表示一个可被施加到目标身上的效果。**

在本项目中，静态配置在：

```text
data/gas-registry.ts
```

运行时实例在：

```text
battle-core/gas/effect/active-gameplay-effect.ts
```

GE 可以是：

- 立即伤害
- 回复 HP
- 扣 MP
- 加攻击
- 减速
- 硬直
- 浮空
- 中毒
- 沉默
- 无敌
- 霸体

本项目中 GE 有三种持续类型：

```text
Instant    立即生效，不进入 activeEffects
Duration   持续若干 tick，到期移除
Infinite   无限持续，直到主动移除
```

例如硬直 GE：

```text
id: ge_hitstun_light
durationType: Duration
durationTicks: 10
grantedTags:
  - State.Stunned
  - Block.Move
  - Block.Skill
```

它的含义是：

```text
目标进入 10 tick 硬直
期间不能移动
期间不能释放技能
到期后自动移除这些 Tag
```

---

## 4. GAS 的运行时关系

可以用下面这张图理解：

```text
CharacterEntity
 ├─ position / velocity / facing / isAlive
 └─ ASC: AbilitySystemComponent
      ├─ AttributeSet
      │    ├─ hp / maxHp
      │    ├─ mp / maxMp
      │    ├─ atk / def
      │    └─ moveSpeed
      │
      ├─ GameplayTagContainer
      │    └─ State.Stunned / State.Airborne / Ability.Active ...
      │
      ├─ GrantedAbilities
      │    ├─ ga_normal_atk_1 → AbilitySpec(CD)
      │    ├─ ga_skill1_dash_slash → AbilitySpec(CD)
      │    └─ ...
      │
      ├─ ActiveAbility
      │    └─ 当前正在执行的 GA Task 链
      │
      └─ ActiveGameplayEffects
           ├─ ge_hitstun_light(remainingTicks=10)
           ├─ ge_slow(remainingTicks=60)
           └─ ...
```

静态配置和运行时对象的关系：

```text
data/gas-registry.ts
  ├─ GameplayAbilitySpec  静态技能配置
  └─ GameplayEffectSpec   静态效果配置

运行时：

GameplayAbilitySpec
  └─ grantAbility()
       → AbilitySpec（记录 CD）
            └─ tryActivateAbility()
                 → ActiveAbility（记录 Task 执行到哪一步）

GameplayEffectSpec
  └─ applyGameplayEffect()
       → ActiveGameplayEffect（记录剩余 tick / 周期计时）
```

---

## 5. 技能为什么要拆成 AbilityTask

如果一个技能只有“按下按钮，立刻扣血”，不需要 Task。

但动作游戏里的技能通常有时序：

```text
第 0 tick：播起手动画
第 3 tick：角色向前冲刺
第 5 tick：生成 Hitbox
第 5~8 tick：Hitbox 有效
第 10 tick：进入收招
第 15 tick：技能结束，可以恢复行动
```

所以 GAS 通常会把一个技能拆成一串 Task。

本项目的 Task：

```text
WaitTicksTask        等待若干 tick
SpawnHitboxTask      生成攻击判定框
ApplyGETask          施加 GE
ApplyImpulseTask     施加位移冲量
PlayAnimEventTask    发送动画/特效事件
```

例如 Skill1：

```text
ga_skill1_dash_slash
 ├─ PlayAnimEvent("skill1")
 ├─ ApplyImpulse(forwardForce=8)
 ├─ WaitTicks(5)
 ├─ SpawnHitbox(width=140, height=100, durationTicks=5)
 └─ WaitTicks(10)
```

这使技能逻辑变成“数据驱动的时间线”：

```text
配置决定技能什么时候位移
配置决定什么时候出判定
配置决定判定框多大
配置决定命中后使用哪个 GE
```

代码只负责解释这些配置。

---

## 6. 技能激活的标准流程

本项目中，技能激活入口是：

```text
AbilitySystemComponent.tryActivateAbility(abilityId, world)
```

流程如下：

```text
1. 检查这个技能是否已经授予给角色
2. 从 gasRegistry 读取 GameplayAbilitySpec
3. 检查 requiredTags
4. 检查 blockedTags
5. 检查 CD
6. 检查 MP
7. 扣 MP，并 emit ATTRIBUTE_CHANGE
8. 设置 CD
9. 添加 activationOwnedTags，例如 Ability.Active、State.SuperArmor
10. 根据 GA 配置构建 AbilityTask 链
11. 创建 ActiveAbility，等待每 tick 推进
```

这套流程解决的问题是：

- 所有技能都走同一套合法性检查
- 所有技能都走同一套 MP/CD 规则
- 所有技能都能通过 Tag 被统一阻止
- 所有技能执行中都能统一标记 `Ability.Active`
- 所有技能执行过程都能被固定 tick 驱动

---

## 7. GE 的生命周期

GE 施加入口：

```text
AbilitySystemComponent.applyGameplayEffect(geSpec, world)
```

生命周期如下：

```text
施加时
 ├─ 如果是 Instant
 │    └─ 立即 applyModifiers，不进入 activeEffects
 │
 └─ 如果是 Duration / Infinite
      ├─ new ActiveGameplayEffect(geSpec)
      ├─ applyModifiers
      ├─ add grantedTags
      ├─ activeEffects.push(age)
      └─ emit GE_APPLIED

每 tick
 └─ TagTickSystem
      └─ asc.tickActiveEffects(world)
           ├─ Duration: remainingTicks--
           ├─ Periodic: periodicTimer++
           ├─ 到期: removeGameplayEffect()
           └─ CD: tickCooldown()

移除时
 ├─ 从 activeEffects 删除
 ├─ 反向 applyModifiers
 ├─ remove grantedTags
 └─ emit GE_REMOVED
```

举例：减速 Buff

```text
施加 ge_slow
 ├─ moveSpeed current 降低 40%
 ├─ 添加 Debuff.Slowed
 ├─ UI 收到 GE_APPLIED，显示减速图标
 └─ 60 tick 后自动移除
      ├─ moveSpeed 还原
      ├─ 移除 Debuff.Slowed
      └─ UI 收到 GE_REMOVED，移除图标
```

---

## 8. GAS 与 Hitbox/伤害系统的关系

GAS 不直接做碰撞。

本项目的分工是：

```text
GA / AbilityTask
 └─ 决定什么时候生成 Hitbox

HitboxManager
 └─ 管理 Hitbox 的生命周期

CollisionSystem
 └─ 检测 Hitbox 是否命中 Hurtbox

DamageResolver
 └─ 计算伤害数值

DamagePipeline
 └─ 扣 HP、施加硬直/击飞 GE、emit 事件

ASC
 └─ 保存属性、状态、Buff/Debuff
```

完整链路：

```text
Skill 按钮
 → InputCommand
 → AbilitySystem
 → ASC.tryActivateAbility()
 → ActiveAbility 推进 Task
 → SpawnHitboxTask
 → HitboxManager.spawnHitbox()
 → CollisionSystem 检测命中
 → DamageResolver.compute()
 → DamagePipeline.apply()
 → target.asc.applyGameplayEffect(硬直 / 浮空)
 → EventBus emit DAMAGE / GE_APPLIED / TAG_CHANGED
 → View 播表现
```

这种分工保证：

- 技能不关心谁被命中
- Hitbox 不关心伤害公式
- 伤害公式不关心动画表现
- Buff 不关心来源是技能、道具还是关卡机关
- View 不参与任何战斗计算

---

## 9. GAS 与确定性回放

本项目设计 GAS 时特别强调确定性，因为未来要支持服务器校验。

确定性依赖几个原则：

### 9.1 固定 tick

所有逻辑通过 `BattleCore.step()` 推进。

```text
1 tick = 1 / 20 秒 = 50ms
```

技能等待、Buff 持续、CD 倒计时都使用整数 tick：

```text
cooldownTicks = 60
durationTicks = 10
WaitTicks(5)
```

不使用真实时间，不使用渲染帧 dt 做战斗判断。

### 9.2 输入序列化

玩家操作被记录为：

```ts
InputCommand {
    type: 'Skill1',
    tick: 200
}
```

只要 seed 和 InputCommand 序列一致，就可以重放出同样的战斗。

### 9.3 随机源统一

暴击等随机行为必须走：

```text
SeededRandom
```

禁止在战斗逻辑中使用：

```ts
Math.random()
```

### 9.4 View 与 Logic 分离

View 只消费事件：

```text
DAMAGE
ENTITY_MOVE
ABILITY_ACTIVATE
GE_APPLIED
BATTLE_END
```

View 不参与：

- 伤害
- CD
- Buff
- Hitbox
- 胜负判定

这样 Headless 环境不需要 Cocos，也能跑完整场战斗。

---

## 10. GAS 的设计原则

### 原则 1：所有战斗状态集中到 ASC

角色是否硬直、是否霸体、是否有 Buff、是否能释放技能，都通过 ASC 查询。

这样避免：

```text
CharacterEntity.isStunned
SkillController.isCasting
BuffManager.hasSlow
MovementController.locked
```

这些状态分散在多个对象中，最后互相打架。

---

### 原则 2：用 Tag 表达状态，而不是大量布尔值

不要这样：

```ts
isStunned: boolean
isAirborne: boolean
isInvincible: boolean
isSilenced: boolean
isCasting: boolean
```

而是：

```text
State.Stunned
State.Airborne
State.Invincible
Block.Skill
Ability.Active
```

Tag 的优势是：

- 可组合
- 可配置
- 可查询
- 可扩展
- 能作为技能释放条件

新增一个“沉默”状态，不需要改技能代码，只需要让沉默 GE 赋予：

```text
Block.Skill
```

所有 blockedTags 包含 `Block.Skill` 的技能自然都会被阻止。

---

### 原则 3：技能只描述“能力过程”，效果交给 GE

技能不要直接写：

```text
enemy.moveSpeed -= 40%
enemy.isStunned = true
enemy.hp -= 50
```

而应该：

```text
命中后施加 ge_slow
命中后施加 ge_hitstun_light
命中后走 DamagePipeline
```

这样同一个 GE 可以被多个来源复用：

- 技能
- 敌人攻击
- 地图陷阱
- 道具
- 后续装备词条

---

### 原则 4：配置驱动，而不是技能硬编码

技能的结构应尽量由配置表达：

```text
costMp
cooldownTicks
blockedTags
activationOwnedTags
tasks
```

代码只负责解释配置。

这样改技能时，大部分情况只改 `gas-registry.ts`，不改系统代码。

---

### 原则 5：即时事件给 View，持久状态留在 Core

例如：

```text
角色移动 → emit ENTITY_MOVE
受到伤害 → emit DAMAGE
Buff 生效 → emit GE_APPLIED
技能开始 → emit ABILITY_ACTIVATE
```

View 收到事件后播放动画、飘字、更新 UI。

但 View 不保存战斗真相。

战斗真相永远在：

```text
BattleWorld
EntityManager
CharacterEntity
AbilitySystemComponent
```

---

## 11. 与传统技能系统的区别

| 维度 | 传统写法 | GAS 写法 |
|---|---|---|
| 技能释放条件 | 每个技能自己写 if | `requiredTags` / `blockedTags` 统一判断 |
| CD/MP | 各技能脚本自己管理 | ASC + AbilitySpec 统一管理 |
| Buff | 单独 BuffManager 或散落在角色上 | GameplayEffect + ActiveGameplayEffect |
| 状态 | 多个 boolean | GameplayTag |
| 技能时序 | 协程/定时器/动画事件混写 | AbilityTask 链 |
| 表现 | 技能脚本直接播动画 | 逻辑 emit 事件，View 消费 |
| 回放 | 很难保证一致 | seed + InputCommand + fixed tick |
| 扩展 | 新技能经常改系统代码 | 主要新增配置 |

---

## 12. 本项目中的 GAS 代码对应表

| GAS 概念 | 本项目文件 | 说明 |
|---|---|---|
| AbilitySystemComponent | `battle-core/gas/ability-system-component.ts` | GAS 中枢，管理属性、Tag、技能、GE、Task |
| AttributeSet | `battle-core/gas/attribute/attribute-set.ts` | 属性集合 |
| GameplayTagContainer | `battle-core/gas/tag/gameplay-tag-container.ts` | 状态标签容器 |
| GameplayAbilitySpec | `data/config-types.ts` | 技能静态配置类型 |
| GameplayEffectSpec | `data/config-types.ts` | 效果静态配置类型 |
| AbilitySpec | `battle-core/gas/ability/ability-spec.ts` | 已授予技能的运行时实例，持有 CD |
| ActiveGameplayEffect | `battle-core/gas/effect/active-gameplay-effect.ts` | 运行中的 Buff/Debuff |
| AbilityTask | `battle-core/gas/task/ability-task.ts` | 技能时序子步骤 |
| Task Builder | `battle-core/gas/task/task-builder.ts` | 根据配置构建 Task 实例 |
| GA / GE 注册表 | `data/gas-registry.ts` | 当前 Demo 的技能和效果配置 |
| AbilitySystem | `battle-core/system/ability-system.ts` | 每 tick 驱动 ASC 激活/推进技能 |
| TagTickSystem | `battle-core/system/tag-tick-system.ts` | 每 tick 驱动 GE 生命周期和 CD 倒计时 |

---

## 13. 阅读 GAS 源码建议路线

### 第一遍：先看静态数据

```text
data/config-types.ts
data/gas-registry.ts
```

目标：理解一个技能和一个 Buff 在配置里长什么样。

---

### 第二遍：看 ASC

```text
battle-core/gas/ability-system-component.ts
```

重点看：

```text
grantAbility()
tryActivateAbility()
advanceActiveAbility()
applyGameplayEffect()
tickActiveEffects()
removeGameplayEffect()
```

目标：理解 GAS 的核心状态都在哪里，以及技能/GE 如何进入运行时。

---

### 第三遍：看 Task

```text
battle-core/gas/task/
```

目标：理解技能如何跨多个 tick 执行。

---

### 第四遍：看 System 如何驱动 GAS

```text
battle-core/system/tag-tick-system.ts
battle-core/system/ability-system.ts
```

目标：理解 ASC 本身不主动运行，是 System 每 tick 驱动它。

---

### 第五遍：看命中后如何回到 GAS

```text
battle-core/system/collision-system.ts
battle-core/combat/damage-pipeline.ts
```

目标：理解 Hitbox 命中后，如何扣血、施加硬直/浮空 GE、发事件。

---

## 14. 一个最小心智模型

读代码时，可以先记住这句话：

```text
ASC 管状态，GA 管能力，GE 管效果，Tag 管规则，Task 管时序，Event 管表现。
```

再展开：

```text
玩家输入
 → AbilitySystem
 → ASC.tryActivateAbility()
 → GA 配置检查 Tag / MP / CD
 → Task 链执行
 → SpawnHitbox
 → CollisionSystem 命中
 → DamagePipeline 结算
 → GE 改属性 / 加 Tag
 → EventBus 通知 View
```

这就是本项目 GAS 的主流程。
