import { Color, instantiate, Label, Node, Prefab, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { ObjectPool } from '../../ECS/Scripts/utils/ObjectPool';

export type PooledTile = {
    node: Node;
    key: string;
};

/**
 * 瓦片节点对象池：优先复用节点，减少 instantiate/destroy。
 */
export class TileVisualPool {
    private readonly _pool: ObjectPool<Node>;
    private readonly _parent: Node;
    private readonly _prefab: Prefab | null;
    private readonly _defaultFrame: SpriteFrame | null;
    private readonly _defaultSize: { w: number; h: number };

    constructor(
        parent: Node,
        prefab: Prefab | null,
        defaultFrame: SpriteFrame | null,
        tileWidth: number,
        tileHeight: number,
        initialSize: number = 32,
    ) {
        this._parent = parent;
        this._prefab = prefab;
        this._defaultFrame = defaultFrame;
        this._defaultSize = { w: tileWidth, h: tileHeight };
        this._pool = new ObjectPool<Node>(
            () => this._createNode(),
            (n) => this._resetNode(n),
            initialSize,
            0,
        );
    }

    private _createNode(): Node {
        let node: Node;
        if (this._prefab) {
            node = instantiate(this._prefab);
        } else {
            node = new Node('TileCell');
            const ui = node.addComponent(UITransform);
            ui.setContentSize(this._defaultSize.w, this._defaultSize.h);
            if (this._defaultFrame) {
                const sp = node.addComponent(Sprite);
                sp.spriteFrame = this._defaultFrame;
            } else {
                const lab = node.addComponent(Label);
                lab.string = '.';
                lab.fontSize = 12;
                lab.lineHeight = 12;
            }
        }
        node.active = false;
        return node;
    }

    private _resetNode(n: Node): void {
        n.removeFromParent();
        n.active = false;
    }

    public acquire(key: string, worldPos: Vec3, sortKey: number): PooledTile {
        const node = this._pool.acquire();
        node.setPosition(worldPos);
        node.active = true;
        node.parent = this._parent;
        const maxIdx = Math.max(0, this._parent.children.length - 1);
        node.setSiblingIndex(Math.min(Math.max(0, sortKey), maxIdx));
        return { node, key };
    }

    public release(handle: PooledTile): void {
        this._pool.release(handle.node);
    }

    public applyVisual(node: Node, tileId: number): void {
        if (this._prefab) return;
        const sp = node.getComponent(Sprite);
        if (sp && !this._defaultFrame) {
            const hue = (tileId * 97) % 360;
            sp.color = new Color(hue / 360, 0.35, 0.85);
        }
        const lab = node.getComponent(Label);
        if (lab) {
            lab.string = tileId > 0 ? String(tileId) : '';
        }
    }
}
