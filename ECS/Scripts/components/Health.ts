/**
 * 生命值组件
 * 用于存储实体的生命值信息
 */

import { IComponent } from '../core/types';

/**
 * 生命值组件
 */
export class Health implements IComponent {
    readonly type = 'Health';
    
    public current: number = 100;
    public max: number = 100;
    
    constructor(max: number = 100, current?: number) {
        this.max = max;
        this.current = current !== undefined ? current : max;
    }
    
    /**
     * 受到伤害
     */
    public takeDamage(amount: number): number {
        const oldHealth = this.current;
        this.current = Math.max(0, this.current - amount);
        return oldHealth - this.current;
    }
    
    /**
     * 恢复生命值
     */
    public heal(amount: number): number {
        const oldHealth = this.current;
        this.current = Math.min(this.max, this.current + amount);
        return this.current - oldHealth;
    }
    
    /**
     * 是否死亡
     */
    public isDead(): boolean {
        return this.current <= 0;
    }
    
    /**
     * 生命值百分比
     */
    public getPercentage(): number {
        return this.max > 0 ? this.current / this.max : 0;
    }
}

