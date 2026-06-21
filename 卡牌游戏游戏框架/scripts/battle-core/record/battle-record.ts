/*
 * @Desc: 战斗记录。逻辑层产出一份"帧序列"，表现层据此逐帧回放，服务器据此校验
 */
import { BattleResult, Camp } from '../config/config-types';

/** 帧类型 */
export enum FrameType {
    /** 战斗开始，携带 snapshot（全体武将初始数据），表现层据此创建武将节点 */
    BATTLE_START = 'BATTLE_START',
    /** 新回合开始，携带 round 编号 */
    ROUND_START = 'ROUND_START',
    /** 某武将本回合开始出手（含 Buff 触发结算入口） */
    TURN_START = 'TURN_START',
    /** 武将释放技能，携带 casterId / skillId / skillName，表现层播施法动作 */
    SKILL_CAST = 'SKILL_CAST',
    /** 玩家独立主动技能释放（非武将技能），携带 casterId / skillId / skillName */
    PLAYER_SKILL_CAST = 'PLAYER_SKILL_CAST',
    /** 伤害落地，携带 value（总伤）/ absorbed（护盾吸收）/ isCrit / hpAfter */
    DAMAGE = 'DAMAGE',
    /** 治疗落地，携带 value（实际回复量）/ hpAfter */
    HEAL = 'HEAL',
    /** 目标获得 Buff，携带 buffId / buffName / stacks */
    BUFF_ADD = 'BUFF_ADD',
    /** 目标身上某 Buff 到期或被驱散移除，携带 buffId / buffName */
    BUFF_REMOVE = 'BUFF_REMOVE',
    /** 武将能量变化（普攻回能 / 大招消耗），携带 casterId / energyAfter，表现层更新能量条 */
    ENERGY_CHANGE = 'ENERGY_CHANGE',
    /** 武将阵亡，携带 targetId，表现层播死亡动画 */
    DEATH = 'DEATH',
    /** 战斗结束，携带 result（ALLY_WIN / ENEMY_WIN / DRAW）*/
    BATTLE_END = 'BATTLE_END',
}

/** 单个武将的初始快照，供表现层创建节点 */
export interface HeroSnapshot {
    instanceId: number;
    configId: string;
    name: string;
    camp: Camp;
    position: number;
    maxHp: number;
    hp: number;
    atk: number;
    def: number;
    speed: number;
    maxEnergy: number;
    energy: number;
}

/** 战斗初始快照 */
export interface BattleSnapshot {
    seed: number;
    heroes: HeroSnapshot[];
    playerMaxEnergy: number;
    playerEnergy: number;
}

/** 一帧战斗记录 */
export interface BattleFrame {
    type: FrameType;
    round?: number;
    /** 施法者/行动者实例 id */
    casterId?: number;
    /** 目标实例 id */
    targetId?: number;
    skillId?: string;
    skillName?: string;
    /** 伤害/治疗/能量数值 */
    value?: number;
    /** 被护盾吸收的伤害量 */
    absorbed?: number;
    isCrit?: boolean;
    /** 数值结算后目标剩余血量 */
    hpAfter?: number;
    /** 数值结算后能量 */
    energyAfter?: number;
    buffId?: string;
    buffName?: string;
    stacks?: number;
    result?: BattleResult;
    snapshot?: BattleSnapshot;
}

export class BattleRecorder {
    readonly frames: BattleFrame[] = [];

    add(frame: BattleFrame): void {
        this.frames.push(frame);
    }
}
