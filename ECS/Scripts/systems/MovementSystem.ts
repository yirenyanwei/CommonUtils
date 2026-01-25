/**
 * 移动系统
 * 根据速度组件更新位置
 */

import { ISystem, IWorld, EntityId } from '../core/types';
import { Transform } from '../components/Transform';
import { Velocity } from '../components/Velocity';
import { Vec3 } from 'cc';

/**
 * 移动系统
 */
export class MovementSystem implements ISystem {
    readonly type = 'MovementSystem';
    readonly priority = 100;  // 较高的优先级，在其他系统之前执行
    public enabled: boolean = true;
    
    onUpdate(world: IWorld, deltaTime: number): void {
        // 查询所有拥有Transform和Velocity组件的实体
        const entities = world.queryEntities('Transform', 'Velocity');
        
        for (const entityId of entities) {
            const transform = world.getComponent<Transform>(entityId, 'Transform');
            const velocity = world.getComponent<Velocity>(entityId, 'Velocity');
            
            if (!transform || !velocity) {
                continue;
            }
            
            // 更新位置：position += velocity * deltaTime
            Vec3.scaleAndAdd(transform.position, transform.position, velocity.linear, deltaTime);
            
            // 更新旋转（简化处理，实际应该使用四元数）
            // 这里只是示例，实际应用中需要根据angular速度更新rotation
        }
    }
}

