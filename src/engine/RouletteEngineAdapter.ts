import { Themes } from '../engine-core/data/constants';
import { Marble } from '../engine-core/marble';
import { Roulette } from '../engine-core/roulette';
import type { RecordingReadyDetail } from '../engine-core/utils/videoRecorder';

export type WinnerType = 'first' | 'last' | 'custom';
export type RecordingResult = RecordingReadyDetail;

type RouletteEngineAdapterOptions = {
  mountElement?: HTMLElement;
  canvasElement?: HTMLCanvasElement;
};

export class RouletteEngineAdapter {
  private roulette: Roulette;

  constructor(options?: RouletteEngineAdapterOptions) {
    this.roulette = new Roulette(options);
  }

  get isReady() {
    return this.roulette.isReady;
  }

  onReady(callback: () => void) {
    const handler = () => {
      callback();
    };
    this.roulette.addEventListener('ready', handler);
    return () => this.roulette.removeEventListener('ready', handler);
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

  onRecordingReady(callback: (result: RecordingResult) => void) {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<RecordingResult>).detail;
      callback(detail);
    };
    this.roulette.addEventListener('recordingready', handler);
    return () => this.roulette.removeEventListener('recordingready', handler);
  }

  setNames(names: string[]) {
    this.roulette.setMarbles(names);
  }

  setWinnerRank(rankOneBased: number, winnerType: WinnerType, totalCount: number) {
    const rankZeroBased =
      winnerType === 'first' ? 0 : winnerType === 'last' ? Math.max(0, totalCount - 1) : Math.max(0, rankOneBased - 1);
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

  setScene(sceneId: string) {
    this.roulette.setScene(sceneId);
  }

  setMap(index: number) {
    this.roulette.setMap(index);
  }

  setFastForwardEnabled(enabled: boolean) {
    this.roulette.setFastForwardEnabled(enabled);
  }

  setCameraViewportPosition(pos?: { x: number; y: number }) {
    this.roulette.setCameraViewportPosition(pos);
  }

  getUiSnapshot() {
    return this.roulette.getUiSnapshot();
  }

  getRankingSnapshot() {
    return this.roulette.getRankingSnapshot();
  }

  getThemeNames() {
    return Object.keys(Themes);
  }

  setTheme(themeName: string) {
    if (!(themeName in Themes)) return;
    this.roulette.setTheme(themeName as keyof typeof Themes);
  }

  destroy() {
    this.roulette.destroy();
  }
}
