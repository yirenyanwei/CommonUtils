import { BattleSystem, BattleSystemContext } from '../core/battle-director';
import { BattleWorld } from '../core/battle-world';

// ============================================================
// InputSystem — 将 InputCommand 解析为本 tick 意图
// 只写 context 字段，不修改 entity 状态
// ============================================================

export class InputSystem implements BattleSystem {
    readonly name = 'InputSystem';

    update(_world: BattleWorld, context: BattleSystemContext): void {
        // 重置（防止上 tick 残留）
        context.moveX = 0;
        context.moveY = 0;
        context.jumpRequested = false;
        context.attackRequested = false;
        context.skillSlot = 0;

        for (const cmd of context.commands) {
            switch (cmd.type) {
                case 'Move':
                    context.moveX = cmd.dx;
                    context.moveY = cmd.dy;
                    break;
                case 'Jump':
                    context.jumpRequested = true;
                    break;
                case 'NormalAttack':
                    context.attackRequested = true;
                    break;
                case 'Skill1':
                    context.skillSlot = 1;
                    break;
                case 'Skill2':
                    context.skillSlot = 2;
                    break;
                case 'Skill3':
                    context.skillSlot = 3;
                    break;
            }
        }
    }
}
