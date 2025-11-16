import { TiledMap } from "cc";

/**
 * 地图帮助类
 */
export class MapHelper { 
    public static getEnumValues(enumType: any): any[] {
        const values: any[] = [];
        for (const key in enumType) {
            if (enumType.hasOwnProperty(key)) {
                values.push(enumType[key]);
            }
        }
        return values;
    }

    public static getGidTexture(sourceMap: TiledMap, gid: number) {
        return (sourceMap as any)._tmxFile.spriteFrameNames[gid - 1].split(".")[0];
    }
}