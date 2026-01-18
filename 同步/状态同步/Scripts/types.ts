/**
 * 状态同步框架类型定义
 */

import { Vec3, Quat } from 'cc';

/**
 * 操作类型
 */
export enum ActionType {
    MOVE = 1,           // 移动
    ATTACK = 2,         // 攻击
    SKILL = 3,          // 技能
    JUMP = 4,           // 跳跃
    CUSTOM = 100        // 自定义操作
}

/**
 * 玩家操作
 */
export interface PlayerAction {
    actionId: string;           // 操作ID（用于去重）
    entityId: string;           // 实体ID
    actionType: ActionType;     // 操作类型
    data: any;                  // 操作数据
    timestamp: number;          // 客户端时间戳
}

/**
 * 实体状态
 */
export interface EntityState {
    id: string;                 // 实体ID
    position: Vec3;            // 位置
    rotation: Quat;            // 旋转
    velocity?: Vec3;            // 速度（可选）
    [key: string]: any;        // 其他自定义状态
}

/**
 * 游戏状态快照
 */
export interface GameState {
    frameIndex: number;         // 帧索引
    timestamp: number;          // 服务器时间戳
    entities: Map<string, EntityState>; // 实体状态映射
}

/**
 * 状态同步状态
 */
export enum StateSyncState {
    IDLE = 0,           // 空闲
    CONNECTING = 1,     // 连接中
    CONNECTED = 2,      // 已连接
    SYNCING = 3,        // 同步中
    DISCONNECTED = 4,   // 已断开
}

/**
 * 状态同步配置
 */
export interface StateSyncConfig {
    syncRate: number;              // 同步频率（Hz），默认20
    enablePrediction: boolean;     // 启用客户端预测，默认true
    enableInterpolation: boolean;   // 启用状态插值，默认true
    maxStateHistory: number;        // 最大状态历史数量，默认3
    serverAuthority: boolean;       // 服务器权威模式，默认true
}

/**
 * 状态同步事件类型
 */
export enum StateSyncEvent {
    STATE_UPDATE = 'state_update',         // 状态更新
    ACTION_SENT = 'action_sent',           // 操作已发送
    ACTION_CONFIRMED = 'action_confirmed', // 操作已确认
    PREDICTION_MISMATCH = 'prediction_mismatch', // 预测不匹配
    ENTITY_ADDED = 'entity_added',        // 实体添加
    ENTITY_REMOVED = 'entity_removed',    // 实体移除
    STATE_CHANGED = 'state_changed',      // 状态改变
}

/**
 * 预测状态
 */
export interface PredictionState {
    actionId: string;             // 操作ID
    predictedState: EntityState;  // 预测的状态
    timestamp: number;            // 预测时间戳
}

