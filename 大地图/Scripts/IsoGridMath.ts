import { Vec2, Vec3, v2, v3 } from 'cc';

/**
 * 2:1 等距菱形瓦片：逻辑格 (gx, gy) ↔ 世界坐标（地图根节点局部空间）
 * 图块宽 tw、高 th（最终方案：128 x 64）
 */
export class IsoGridMath {
    constructor(
        public tileWidth: number = 128,
        public tileHeight: number = 64,
    ) {}

    public gridToWorld(gx: number, gy: number, out?: Vec3): Vec3 {
        const halfW = this.tileWidth * 0.5;
        const halfH = this.tileHeight * 0.5;
        const x = (gx - gy) * halfW;
        const y = (gx + gy) * halfH;
        if (out) {
            out.set(x, y, 0);
            return out;
        }
        return v3(x, y, 0);
    }

    /**
     * 世界坐标 → 逻辑格索引（逆变换：gx = (x/hw + y/hh)/2, gy = (y/hh - x/hw)/2）
     */
    public worldToGrid(wx: number, wy: number, out?: Vec2): Vec2 {
        const halfW = this.tileWidth * 0.5;
        const halfH = this.tileHeight * 0.5;
        const gx = (wx / halfW + wy / halfH) * 0.5;
        const gy = (wy / halfH - wx / halfW) * 0.5;
        const ix = Math.floor(gx + 1e-6);
        const iy = Math.floor(gy + 1e-6);
        if (out) {
            out.set(ix, iy);
            return out;
        }
        return v2(ix, iy);
    }

    /** 地图四角格点在世界中的包围盒（用于相机边界） */
    public mapWorldBounds(mapWidth: number, mapHeight: number): { minX: number; maxX: number; minY: number; maxY: number } {
        const corners = [
            this.gridToWorld(0, 0),
            this.gridToWorld(mapWidth - 1, 0),
            this.gridToWorld(0, mapHeight - 1),
            this.gridToWorld(mapWidth - 1, mapHeight - 1),
        ];
        let minX = corners[0].x;
        let maxX = corners[0].x;
        let minY = corners[0].y;
        let maxY = corners[0].y;
        for (let i = 1; i < corners.length; i++) {
            const c = corners[i];
            minX = Math.min(minX, c.x);
            maxX = Math.max(maxX, c.x);
            minY = Math.min(minY, c.y);
            maxY = Math.max(maxY, c.y);
        }
        const padX = this.tileWidth * 0.5;
        const padY = this.tileHeight * 0.5;
        return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
    }
}
