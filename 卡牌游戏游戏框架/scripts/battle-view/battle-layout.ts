/*
 * @Desc: 战斗 UI 布局常量（设计分辨率 1334×750，Canvas 锚点居中）
 *       运行时通过 resolveBattleLayout 按 Canvas 实际高度换算，避免固定 halfH 导致 UI 出屏
 */

export const DESIGN = {
    width: 1334,
    height: 750,
    halfW: 667,
    halfH: 375,
} as const;

/** 距屏幕边缘的安全边距 */
const TOP_SAFE = 85;
const BOTTOM_SAFE = 58;

export interface ResolvedBattleLayout {
    halfH: number;
    roundLabelY: number;
    resultLabelY: number;
    heroAllyX: number;
    heroEnemyX: number;
    heroFormationCenterY: number;
    heroRowSpacing: number;
    skillButtonY: number;
    skillEnergyOffsetY: number;
}

/** 按 Canvas 实际高度生成布局（优先于写死的 DESIGN.halfH） */
export function resolveBattleLayout(canvasHeight: number = DESIGN.height): ResolvedBattleLayout {
    const halfH = canvasHeight / 2;
    return {
        halfH,
        roundLabelY: halfH - TOP_SAFE,
        resultLabelY: 0,
        heroAllyX: -270,
        heroEnemyX: 270,
        heroFormationCenterY: 25,
        heroRowSpacing: 165,
        skillButtonY: -halfH + BOTTOM_SAFE + 28,
        skillEnergyOffsetY: 58,
    };
}

/** 默认布局（无 Canvas 信息时的回退） */
export const BattleLayout = resolveBattleLayout(DESIGN.height);

/** 根据站位 1-5 计算武将中心 Y */
export function heroRowY(position: number, layout: ResolvedBattleLayout = BattleLayout): number {
    const centerRow = 2;
    return layout.heroFormationCenterY + (centerRow - position) * layout.heroRowSpacing;
}
