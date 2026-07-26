// ============================================================
// 输入指令定义
// 玩家（或 AI）在某一逻辑 tick 发出的操作，带 tick 时间戳，
// 保证同一份输入序列可确定性回放。
// ============================================================

export type InputCommandType =
    | 'Move'
    | 'Jump'
    | 'NormalAttack'
    | 'Skill1'
    | 'Skill2'
    | 'Skill3'
    | 'Pause'
    | 'Resume';

export interface MoveCommand {
    type: 'Move';
    tick: number;
    /** 归一化方向向量，x 范围 [-1,1]，y 范围 [-1,1] */
    dx: number;
    dy: number;
}

export interface JumpCommand {
    type: 'Jump';
    tick: number;
}

export interface NormalAttackCommand {
    type: 'NormalAttack';
    tick: number;
}

export interface SkillCommand {
    type: 'Skill1' | 'Skill2' | 'Skill3';
    tick: number;
}

export interface PauseCommand {
    type: 'Pause' | 'Resume';
    tick: number;
}

export type InputCommand =
    | MoveCommand
    | JumpCommand
    | NormalAttackCommand
    | SkillCommand
    | PauseCommand;
