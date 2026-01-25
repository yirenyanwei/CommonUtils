/**
 * 生命值系统
 * 处理生命值相关的逻辑，如死亡检测
 */

import { ISystem, IWorld, EntityId } from '../core/types';
import { Health } from '../components/Health';
import { Tag } from '../components/Tag';

/**
 * 生命值系统
 */
export class HealthSystem implements ISystem {
    readonly type = 'HealthSystem';
    readonly priority = 200;  // 在移动系统之后执行
    public enabled: boolean = true;
    
    onUpdate(world: IWorld, deltaTime: number): void {
        // 查询所有拥有Health组件的实体
        const entities = world.queryEntities('Health');
        
        for (const entityId of entities) {
            const health = world.getComponent<Health>(entityId, 'Health');
            
            if (!health) {
                continue;
            }
            
            // 检查是否死亡
            if (health.isDead()) {
                // 添加死亡标签
                let tag = world.getComponent<Tag>(entityId, 'Tag');
                if (!tag) {
                    tag = new Tag();
                    world.addComponent(entityId, tag);
                }
                tag.addTag('dead');
                
                // 可以在这里触发死亡事件或执行其他逻辑
                // 例如：world.getSystem<EventSystem>('EventSystem')?.emit('entity_died', entityId);
            }
        }
    }
}

