import { v2, Vec2 } from "cc";
import { INavNode } from "./types-map";


class TMAStarPoint {
    public x: number = 0;
    public y: number = 0;
    // 起点cost
    public g: number = 0;
    // 终点预期cost
    public h: number = 0;
    public par: TMAStarPoint | null = null;
    constructor(x: number, y: number, g: number, h: number, par: TMAStarPoint | null = null) {
        this.x = x;
        this.y = y;
        this.g = g;
        this.h = h;
        this.par = par;
    }
    public get f() {
        return this.g + this.h;
    }
}

export class TMAStar {
    /**
     * 前提条件
     * 搜索方向
     * 0: 偶数行
     * 1: 奇数行
     */
    public static readonly DIR = [
        [[0,-1], [1, 0], [0, 1], [-1, 0]],// 上右下左
        [[0,-1], [1, 0], [0, 1], [-1, 0]],// 上右下左
    ];

    private static row: number = 0;
    private static col: number = 0;
    private static map: Array<Array<boolean>> = null!;

    // ZYZ TODO 使用优先队列优化
    private static open: TMAStarPoint[] = [];
    private static close: TMAStarPoint[] = [];

    private static _calDis(sx: number, sy: number, ex: number, ey: number): number {
        return Math.abs(ex - sx) + Math.abs(ey - sy);
    }

    private static _inOpen(x: number, y: number): number {
        for (let i = 0; i < this.open.length; i++) {
            if (this.open[i].x === x && this.open[i].y === y) return i;
        }
        return -1;
    }

    private static _inClose(x: number, y: number): number {
        for (let i = 0; i < this.close.length; i++) {
            if (this.close[i].x === x && this.close[i].y === y) return i;
        }
        return -1;
    }

    private static _isValid(x: number, y: number, skipPoints: Vec2[] = []): boolean {
        if (x < 0 || x >= this.row || y < 0 || y >= this.col) return false;
        if (this._inClose(x, y) !== -1) return false;
        for (const p of skipPoints) {
            if (p.x === x && p.y === y) return true;
        }
        if (!this.map[x][y]) return false;
        return true;
    }

    private static _getMinFFromOpen(): TMAStarPoint | null {
        if (this.open.length === 0) return null;
        let op: TMAStarPoint = this.open[0];
        for (let i = 1; i < this.open.length; i++) {
            if (this.open[i].f < op.f) op = this.open[i];
        }
        this.open.forEach((item, index) => {
            if (item === op) this.open.splice(index, 1);
        })
        return op;
    }

    private static initMap(map: boolean[][]) {
        this.map = map;
        this.row = this.map.length;
        this.col = this.map[0].length;
    }

    public static AStar(map: boolean[][], sx: number, sy: number, ex: number, ey: number, judgeTerminal: boolean = false, skipPoints: Vec2[] = []): Vec2[] {
        this.initMap(map);

        const path: Vec2[] = [];

        this.open = [];
        this.close = [];
        this.open.push(new TMAStarPoint(sx, sy, 0, this._calDis(sx, sy, ex, ey)));
        while (this.open.length > 0) {
            // 取出F最小的点
            const op = this._getMinFFromOpen()!;
            // 到达终点，判断终点是否可行
            if (op.x === ex && op.y === ey) {
                let pp: TMAStarPoint | null = op;
                while (pp !== null) {
                    path.unshift(v2(pp.x, pp.y));
                    pp = pp.par;
                }
                break;
            }
            this.close.push(op);
            for (const d of this.DIR[op.x & 1]) {
                const nx = op.x + d[0];
                const ny = op.y + d[1];
                // 到达终点，不判断终点是否可行
                if (!judgeTerminal) {
                    if (nx === ex && ny === ey) {
                        path.unshift(v2(ex, ey));
                        let pp: TMAStarPoint | null = op;
                        while (pp !== null) {
                            path.unshift(v2(pp.x, pp.y));
                            pp = pp.par;
                        }
                        return path;
                    }
                }
                if (!this._isValid(nx, ny, skipPoints)) continue;
                const idx = this._inOpen(nx, ny);
                if (idx !== -1) {
                    // 在开放列表中 更新
                    if (op.g + 1 < this.open[idx].g) {
                        this.open[idx].g = op.g + 1;
                        this.open[idx].par = op;
                    }
                } else {
                    this.open.push(new TMAStarPoint(nx, ny, op.g + 1, this._calDis(nx, ny, ex, ey), op));
                }
            }
        }
        return path;
    }
}

