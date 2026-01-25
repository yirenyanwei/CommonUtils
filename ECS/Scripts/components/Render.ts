/**
 * 渲染组件
 * 用于存储渲染相关的信息
 */

import { IComponent } from '../core/types';
import { Node } from 'cc';

/**
 * 渲染组件
 */
export class Render implements IComponent {
    readonly type = 'Render';
    
    public node: Node | null = null;  // Cocos Creator节点
    public visible: boolean = true;   // 是否可见
    
    constructor(node?: Node) {
        this.node = node || null;
    }
}

