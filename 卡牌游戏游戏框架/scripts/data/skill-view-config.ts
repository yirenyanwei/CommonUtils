/*
 * @Desc: 技能表现配置表（数据驱动 VFX）。表现层按 skillId 查表决定动画/颜色/震屏/音效，
 *        新增技能的独特表现 = 在此加一条配置（+ 摆资源），无需改动 BattlePlayer 代码。
 */

export type CastMotion = 'lunge' | 'scale' | 'shake';

export interface SkillViewConfig {
    /** 施法动作：冲锋 / 缩放 / 抖动 */
    castMotion: CastMotion;
    /** 施法动作时长（秒） */
    castDuration: number;
    /** 命中飘字 / 受击主色 [r,g,b] */
    hitColor: [number, number, number];
    /** 命中是否震屏 */
    shakeOnHit: boolean;
    /** 是否在施法者头顶弹出技能名横幅 */
    banner: boolean;
    /** 音效名（占位，接入音频系统时使用） */
    sfx?: string;
}

const DEFAULT_VIEW: SkillViewConfig = {
    castMotion: 'scale',
    castDuration: 0.35,
    hitColor: [255, 90, 90],
    shakeOnHit: false,
    banner: false,
};

const SKILL_VIEW_TABLE: Record<string, Partial<SkillViewConfig>> = {
    normal_attack: { castMotion: 'lunge', castDuration: 0.3, hitColor: [255, 120, 90] },
    warrior_cleave: { castMotion: 'shake', castDuration: 0.45, hitColor: [255, 160, 60], shakeOnHit: true, banner: true, sfx: 'cleave' },
    mage_meteor: { castMotion: 'scale', castDuration: 0.5, hitColor: [160, 120, 255], shakeOnHit: true, banner: true, sfx: 'meteor' },
    healer_bless: { castMotion: 'scale', castDuration: 0.4, hitColor: [90, 220, 110], banner: true, sfx: 'heal' },
    orc_smash: { castMotion: 'lunge', castDuration: 0.4, hitColor: [255, 120, 60], shakeOnHit: true, banner: true, sfx: 'smash' },
    boss_poison: { castMotion: 'scale', castDuration: 0.5, hitColor: [120, 220, 80], banner: true, sfx: 'poison' },
    player_focus_fire: { castMotion: 'shake', castDuration: 0.4, hitColor: [255, 200, 40], shakeOnHit: true, banner: true, sfx: 'focus' },
    player_heal_wave: { castMotion: 'scale', castDuration: 0.4, hitColor: [90, 220, 110], banner: true, sfx: 'rally' },
};

/** 取技能表现配置（缺省回落到默认，未配置的技能也能正常播放） */
export function getSkillView(skillId?: string): SkillViewConfig {
    if (!skillId) {
        return { ...DEFAULT_VIEW };
    }
    return { ...DEFAULT_VIEW, ...SKILL_VIEW_TABLE[skillId] };
}
