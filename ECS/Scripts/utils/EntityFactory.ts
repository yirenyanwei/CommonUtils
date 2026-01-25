/**
 * 实体工厂
 * 提供便捷的实体创建方法
 */

import { IWorld, EntityId } from '../core/types';
import { Transform, Velocity, Health, Render, Tag } from '../components';
import { Vec3, Quat, Node } from 'cc';

/**
 * 实体工厂
 */
export class EntityFactory {
    /**
     * 创建一个可移动的实体
     */
    public static createMovableEntity(
        world: IWorld,
        position: Vec3 = new Vec3(0, 0, 0),
        velocity: Vec3 = new Vec3(0, 0, 0)
    ): EntityId {
        const entityId = world.createEntity();
        
        world.addComponent(entityId, new Transform(position));
        world.addComponent(entityId, new Velocity(velocity));
        world.addComponent(entityId, new Tag('movable'));
        
        return entityId;
    }
    
    /**
     * 创建一个有生命值的实体
     */
    public static createLivingEntity(
        world: IWorld,
        position: Vec3 = new Vec3(0, 0, 0),
        maxHealth: number = 100,
        currentHealth?: number
    ): EntityId {
        const entityId = world.createEntity();
        
        world.addComponent(entityId, new Transform(position));
        world.addComponent(entityId, new Health(maxHealth, currentHealth));
        world.addComponent(entityId, new Tag('living'));
        
        return entityId;
    }
    
    /**
     * 创建一个完整的游戏角色实体
     */
    public static createCharacter(
        world: IWorld,
        position: Vec3 = new Vec3(0, 0, 0),
        velocity: Vec3 = new Vec3(0, 0, 0),
        maxHealth: number = 100,
        node?: Node
    ): EntityId {
        const entityId = world.createEntity();
        
        world.addComponent(entityId, new Transform(position));
        world.addComponent(entityId, new Velocity(velocity));
        world.addComponent(entityId, new Health(maxHealth));
        
        if (node) {
            world.addComponent(entityId, new Render(node));
        }
        
        world.addComponent(entityId, new Tag('character', 'movable', 'living'));
        
        return entityId;
    }
    
    /**
     * 创建一个静态实体（只有位置，不可移动）
     */
    public static createStaticEntity(
        world: IWorld,
        position: Vec3 = new Vec3(0, 0, 0),
        node?: Node
    ): EntityId {
        const entityId = world.createEntity();
        
        world.addComponent(entityId, new Transform(position));
        
        if (node) {
            world.addComponent(entityId, new Render(node));
        }
        
        world.addComponent(entityId, new Tag('static'));
        
        return entityId;
    }
}

