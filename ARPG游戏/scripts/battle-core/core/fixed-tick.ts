// ============================================================
// 固定 tick 参数
// 逻辑时间 = tick × FIXED_DT（秒）
// 禁止在战斗逻辑中使用 Date.now() 或帧 dt
// ============================================================

export const TICK_RATE = 20;                    // 逻辑 tick/s
export const FIXED_DT = 1 / TICK_RATE;          // 每 tick 秒数（0.05s）
export const FIXED_DT_MS = FIXED_DT * 1000;     // 每 tick 毫秒数（50ms）

export function tickToSeconds(tick: number): number {
    return tick * FIXED_DT;
}

export function secondsToTick(seconds: number): number {
    return Math.floor(seconds * TICK_RATE);
}
