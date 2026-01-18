/**
 * 帧同步框架类型定义（简化版 - 单玩家本地）
 */

/**
 * 玩家输入类型
 */
export enum InputType {
    MOVE = 1,           // 移动
    ATTACK = 2,         // 攻击
    SKILL = 3,          // 技能
    JUMP = 4,           // 跳跃
    CUSTOM = 100        // 自定义输入
}

/**
 * 玩家输入数据
 */
export interface PlayerInput {
    frameIndex: number;          // 帧索引
    inputType: InputType;        // 输入类型
    data: any;                   // 输入数据（具体内容由游戏逻辑定义）
}

/**
 * 帧同步状态
 */
export enum FrameSyncState {
    IDLE = 0,           // 空闲
    RUNNING = 1,        // 运行中
    PAUSED = 2,         // 暂停
}

/**
 * 帧同步配置
 */
export interface FrameSyncConfig {
    logicFrameRate: number;      // 逻辑帧率（FPS），默认60
    enableInterpolation: boolean; // 是否启用渲染插值，默认true
}

/**
 * 帧同步事件类型
 */
export enum FrameSyncEvent {
    LOGIC_FRAME_START = 'logic_frame_start',   // 逻辑帧开始
    LOGIC_FRAME_END = 'logic_frame_end',       // 逻辑帧结束
    RENDER_FRAME = 'render_frame',             // 渲染帧（用于插值）
    STATE_CHANGED = 'state_changed',           // 状态改变
}
