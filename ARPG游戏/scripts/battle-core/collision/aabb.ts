// ============================================================
// AABB — 轴对齐矩形碰撞工具（纯函数，无状态）
// ============================================================

export interface AABB {
    x: number;      // 左边缘
    y: number;      // 下边缘（逻辑坐标 Y 轴向上）
    width: number;
    height: number;
}

/** 两个矩形是否相交 */
export function aabbOverlap(a: AABB, b: AABB): boolean {
    return !(
        a.x + a.width  <= b.x ||
        b.x + b.width  <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y
    );
}

/** 根据实体位置（中心-底部）和偏移量构建 AABB */
export function buildAABB(
    centerX: number,
    baseY: number,
    width: number,
    height: number,
    offsetX: number = 0,
    offsetY: number = 0,
): AABB {
    return {
        x: centerX - width / 2 + offsetX,
        y: baseY + offsetY,
        width,
        height,
    };
}
