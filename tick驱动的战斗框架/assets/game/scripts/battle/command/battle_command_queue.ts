import { BattleCommand } from "./battle_command";

export class BattleCommandQueue {
    private readonly commands: BattleCommand[] = [];

    enqueue(command: BattleCommand): void {
        this.commands.push(command);
    }

    dequeueForTick(tick: number): BattleCommand[] {
        const readyCommands = this.commands
            .filter((command) => command.tick <= tick)
            .sort((left, right) => left.tick - right.tick || left.sequence - right.sequence);

        for (const command of readyCommands) {
            const index = this.commands.indexOf(command);
            if (index >= 0) {
                this.commands.splice(index, 1);
            }
        }

        return readyCommands;
    }

    getAllCommands(): readonly BattleCommand[] {
        return this.commands;
    }
}
