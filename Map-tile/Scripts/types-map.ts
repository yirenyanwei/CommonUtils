export interface INavNode {
    x: number;
    y: number;
    passable: boolean;
}

/**
 * 地图层枚举
 */
export enum MapLayer {
    /**
     * 数据层
     */
    Data = "data",
    /**
     * 背景层
     */
    BG = "bg",
    /**
     * 数字层
     */
    Num = "num",
}