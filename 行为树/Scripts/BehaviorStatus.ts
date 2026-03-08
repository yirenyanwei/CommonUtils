/**
 * 行为树节点状态枚举
 */
export enum BehaviorStatus {
    /** 初始状态，尚未运行 */
    Inactive = 0,
    /** 运行中 */
    Running = 1,
    /** 执行成功 */
    Success = 2,
    /** 执行失败 */
    Failure = 3,
}