export class TMAStar2 {
    /**
     * 前提条件
     * 搜索方向
     * 0: 偶数行
     * 1: 奇数行
     */
    public static readonly DIR = [
        [[-1, -1], [0, -1], [1, -1], [1, 0], [0, 1], [-1, 0]],
        [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [0, -1]],
    ];

    private static row: number = 0;
    private static col: number = 0;
    private static navPath: Array<Array<INavNode>> = null!;

    // ZYZ TODO 使用优先队列优化
    private static open: TMAStarPoint[] = [];
    private static close: TMAStarPoint[] = [];

    private static _calDis(sx: number, sy: number, ex: number, ey: number): number {
        return Math.abs(ex - sx) + Math.abs(ey - sy);
    }

    private static _inOpen(x: number, y: number): number {
        for (let i = 0; i < this.open.length; i++) {
            if (this.open[i].x === x && this.open[i].y === y) return i;
        }
        return -1;
    }

    private static _inClose(x: number, y: number): number {
        for (let i = 0; i < this.close.length; i++) {
            if (this.close[i].x === x && this.close[i].y === y) return i;
        }
        return -1;
    }

    private static _isValid(x: number, y: number, skipPoints: Vec2[] = [], advPoints: Vec2[] = []): boolean {
        if (x < 0 || x >= this.row || y < 0 || y >= this.col) return false;
        if (this._inClose(x, y) !== -1) return false;
        for (const p of skipPoints) {
            if (p.x === x && p.y === y) return true;
        }
        for (const p of advPoints) {
            if (p.x === x && p.y === y) return false;
        }
        if (!this.navPath[x][y].passable) return false;
        return true;
    }

    private static _getMinFFromOpen(): TMAStarPoint | null {
        if (this.open.length === 0) return null;
        let op: TMAStarPoint = this.open[0];
        for (let i = 1; i < this.open.length; i++) {
            if (this.open[i].f < op.f) op = this.open[i];
        }
        this.open.forEach((item, index) => {
            if (item === op) this.open.splice(index, 1);
        })
        return op;
    }

    private static initMap(map: INavNode[][]) {
        this.navPath = map;
        this.row = this.navPath.length;
        this.col = this.navPath[0].length;
    }

    public static AStar(map: INavNode[][], sx: number, sy: number, ex: number, ey: number, judgeTerminal: boolean = false, skipPoints: Vec2[] = [], advPoint: Vec2[] = []): Vec2[] {
        this.initMap(map);

        const path: Vec2[] = [];

        this.open = [];
        this.close = [];
        this.open.push(new TMAStarPoint(sx, sy, 0, this._calDis(sx, sy, ex, ey)));
        while (this.open.length > 0) {
            const op = this._getMinFFromOpen()!;
            // 到达终点，判断终点是否可行
            if (op.x === ex && op.y === ey) {
                let pp: TMAStarPoint | null = op;
                while (pp !== null) {
                    path.unshift(v2(pp.x, pp.y));
                    pp = pp.par;
                }
                break;
            }
            this.close.push(op);
            for (const d of this.DIR[op.x & 1]) {
                const nx = op.x + d[0];
                const ny = op.y + d[1];
                // 到达终点，不判断终点是否可行
                if (!judgeTerminal) {
                    if (nx === ex && ny === ey) {
                        path.unshift(v2(ex, ey));
                        let pp: TMAStarPoint | null = op;
                        while (pp !== null) {
                            path.unshift(v2(pp.x, pp.y));
                            pp = pp.par;
                        }
                        return path;
                    }
                }
                if (!this._isValid(nx, ny, skipPoints, advPoint)) continue;
                const idx = this._inOpen(nx, ny);
                if (idx !== -1) {
                    if (op.g + 1 < this.open[idx].g) {
                        this.open[idx].g = op.g + 1;
                        this.open[idx].par = op;
                    }
                } else {
                    this.open.push(new TMAStarPoint(nx, ny, op.g + 1, this._calDis(nx, ny, ex, ey), op));
                }
            }
        }
        return path;
    }
}