/*
 * @Desc: 武将运行时实体。属性为纯数据，有效属性 = 基础值经 Buff 修正后的结果
 */
import { AttributeType, Camp } from '../config/config-types';
import { BuffManager } from '../buff/buff-manager';
import { Skill } from '../skill/skill';
import { HeroSnapshot } from '../record/battle-record';

export interface HeroInitParams {
    instanceId: number;
    configId: string;
    name: string;
    camp: Camp;
    position: number;
    maxHp: number;
    atk: number;
    def: number;
    speed: number;
    maxEnergy: number;
    initialEnergy: number;
    skills: Skill[];
}

export class Hero {
    readonly instanceId: number;
    readonly configId: string;
    readonly name: string;
    readonly camp: Camp;
    readonly position: number;
    readonly maxEnergy: number;
    readonly skills: Skill[];
    readonly buffManager = new BuffManager();

    hp: number;
    energy: number;

    private readonly baseMaxHp: number;
    private readonly baseAtk: number;
    private readonly baseDef: number;
    private readonly baseSpeed: number;

    constructor(params: HeroInitParams) {
        this.instanceId = params.instanceId;
        this.configId = params.configId;
        this.name = params.name;
        this.camp = params.camp;
        this.position = params.position;
        this.maxEnergy = params.maxEnergy;
        this.skills = params.skills;
        this.baseMaxHp = params.maxHp;
        this.baseAtk = params.atk;
        this.baseDef = params.def;
        this.baseSpeed = params.speed;
        this.hp = params.maxHp;
        this.energy = params.initialEnergy;
    }

    get alive(): boolean {
        return this.hp > 0;
    }

    get maxHp(): number {
        return this.getAttr(AttributeType.MAX_HP);
    }

    get atk(): number {
        return this.getAttr(AttributeType.ATK);
    }

    get def(): number {
        return this.getAttr(AttributeType.DEF);
    }

    get speed(): number {
        return this.getAttr(AttributeType.SPEED);
    }

    /** 计算经 Buff 修正后的有效属性 */
    getAttr(attribute: AttributeType): number {
        const base = this.getBaseAttr(attribute);
        const { flat, percent } = this.buffManager.getModifier(attribute);
        return Math.max(0, Math.floor(base * (1 + percent) + flat));
    }

    addEnergy(amount: number): void {
        this.energy = Math.max(0, Math.min(this.maxEnergy, this.energy + amount));
    }

    toSnapshot(): HeroSnapshot {
        return {
            instanceId: this.instanceId,
            configId: this.configId,
            name: this.name,
            camp: this.camp,
            position: this.position,
            maxHp: this.maxHp,
            hp: this.hp,
            atk: this.atk,
            def: this.def,
            speed: this.speed,
            maxEnergy: this.maxEnergy,
            energy: this.energy,
        };
    }

    private getBaseAttr(attribute: AttributeType): number {
        switch (attribute) {
            case AttributeType.MAX_HP:
                return this.baseMaxHp;
            case AttributeType.ATK:
                return this.baseAtk;
            case AttributeType.DEF:
                return this.baseDef;
            case AttributeType.SPEED:
                return this.baseSpeed;
            default:
                return 0;
        }
    }
}
