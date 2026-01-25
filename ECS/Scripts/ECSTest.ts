import { _decorator, Component, Node, Vec3, Quat, Prefab, instantiate } from 'cc';
import { World } from './core/World';
import { Transform, Velocity, Health, Render, Tag } from './components';
import { MovementSystem, HealthSystem, RenderSystem } from './systems';

const { ccclass, property } = _decorator;

/**
 * ECS测试示例
 * 演示如何使用ECS框架
 */
@ccclass('ECSTest')
export class ECSTest extends Component {
    @property({
        tooltip: '是否自动创建测试实体'
    })
    public autoCreateEntities: boolean = true;
    
    @property({
        tooltip: '测试实体数量'
    })
    public entityCount: number = 5;
    @property(Prefab)
    prefab: Prefab = null;
    
    private world: World = new World();
    private testEntities: number[] = [];
    
    start() {
        // 注册系统
        this.world.registerSystem(new MovementSystem());
        this.world.registerSystem(new HealthSystem());
        this.world.registerSystem(new RenderSystem());
        
        if (this.autoCreateEntities) {
            this.createTestEntities();
        }
        
        // 监听实体创建事件
        this.world.onEntityCreated.on('entity_created', (event: any) => {
            console.log(`实体已创建: ${event.entityId}`);
        });
        
        // 监听实体销毁事件
        this.world.onEntityDestroyed.on('entity_destroyed', (event: any) => {
            console.log(`实体已销毁: ${event.entityId}`);
        });
        
        // 监听组件添加事件
        this.world.getComponentManager().onComponentAdded.on('component_added', (event: any) => {
            console.log(`组件已添加: 实体${event.entityId}, 组件类型${event.component.type}`);
        });
    }
    
    update(deltaTime: number) {
        // 更新ECS世界
        this.world.update(deltaTime);
    }
    
    /**
     * 创建测试实体
     */
    private createTestEntities(): void {
        for (let i = 0; i < this.entityCount; i++) {
            const entityId = this.createTestEntity(i);
            this.testEntities.push(entityId);
        }
        
        console.log(`已创建 ${this.testEntities.length} 个测试实体`);
    }
    
    /**
     * 创建一个测试实体
     */
    private createTestEntity(index: number): number {
        // 创建实体
        const entityId = this.world.createEntity();
        
        // 添加Transform组件
        const transform = new Transform(
            new Vec3(index * 2, Math.random() * 500 - 250, 0),
            new Quat(),
            new Vec3(1, 1, 1)
        );
        this.world.addComponent(entityId, transform);
        
        // 添加Velocity组件
        const velocity = new Velocity(
            new Vec3(Math.random() * 10, 0, 0),
            new Vec3(0, 0, 0)
        );
        this.world.addComponent(entityId, velocity);
        
        // 添加Health组件
        const health = new Health(100, 100);
        this.world.addComponent(entityId, health);
        
        // 添加Tag组件
        const tag = new Tag('test', 'movable');
        this.world.addComponent(entityId, tag);
        
        // 如果有对应的Node，添加Render组件
        // 这里只是示例，实际使用时需要关联实际的Node
        const node = instantiate(this.prefab);
        node.setParent(this.node);
        const render = new Render(node);
        this.world.addComponent(entityId, render);
        
        return entityId;
    }
    
    /**
     * 测试：给实体造成伤害
     */
    public testDamageEntity(entityIndex: number = 0, damage: number = 20): void {
        if (entityIndex >= this.testEntities.length) {
            console.warn(`实体索引 ${entityIndex} 超出范围`);
            return;
        }
        
        const entityId = this.testEntities[entityIndex];
        const health = this.world.getComponent<Health>(entityId, 'Health');
        
        if (health) {
            const actualDamage = health.takeDamage(damage);
            console.log(`实体 ${entityId} 受到 ${actualDamage} 点伤害，当前生命值: ${health.current}/${health.max}`);
        }
    }
    
    /**
     * 测试：修改实体速度
     */
    public testChangeVelocity(entityIndex: number = 0, speed: number = 5): void {
        if (entityIndex >= this.testEntities.length) {
            console.warn(`实体索引 ${entityIndex} 超出范围`);
            return;
        }
        
        const entityId = this.testEntities[entityIndex];
        const velocity = this.world.getComponent<Velocity>(entityId, 'Velocity');
        
        if (velocity) {
            velocity.linear.set(speed, 0, speed);
            console.log(`实体 ${entityId} 速度已修改为:`, velocity.linear);
        }
    }
    
    /**
     * 测试：查询实体
     */
    public testQueryEntities(): void {
        // 查询所有拥有Health组件的实体
        const healthEntities = this.world.queryEntities('Health');
        console.log(`拥有Health组件的实体数量: ${healthEntities.length}`);
        
        // 查询所有拥有Transform和Velocity组件的实体
        const movableEntities = this.world.queryEntities('Transform', 'Velocity');
        console.log(`可移动的实体数量: ${movableEntities.length}`);
        
        // 查询所有拥有Tag组件的实体
        const taggedEntities = this.world.queryEntities('Tag');
        console.log(`拥有Tag组件的实体数量: ${taggedEntities.length}`);
    }
    
    /**
     * 测试：销毁实体
     */
    public testDestroyEntity(entityIndex: number = 0): void {
        if (entityIndex >= this.testEntities.length) {
            console.warn(`实体索引 ${entityIndex} 超出范围`);
            return;
        }
        
        const entityId = this.testEntities[entityIndex];
        this.world.destroyEntity(entityId);
        this.testEntities.splice(entityIndex, 1);
        console.log(`实体 ${entityId} 已销毁`);
    }
    
    /**
     * 打印统计信息
     */
    public printStats(): void {
        const stats = this.world.getStats();
        console.log('ECS统计信息:', stats);
    }
    
    onDestroy(): void {
        // 清理ECS世界
        this.world.clear();
    }
}
