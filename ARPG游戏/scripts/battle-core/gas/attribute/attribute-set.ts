import { AttributeName, AttributeSetConfig } from '../../../data/config-types';

// ============================================================
// AttributeSet — 属性集合（对齐 UE AttributeSet）
// 每个属性有 base（基础值）和 current（当前值）两层。
// GE Modifier 直接修改 current；
// base 不变，用于「驱散 GE 后恢复原值」的逻辑。
// ============================================================

export interface Attribute {
    base: number;
    current: number;
}

export class AttributeSet {
    readonly hp: Attribute;
    readonly maxHp: Attribute;
    readonly mp: Attribute;
    readonly maxMp: Attribute;
    readonly atk: Attribute;
    readonly def: Attribute;
    readonly moveSpeed: Attribute;

    constructor(cfg: AttributeSetConfig) {
        this.maxHp    = { base: cfg.maxHp,    current: cfg.maxHp };
        this.hp       = { base: cfg.maxHp,    current: cfg.maxHp };
        this.maxMp    = { base: cfg.maxMp,    current: cfg.maxMp };
        this.mp       = { base: cfg.maxMp,    current: cfg.maxMp };
        this.atk      = { base: cfg.atk,      current: cfg.atk };
        this.def      = { base: cfg.def,      current: cfg.def };
        this.moveSpeed = { base: cfg.moveSpeed, current: cfg.moveSpeed };
    }

    get(name: AttributeName): Attribute {
        return (this as any)[name] as Attribute;
    }

    getValue(name: AttributeName): number {
        return this.get(name).current;
    }

    /** 修改 current 值，同时 clamp 到合理范围 */
    modifyCurrent(name: AttributeName, delta: number): void {
        const attr = this.get(name);
        attr.current += delta;

        // clamp
        if (name === 'hp')  attr.current = Math.max(0, Math.min(attr.current, this.maxHp.current));
        if (name === 'mp')  attr.current = Math.max(0, Math.min(attr.current, this.maxMp.current));
        if (name === 'moveSpeed') attr.current = Math.max(0, attr.current);
    }

    setCurrent(name: AttributeName, value: number): void {
        const attr = this.get(name);
        attr.current = value;
    }
}
