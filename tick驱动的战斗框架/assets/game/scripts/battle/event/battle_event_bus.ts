import { BattleEvent } from "./battle_event";

export class BattleEventBus {
    private readonly events: BattleEvent[] = [];

    emit(event: BattleEvent): void {
        this.events.push(event);
    }

    drain(): BattleEvent[] {
        const drainedEvents = this.events.slice();
        this.events.length = 0;
        return drainedEvents;
    }

    peek(): readonly BattleEvent[] {
        return this.events;
    }
}
