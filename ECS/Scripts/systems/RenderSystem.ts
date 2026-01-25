/**
 * 渲染系统
 * 同步ECS的Transform组件到Cocos Creator的Node节点
 */

import { ISystem, IWorld, EntityId } from '../core/types';
import { Transform } from '../components/Transform';
import { Render } from '../components/Render';

/**
 * 渲染系统
 */
export class RenderSystem implements ISystem {
    readonly type = 'RenderSystem';
    readonly priority = 1000;  // 较低的优先级，在逻辑系统之后执行
    public enabled: boolean = true;
    
    onUpdate(world: IWorld, deltaTime: number): void {
        // 查询所有拥有Transform和Render组件的实体
        const entities = world.queryEntities('Transform', 'Render');
        
        for (const entityId of entities) {
            const transform = world.getComponent<Transform>(entityId, 'Transform');
            const render = world.getComponent<Render>(entityId, 'Render');
            
            if (!transform || !render || !render.node) {
                continue;
            }
            
            // 同步位置
            render.node.setPosition(transform.position);
            
            // 同步旋转
            render.node.setRotation(transform.rotation);
            
            // 同步缩放
            render.node.setScale(transform.scale);
            
            // 同步可见性
            render.node.active = render.visible;
        }
    }
}

