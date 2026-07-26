import { CharacterConfig, Vec2 } from '../../data/config-types';
import { AbilitySystemComponent } from '../gas/ability-system-component';

// ============================================================
// CharacterEntity — 战斗实体（玩家 / 怪物）
// 持有位置、速度、面向、存活状态，以及 ASC
// ============================================================

export type Team = 'player' | 'enemy';

export class CharacterEntity {
    readonly id: string;
    readonly configId: string;
    readonly team: Team;

    position: Vec2;
    velocity: Vec2 = { x: 0, y: 0 };
    /** 1 = 朝右，-1 = 朝左 */
    facing: 1 | -1 = 1;
    isGrounded: boolean = true;
    isAlive: boolean = true;

    readonly asc: AbilitySystemComponent;

    /** 普攻连招当前段（0 = 第一段） */
    comboIndex: number = 0;
    /** 当前段取消窗口剩余 tick */
    comboCancelTicks: number = 0;
    /** 连击超时计时 */
    comboResetTimer: number = 0;

    constructor(id: string, config: CharacterConfig, team: Team, spawnPos: Vec2) {
        this.id = id;
        this.configId = config.id;
        this.team = team;
        this.position = { ...spawnPos };
        this.asc = new AbilitySystemComponent(config.attributes);
        this.asc.owner = this;

        // 授予普攻 GA
        for (const seg of config.comboConfig.segments) {
            this.asc.grantAbility(seg.abilityId);
        }
        // 授予技能 GA
        for (const id of config.skillAbilityIds) {
            this.asc.grantAbility(id);
        }
    }
}
