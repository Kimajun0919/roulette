import { registerServiceWorker } from '../engine-core/registerServiceWorker';
import { Marble } from '../engine-core/marble';
import { Roulette } from '../engine-core/roulette';
import { Themes } from '../engine-core/data/constants';

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

  onMessage(callback: (message: string) => void) {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<string>).detail;
      callback(detail);
    };
    this.roulette.addEventListener('message', handler);
    return () => this.roulette.removeEventListener('message', handler);
  }

  setNames(names: string[]) {
    this.roulette.setMarbles(names);
  }

  setWinnerRank(rankOneBased: number, winnerType: WinnerType, totalCount: number) {
    const rankZeroBased =
      winnerType === 'first'
        ? 0
        : winnerType === 'last'
          ? Math.max(0, totalCount - 1)
          : Math.max(0, rankOneBased - 1);
    this.roulette.setWinningRank(rankZeroBased);
  }

  setSpeed(speed: number) {
    this.roulette.setSpeed(speed);
  }

  setAutoRecording(enabled: boolean) {
    this.roulette.setAutoRecording(enabled);
  }

  setUseSkills(enabled: boolean) {
    Marble.setSkillsEnabled(enabled);
  }

  start() {
    this.roulette.start();
  }

  reset(names: string[]) {
    this.roulette.setMarbles(names);
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
