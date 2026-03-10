import options from '../../src/options';
import { registerServiceWorker } from '../../src/registerServiceWorker';
import { Roulette } from '../../src/roulette';
import { Themes } from '../../src/data/constants';

export type WinnerType = 'first' | 'last' | 'custom';

export class RouletteEngineAdapter {
  private roulette: Roulette;

  constructor(mountElement?: HTMLElement) {
    registerServiceWorker();
    this.roulette = new Roulette({ mountElement });
  }

  get isReady() {
    return this.roulette.isReady;
  }

  onGoal(callback: (winner: string | null) => void) {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ winner?: string }>).detail;
      callback(detail?.winner || null);
    };
    this.roulette.addEventListener('goal', handler);
    return () => this.roulette.removeEventListener('goal', handler);
  }

  setNames(names: string[]) {
    this.roulette.setMarbles(names);
  }

  setWinnerRank(rankOneBased: number, winnerType: WinnerType, totalCount: number) {
    if (winnerType === 'first') {
      options.winningRank = 0;
    } else if (winnerType === 'last') {
      options.winningRank = Math.max(0, totalCount - 1);
    } else {
      options.winningRank = Math.max(0, rankOneBased - 1);
    }
    this.roulette.setWinningRank(options.winningRank);
  }

  setSpeed(speed: number) {
    this.roulette.setSpeed(speed);
  }

  setAutoRecording(enabled: boolean) {
    options.autoRecording = enabled;
    this.roulette.setAutoRecording(enabled);
  }

  start() {
    this.roulette.start();
  }

  reset(names: string[]) {
    this.roulette.setMarbles(names);
    this.roulette.setWinningRank(options.winningRank);
  }

  getCount() {
    return this.roulette.getCount();
  }

  getMaps() {
    return this.roulette.getMaps();
  }

  setMap(index: number) {
    this.roulette.setMap(index);
  }

  getThemeNames() {
    return Object.keys(Themes);
  }

  setTheme(themeName: string) {
    if (!(themeName in Themes)) return;
    this.roulette.setTheme(themeName as keyof typeof Themes);
  }
}
