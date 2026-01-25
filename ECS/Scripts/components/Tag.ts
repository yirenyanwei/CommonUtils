/**
 * 标签组件
 * 用于给实体打标签，方便查询和分类
 */

import { IComponent } from '../core/types';

/**
 * 标签组件
 */
export class Tag implements IComponent {
    readonly type = 'Tag';
    
    public tags: Set<string> = new Set();
    
    constructor(...tags: string[]) {
        tags.forEach(tag => this.tags.add(tag));
    }
    
    /**
     * 添加标签
     */
    public addTag(tag: string): void {
        this.tags.add(tag);
    }
    
    /**
     * 移除标签
     */
    public removeTag(tag: string): void {
        this.tags.delete(tag);
    }
    
    /**
     * 检查是否有标签
     */
    public hasTag(tag: string): boolean {
        return this.tags.has(tag);
    }
    
    /**
     * 检查是否有任意一个标签
     */
    public hasAnyTag(...tags: string[]): boolean {
        return tags.some(tag => this.tags.has(tag));
    }
    
    /**
     * 检查是否有所有标签
     */
    public hasAllTags(...tags: string[]): boolean {
        return tags.every(tag => this.tags.has(tag));
    }
}

