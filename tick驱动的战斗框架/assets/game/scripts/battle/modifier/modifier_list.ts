import { Modifier } from "./modifier";

export class ModifierList {
    private readonly modifiers: Modifier[] = [];

    add(modifier: Modifier): void {
        this.modifiers.push(modifier);
    }

    update(): void {
        for (const modifier of this.modifiers) {
            modifier.remainTicks -= 1;
        }

        for (let index = this.modifiers.length - 1; index >= 0; index -= 1) {
            if (this.modifiers[index].remainTicks <= 0) {
                this.modifiers.splice(index, 1);
            }
        }
    }

    getAll(): readonly Modifier[] {
        return this.modifiers;
    }
}
