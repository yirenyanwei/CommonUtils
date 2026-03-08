import { BehaviorNode } from "./BehaviorNode";
import { BehaviorStatus } from "./BehaviorStatus";

/**
 * 装饰节点基类（Decorator）
 * 装饰节点只能有一个子节点，用于修改子节点的行为
 */
export abstract class Decorator extends BehaviorNode {
    protected child: BehaviorNode | null = null;

    constructor(name: string = "Decorator") {
        super(name);
    }

    /**
     * 装饰节点只能有一个子节点
     */
    public addChild(child: BehaviorNode): void {
        if (this.child !== null) {
            console.warn(`Decorator ${this.name} already has a child. Replacing it.`);
        }
        child.setParent(this);
        this.child = child;
    }

    public removeChild(child: BehaviorNode): boolean {
        if (this.child === child) {
            this.child.setParent(null);
            this.child = null;
            return true;
        }
        return false;
    }

    public getChildCount(): number {
        return this.child !== null ? 1 : 0;
    }

    public getChild(index: number): BehaviorNode {
        if (index === 0 && this.child !== null) {
            return this.child;
        }
        throw new Error("Invalid child index");
    }

    public reset(): void {
        super.reset();
        if (this.child) {
            this.child.reset();
        }
    }
}
