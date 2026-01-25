/**
 * 速度组件
 * 用于存储实体的速度信息
 */

import { IComponent } from '../core/types';
import { Vec3 } from 'cc';

/**
 * 速度组件
 */
export class Velocity implements IComponent {
    readonly type = 'Velocity';
    
    public linear: Vec3 = new Vec3(0, 0, 0);  // 线性速度
    public angular: Vec3 = new Vec3(0, 0, 0); // 角速度
    
    constructor(linear?: Vec3, angular?: Vec3) {
        if (linear) {
            this.linear.set(linear);
        }
        if (angular) {
            this.angular.set(angular);
        }
    }
}

