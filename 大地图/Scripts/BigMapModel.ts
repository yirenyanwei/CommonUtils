import { BigMapLayer, Tile, TileFactory } from './BigMapTypes';

const ALL_LAYERS: BigMapLayer[] = [
    BigMapLayer.Ground,
    BigMapLayer.Collision,
    BigMapLayer.Building,
    BigMapLayer.Effect,
];

/**
 * 逻辑存储：Map<layer, Tile[][]>，索引为 tile[x][y]（与最终方案一致）。
 * 可通过 factories 为某层提供 Tile 子类实例。
 *
 * 注意：超大地图（如 5000×5000）全量 Tile 对象会占大量内存，届时可改为分块 + 稀疏存储，对外仍暴露 getTile。
 */
export class BigMapModel {
    public readonly width: number;
    public readonly height: number;

    private readonly _layers = new Map<BigMapLayer, Tile[][]>();

    /**
     * @param factories 可选：某层使用自定义 Tile 子类，例如 { [BigMapLayer.Building]: () => new BuildingTile() }
     */
    constructor(width: number, height: number, factories?: Partial<Record<BigMapLayer, TileFactory>>) {
        this.width = width;
        this.height = height;
        const defaultFactory: TileFactory = () => new Tile();
        for (const layer of ALL_LAYERS) {
            const factory = factories?.[layer] ?? defaultFactory;
            this._layers.set(layer, this._createGrid(factory));
        }
    }

    private _createGrid(factory: TileFactory): Tile[][] {
        const grid: Tile[][] = new Array(this.width);
        for (let x = 0; x < this.width; x++) {
            const col: Tile[] = new Array(this.height);
            for (let y = 0; y < this.height; y++) {
                col[y] = factory();
            }
            grid[x] = col;
        }
        return grid;
    }

    private _grid(layer: BigMapLayer): Tile[][] {
        return this._layers.get(layer)!;
    }

    public inBounds(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /** 取格引用，可直接改 tileId / 子类字段（勿整体替换引用） */
    public getTile(layer: BigMapLayer, x: number, y: number): Tile | null {
        if (!this.inBounds(x, y)) return null;
        return this._grid(layer)[x][y];
    }

    public getTileId(layer: BigMapLayer, x: number, y: number): number {
        const t = this.getTile(layer, x, y);
        return t ? t.tileId : 0;
    }

    public setTileId(layer: BigMapLayer, x: number, y: number, id: number): void {
        const t = this.getTile(layer, x, y);
        if (t) t.tileId = id;
    }

    /** 用另一 Tile 的数据覆盖本格（拷贝字段，不替换节点） */
    public setTileFrom(layer: BigMapLayer, x: number, y: number, source: Tile): void {
        const t = this.getTile(layer, x, y);
        if (t) t.copyFrom(source);
    }

    /**
     * 是否可走：由 Collision 层决定；若该格无 Collision 则视为可走。
     */
    public isWalkable(x: number, y: number): boolean {
        const c = this.getTile(BigMapLayer.Collision, x, y);
        if (!c) return false;
        return !c.blocksMovement();
    }

    /** 演示填充：草地 / 水域 / 随机障碍 + 少量建筑占位 */
    public static createDemo(
        width: number,
        height: number,
        seed: number = 1,
        factories?: Partial<Record<BigMapLayer, TileFactory>>,
    ): BigMapModel {
        const m = new BigMapModel(width, height, factories);
        let s = seed;
        const rnd = () => {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const n = rnd();
                let gid = 1;
                if (n < 0.08) gid = 2;
                m.setTileId(BigMapLayer.Ground, x, y, gid);
                const block = rnd() < 0.03 && gid !== 2 ? 1 : 0;
                m.setTileId(BigMapLayer.Collision, x, y, block);
                const b = rnd() < 0.01 && block === 0 ? 1 : 0;
                m.setTileId(BigMapLayer.Building, x, y, b);
            }
        }
        return m;
    }
}
