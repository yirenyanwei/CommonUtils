/**
 * 大地图分层与格子数据。
 * Tile 为具体 class，可通过继承 + 每层工厂在 BigMapModel 中挂载子类实例。
 */

export enum BigMapLayer {
    Ground = 0,
    Collision = 1,
    Building = 2,
    Effect = 3,
}

/**
 * 地图单格数据基类。
 *
 * 扩展方式：
 * 1. 继承 Tile，增加字段并重写 onReset / onCopyFrom（必要时重写 clone）。
 * 2. 在 new BigMapModel(w, h, { [BigMapLayer.Building]: () => new MyBuildingTile() }) 里为对应层提供工厂。
 * 3. 轻量扩展也可用 flags / meta / userData，无需子类。
 *
 * @example
 * class BuildingTile extends Tile {
 *   level = 0;
 *   protected onReset(): void { super.onReset(); this.level = 0; }
 *   protected onCopyFrom(other: Tile): void {
 *     if (other instanceof BuildingTile) this.level = other.level;
 *   }
 * }
 */
export class Tile {
    /** 图块 / Tiled GID 等主 id */
    public tileId: number = 0;

    /** 位标记，自定义语义（可走掩码、翻转等） */
    public flags: number = 0;

    /** 数值型扩展（等级、血量、实例 id 等） */
    public meta: number = 0;

    /** 引用型扩展（配置 key、弱引用对象等）；子类可改为强类型字段 */
    public userData: unknown = null;

    /**
     * 是否阻挡移动。默认：Collision 层用 tileId !== 0 表示挡格；
     * 其他层若也要参与阻挡，可在子类中结合 flags 重写。
     */
    public blocksMovement(): boolean {
        return this.tileId !== 0;
    }

    /** 回默认状态（对象池、清层、加载前可调用） */
    public reset(): void {
        this.tileId = 0;
        this.flags = 0;
        this.meta = 0;
        this.userData = null;
        this.onReset();
    }

    /** 子类释放自定义字段 */
    protected onReset(): void {}

    /** 从另一格拷贝数据 */
    public copyFrom(other: Tile): void {
        this.tileId = other.tileId;
        this.flags = other.flags;
        this.meta = other.meta;
        this.userData = other.userData;
        this.onCopyFrom(other);
    }

    /** 子类拷贝自定义字段时重写（务必处理非本类实例） */
    protected onCopyFrom(_other: Tile): void {}

    /** 深拷贝当前格（默认用构造函数创建同类实例） */
    public clone(): Tile {
        const Ctor = this.constructor as new () => Tile;
        const t = new Ctor();
        t.copyFrom(this);
        return t;
    }
}

/** 每层创建 Tile 的工厂（可返回子类） */
export type TileFactory = () => Tile;

/** @deprecated 请使用 Tile */
export type BigMapTile = Tile;
