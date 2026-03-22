import { Vec2, v2 } from 'cc';

interface ANode {
    x: number;
    y: number;
    g: number;
    f: number;
    parent: ANode | null;
}

/**
 * 网格 A*（逻辑四邻接）；带 maxExpand 防止单次搜索过大。
 * 与等距显示无关，寻路在格子索引空间进行。
 */
export class BigMapAStar {
    public static findPath(
        isWalkable: (x: number, y: number) => boolean,
        width: number,
        height: number,
        sx: number,
        sy: number,
        ex: number,
        ey: number,
        maxExpand: number = 50000,
    ): Vec2[] {
        if (!isWalkable(ex, ey) || !isWalkable(sx, sy)) return [];
        if (sx === ex && sy === ey) return [v2(sx, sy)];

        const open: ANode[] = [];
        const openKey = new Map<string, ANode>();
        const closed = new Set<string>();
        const key = (x: number, y: number) => `${x},${y}`;
        const h = (x: number, y: number) => Math.abs(x - ex) + Math.abs(y - ey);

        const start: ANode = { x: sx, y: sy, g: 0, f: h(sx, sy), parent: null };
        open.push(start);
        openKey.set(key(sx, sy), start);

        const dirs = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ];

        let expanded = 0;

        while (open.length > 0) {
            if (++expanded > maxExpand) break;

            let bestI = 0;
            for (let i = 1; i < open.length; i++) {
                if (open[i].f < open[bestI].f) bestI = i;
            }
            const cur = open[bestI];
            open.splice(bestI, 1);
            openKey.delete(key(cur.x, cur.y));
            closed.add(key(cur.x, cur.y));

            if (cur.x === ex && cur.y === ey) {
                const path: Vec2[] = [];
                let n: ANode | null = cur;
                while (n) {
                    path.unshift(v2(n.x, n.y));
                    n = n.parent;
                }
                return path;
            }

            for (const [dx, dy] of dirs) {
                const nx = cur.x + dx;
                const ny = cur.y + dy;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                const k = key(nx, ny);
                if (closed.has(k)) continue;
                if (!isWalkable(nx, ny)) continue;
                const ng = cur.g + 1;
                const nf = ng + h(nx, ny);
                const exist = openKey.get(k);
                if (!exist) {
                    const node: ANode = { x: nx, y: ny, g: ng, f: nf, parent: cur };
                    open.push(node);
                    openKey.set(k, node);
                } else if (ng < exist.g) {
                    exist.g = ng;
                    exist.f = nf;
                    exist.parent = cur;
                }
            }
        }

        return [];
    }
}
