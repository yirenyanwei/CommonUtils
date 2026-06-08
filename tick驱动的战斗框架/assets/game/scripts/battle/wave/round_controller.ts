export class RoundController {
    roundIndex: number = 0;
    waveIndex: number = 0;

    moveNextWave(): void {
        this.waveIndex += 1;
    }

    moveNextRound(): void {
        this.roundIndex += 1;
        this.waveIndex = 0;
    }
}
