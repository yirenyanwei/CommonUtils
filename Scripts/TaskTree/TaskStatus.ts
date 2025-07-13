/**
 * Task的基础状态码
 */

export enum TaskStatus {
     // 初始状态，尚未运行过；也可命名 Unstarted
     New = 0,
     // 运行中
     Running = 1,
     // 执行成功
     Success = 2,
     // 执行失败
     Failed =3,
}