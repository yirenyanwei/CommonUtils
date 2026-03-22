import { Camera, UITransform, Vec3, v3, view } from 'cc';
import { BigMapLayer } from './BigMapTypes';
import { BigMapModel } from './BigMapModel';
import { IsoGridMath } from './IsoGridMath';
import { PooledTile, TileVisualPool } from './TileVisualPool';

/**
 * 视口流式：仅维护当前视野（+ margin）内的地表/建筑节点；策略模式的数据源即 BigMapModel（可替换为磁盘 chunk）。
 */
export class BigMapViewportStreamer {
    public marginTiles = 3;

    private readonly _model: BigMapModel;
    private readonly _iso: IsoGridMath;
    private readonly _cam: Camera;
    private readonly _mapUi: UITransform;
    private readonly _groundPool: TileVisualPool;
    private readonly _buildingPool: TileVisualPool;
    private readonly _tmp: Vec3 = v3();

    private readonly _activeGround = new Map<string, PooledTile>();
    private readonly _activeBuilding = new Map<string, PooledTile>();

    constructor(
        model: BigMapModel,
        iso: IsoGridMath,
        cam: Camera,
        mapUi: UITransform,
        groundPool: TileVisualPool,
        buildingPool: TileVisualPool,
    ) {
        this._model = model;
        this._iso = iso;
        this._cam = cam;
        this._mapUi = mapUi;
        this._groundPool = groundPool;
        this._buildingPool = buildingPool;
    }

    private static key(layer: string, x: number, y: number): string {
        return `${layer}:${x},${y}`;
    }

    /** 根据当前摄像机刷新可见瓦片 */
    public sync(): void {
        const minGx = 0;
        const minGy = 0;
        const maxGx = this._model.width - 1;
        const maxGy = this._model.height - 1;

        const vis = this._computeVisibleGridRect();
        const g0 = Math.max(minGx, vis.minX - this.marginTiles);
        const g1 = Math.min(maxGx, vis.maxX + this.marginTiles);
        const h0 = Math.max(minGy, vis.minY - this.marginTiles);
        const h1 = Math.min(maxGy, vis.maxY + this.marginTiles);

        const wantG = new Set<string>();
        const wantB = new Set<string>();

        for (let gy = h0; gy <= h1; gy++) {
            for (let gx = g0; gx <= g1; gx++) {
                wantG.add(BigMapViewportStreamer.key('g', gx, gy));
                const bid = this._model.getTileId(BigMapLayer.Building, gx, gy);
                if (bid !== 0) {
                    wantB.add(BigMapViewportStreamer.key('b', gx, gy));
                }
            }
        }

        this._diffLayer(this._activeGround, wantG, BigMapLayer.Ground, this._groundPool);
        this._diffLayer(this._activeBuilding, wantB, BigMapLayer.Building, this._buildingPool);
    }

    private _diffLayer(
        active: Map<string, PooledTile>,
        want: Set<string>,
        layer: BigMapLayer,
        pool: TileVisualPool,
    ): void {
        for (const [k, h] of active) {
            if (!want.has(k)) {
                pool.release(h);
                active.delete(k);
            }
        }
        for (const k of want) {
            if (active.has(k)) continue;
            const parts = k.split(':');
            const coords = parts[1].split(',');
            const gx = parseInt(coords[0], 10);
            const gy = parseInt(coords[1], 10);
            const tileId = this._model.getTileId(layer, gx, gy);
            if (layer === BigMapLayer.Building && tileId === 0) continue;

            const pos = this._iso.gridToWorld(gx, gy, this._tmp);
            const sortKey = gx + gy;
            const handle = pool.acquire(k, pos, sortKey);
            pool.applyVisual(handle.node, tileId);
            active.set(k, handle);
        }
    }

    /**
     * 将屏幕可见区域投到地图平面，取包围格矩形（逻辑格索引）
     */
    private _computeVisibleGridRect(): { minX: number; maxX: number; minY: number; maxY: number } {
        const cam = this._cam;
        const ui = this._mapUi;
        const rect = view.getViewportRect();
        const corners = [
            cam.screenToWorld(v3(rect.x, rect.y, 0)),
            cam.screenToWorld(v3(rect.x + rect.width, rect.y, 0)),
            cam.screenToWorld(v3(rect.x, rect.y + rect.height, 0)),
            cam.screenToWorld(v3(rect.x + rect.width, rect.y + rect.height, 0)),
        ];

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const wc of corners) {
            const local = ui.convertToNodeSpaceAR(wc);
            const g = this._iso.worldToGrid(local.x, local.y);
            minX = Math.min(minX, g.x);
            maxX = Math.max(maxX, g.x);
            minY = Math.min(minY, g.y);
            maxY = Math.max(maxY, g.y);
        }

        if (!Number.isFinite(minX)) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        }
        return { minX, maxX, minY, maxY };
    }

    public clear(): void {
        for (const h of this._activeGround.values()) this._groundPool.release(h);
        for (const h of this._activeBuilding.values()) this._buildingPool.release(h);
        this._activeGround.clear();
        this._activeBuilding.clear();
    }
}
