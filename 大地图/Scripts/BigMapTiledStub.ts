/**
 * TMX / TiledMap 对接占位：
 * - 方案约定：TMX 仅作数据源解析，不挂整图到场景。
 * - 实现方式二选一：
 *   1) 构建期把 Tiled 导出为 JSON/分片，运行时按 chunk 读取并写入 BigMapModel；
 *   2) 小图可在编辑器放隐藏 TiledMap，启动时用 TiledLayer.getTileGIDAt 扫入 BigMapModel（大图不推荐）。
 *
 * 此处不引入 XML 解析依赖；接入时可在本文件实现 `loadModelFromTiledJson(...)` 等。
 */

import type { BigMapModel } from './BigMapModel';

export interface IBigMapModelLoader {
    load(): Promise<BigMapModel> | BigMapModel;
}
