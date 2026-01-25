/**
 * 变换组件
 * 用于存储实体的位置、旋转和缩放信息
 */

import { IComponent } from '../core/types';
import { Vec3, Quat } from 'cc';

/**
 * 变换组件
 */
export class Transform implements IComponent {
    readonly type = 'Transform';
    
    public position: Vec3 = new Vec3(0, 0, 0);
    public rotation: Quat = new Quat();
    public scale: Vec3 = new Vec3(1, 1, 1);
    
    constructor(position?: Vec3, rotation?: Quat, scale?: Vec3) {
        if (position) {
            this.position.set(position);
        }
        if (rotation) {
            this.rotation.set(rotation);
        }
        if (scale) {
            this.scale.set(scale);
        }
    }
}

