import { GameplayTag } from '../../../data/config-types';

// ============================================================
// GameplayTagContainer — Tag 容器（对齐 UE FGameplayTagContainer）
// 记录当前实体持有的所有 Tag（状态标签）
// ============================================================

export class GameplayTagContainer {
    private readonly tags = new Set<GameplayTag>();

    addTag(tag: GameplayTag): void {
        this.tags.add(tag);
    }

    removeTag(tag: GameplayTag): void {
        this.tags.delete(tag);
    }

    hasTag(tag: GameplayTag): boolean {
        return this.tags.has(tag);
    }

    /** 是否持有 tags 中所有标签 */
    hasAll(tags: GameplayTag[]): boolean {
        return tags.every(t => this.tags.has(t));
    }

    /** 是否持有 tags 中任意一个标签 */
    hasAny(tags: GameplayTag[]): boolean {
        return tags.some(t => this.tags.has(t));
    }

    getAll(): GameplayTag[] {
        return [...this.tags];
    }

    clear(): void {
        this.tags.clear();
    }
}
