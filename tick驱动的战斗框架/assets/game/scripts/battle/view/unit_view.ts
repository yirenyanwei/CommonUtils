import { Label, Node, Vec3 } from "cc";
import { BattleVector } from "../data/battle_config";

export class UnitView {
    readonly node: Node;

    constructor(name: string, parent: Node, position: BattleVector) {
        this.node = new Node(name);
        this.node.parent = parent;
        const label = this.node.addComponent(Label);
        label.string = name;
        label.fontSize = 18;
        this.setPosition(position);
    }

    setPosition(position: BattleVector): void {
        this.node.setPosition(new Vec3(position.x, position.y, 0));
    }

    destroy(): void {
        this.node.destroy();
    }
}
