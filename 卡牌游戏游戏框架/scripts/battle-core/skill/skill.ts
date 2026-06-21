/*
 * @Desc: 技能运行时实例。包裹配置并承载实例级状态（如冷却），便于后续扩展
 */
import { SkillConfig } from '../config/config-types';

export class Skill {
    constructor(readonly config: SkillConfig) {}

    get id(): string {
        return this.config.id;
    }

    get name(): string {
        return this.config.name;
    }

    get isUltimate(): boolean {
        return this.config.isUltimate;
    }

    get energyCost(): number {
        return this.config.energyCost;
    }

    get energyGain(): number {
        return this.config.energyGain ?? 0;
    }
}
