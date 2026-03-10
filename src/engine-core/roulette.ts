import { Camera } from './camera';
import { canvasHeight, canvasWidth, initialZoom, Skills, Themes, zoomThreshold } from './data/constants';
import { type StageDef, stages } from './data/maps';
import type { GameObject } from './gameObject';
import type { IPhysics } from './IPhysics';
import { Marble } from './marble';
import { ParticleManager } from './particleManager';
import { Box2dPhysics } from './physics-box2d';
import { RouletteRenderer } from './rouletteRenderer';
import { SkillEffect } from './skillEffect';
import type { ColorTheme } from './types/ColorTheme';
import { bound } from './utils/bound.decorator';
import { parseName, shuffle } from './utils/utils';
import { type RecordingReadyDetail, VideoRecorder } from './utils/videoRecorder';

type RouletteInitOptions = {
  mountElement?: HTMLElement;
  canvasElement?: HTMLCanvasElement;
};

export class Roulette extends EventTarget {
  private _marbles: Marble[] = [];

  private _lastTime: number = 0;
  private _elapsed: number = 0;

  private _updateInterval = 10;
  private _timeScale = 1;
  private _speed = 1;

  private _winners: Marble[] = [];
  private _particleManager = new ParticleManager();
  private _stage: StageDef | null = null;

  protected _camera: Camera = new Camera();
  protected _renderer: RouletteRenderer;
  private _mountElement?: HTMLElement;
  private _canvasElement?: HTMLCanvasElement;

  private _effects: GameObject[] = [];

  private _winnerRank = 0;
  private _totalMarbleCount = 0;
  private _goalDist: number = Infinity;
  private _isRunning: boolean = false;
  private _winner: Marble | null = null;

  private _autoRecording: boolean = false;
  private _recorder: VideoRecorder | null = null;

  private physics!: IPhysics;

  private _isReady: boolean = false;
  protected _theme: ColorTheme = Themes.dark;
  private _fastForwardEnabled = false;
  private _animationFrameId: number | null = null;
  private _cleanupFns: Array<() => void> = [];
  private _timeoutIds: number[] = [];
  private _destroyed = false;
  private _didCleanup = false;
  private _onRecorderReady?: (event: Event) => void;

  get isReady() {
    return this._isReady;
  }

  protected createRenderer(): RouletteRenderer {
    return new RouletteRenderer({ mountElement: this._mountElement, canvasElement: this._canvasElement });
  }

  constructor(options?: RouletteInitOptions) {
    super();
    this._mountElement = options?.mountElement;
    this._canvasElement = options?.canvasElement;
    this._renderer = this.createRenderer();
    void this._boot();
  }

  private async _boot() {
    await this._renderer.init();
    if (this._destroyed) {
      this._cleanup();
      return;
    }

    await this._init();
    if (this._destroyed) {
      this._cleanup();
      return;
    }

    this._isReady = true;
    this.dispatchEvent(new Event('ready'));
    this._update();
  }

  public getZoom() {
    return initialZoom * this._camera.zoom;
  }

  @bound
  private _update() {
    if (this._destroyed) return;
    if (!this._lastTime) this._lastTime = Date.now();
    const currentTime = Date.now();

    const fastForwardMultiplier = this._fastForwardEnabled ? 2 : 1;
    this._elapsed += (currentTime - this._lastTime) * this._speed * fastForwardMultiplier;
    if (this._elapsed > 100) {
      this._elapsed %= 100;
    }
    this._lastTime = currentTime;

    const interval = (this._updateInterval / 1000) * this._timeScale;

    while (this._elapsed >= this._updateInterval) {
      this.physics.step(interval);
      this._updateMarbles(this._updateInterval);
      this._particleManager.update(this._updateInterval);
      this._updateEffects(this._updateInterval);
      this._elapsed -= this._updateInterval;
    }

    if (this._marbles.length > 1) {
      this._marbles.sort((a, b) => b.y - a.y);
    }

    if (this._stage) {
      this._camera.update({
        marbles: this._marbles,
        stage: this._stage,
        needToZoom: this._goalDist < zoomThreshold,
        targetIndex: this._winners.length > 0 ? this._winnerRank - this._winners.length : 0,
      });
    }

    this._render();
    this._animationFrameId = window.requestAnimationFrame(this._update);
  }

  private _updateMarbles(deltaTime: number) {
    if (!this._stage) return;

    for (let i = 0; i < this._marbles.length; i++) {
      const marble = this._marbles[i];
      marble.update(deltaTime);
      if (marble.skill === Skills.Impact) {
        this._effects.push(new SkillEffect(marble.x, marble.y));
        this.physics.impact(marble.id);
      }
      if (marble.y > this._stage.goalY) {
        this._winners.push(marble);
        if (this._isRunning && this._winners.length === this._winnerRank + 1) {
          this.dispatchEvent(new CustomEvent('goal', { detail: { winner: marble.name } }));
          this._winner = marble;
          this._isRunning = false;
          this._particleManager.shot(this._renderer.width, this._renderer.height);
          this._setManagedTimeout(() => {
            this._recorder?.stop();
          }, 1000);
        } else if (
          this._isRunning &&
          this._winnerRank === this._winners.length &&
          this._winnerRank === this._totalMarbleCount - 1
        ) {
          this.dispatchEvent(
            new CustomEvent('goal', {
              detail: { winner: this._marbles[i + 1].name },
            })
          );
          this._winner = this._marbles[i + 1];
          this._isRunning = false;
          this._particleManager.shot(this._renderer.width, this._renderer.height);
          this._setManagedTimeout(() => {
            this._recorder?.stop();
          }, 1000);
        }
        this._setManagedTimeout(() => {
          this.physics.removeMarble(marble.id);
        }, 500);
      }
    }

    const targetIndex = this._winnerRank - this._winners.length;
    const topY = this._marbles[targetIndex] ? this._marbles[targetIndex].y : 0;
    this._goalDist = Math.abs(this._stage.zoomY - topY);
    this._timeScale = this._calcTimeScale();

    this._marbles = this._marbles.filter((marble) => marble.y <= this._stage?.goalY);
  }

  private _calcTimeScale(): number {
    if (!this._stage) return 1;
    const targetIndex = this._winnerRank - this._winners.length;
    if (this._winners.length < this._winnerRank + 1 && this._goalDist < zoomThreshold) {
      if (
        this._marbles[targetIndex].y > this._stage.zoomY - zoomThreshold * 1.2 &&
        (this._marbles[targetIndex - 1] || this._marbles[targetIndex + 1])
      ) {
        return Math.max(0.2, this._goalDist / zoomThreshold);
      }
    }
    return 1;
  }

  private _updateEffects(deltaTime: number) {
    this._effects.forEach((effect) => effect.update(deltaTime));
    this._effects = this._effects.filter((effect) => !effect.isDestroy);
  }

  private _render() {
    if (!this._stage) return;
    const renderParams = {
      camera: this._camera,
      stage: this._stage,
      entities: this.physics.getEntities(),
      marbles: this._marbles,
      winners: this._winners,
      particleManager: this._particleManager,
      effects: this._effects,
      winnerRank: this._winnerRank,
      winner: this._winner,
      size: { x: this._renderer.width, y: this._renderer.height },
      theme: this._theme,
    };
    this._renderer.render(renderParams);
  }

  private async _init() {
    this._recorder = new VideoRecorder(this._renderer.canvas);
    this._onRecorderReady = (event: Event) => {
      const detail = (event as CustomEvent<RecordingReadyDetail>).detail;
      this.dispatchEvent(new CustomEvent<RecordingReadyDetail>('recordingready', { detail }));
    };
    this._recorder.addEventListener('recordingready', this._onRecorderReady);

    this.physics = new Box2dPhysics();
    await this.physics.init();

    this._stage = stages[0];
    this._loadMap();
  }

  private _loadMap() {
    if (!this._stage) {
      throw new Error('No map has been selected');
    }

    this.physics.createStage(this._stage);
    this._camera.initializePosition();
  }

  public clearMarbles() {
    this.physics.clearMarbles();
    this._winner = null;
    this._winners = [];
    this._marbles = [];
  }

  public start() {
    this._isRunning = true;
    if (this._winnerRank >= this._marbles.length) {
      this._winnerRank = this._marbles.length - 1;
    }
    this._camera.startFollowingMarbles();

    if (this._autoRecording && this._recorder) {
      this._recorder.start().then(() => {
        this.physics.start();
        this._marbles.forEach((marble) => (marble.isActive = true));
      });
    } else {
      this.physics.start();
      this._marbles.forEach((marble) => (marble.isActive = true));
    }
  }

  public setSpeed(value: number) {
    if (value <= 0) {
      throw new Error('Speed multiplier must larger than 0');
    }
    this._speed = value;
  }

  public setTheme(themeName: keyof typeof Themes) {
    this._theme = Themes[themeName];
  }

  public getSpeed() {
    return this._speed;
  }

  public setWinningRank(rank: number) {
    this._winnerRank = rank;
  }

  public setAutoRecording(value: boolean) {
    this._autoRecording = value;
  }

  public setMarbles(names: string[]) {
    this.reset();
    const arr = names.slice();

    let maxWeight = -Infinity;
    let minWeight = Infinity;

    const members = arr
      .map((nameString) => {
        const result = parseName(nameString);
        if (!result) return null;
        const { name, weight, count } = result;
        if (weight > maxWeight) maxWeight = weight;
        if (weight < minWeight) minWeight = weight;
        return { name, weight, count };
      })
      .filter((member) => !!member);

    const gap = maxWeight - minWeight;

    let totalCount = 0;
    members.forEach((member) => {
      if (member) {
        member.weight = 0.1 + (gap ? (member.weight - minWeight) / gap : 0);
        totalCount += member.count;
      }
    });

    const orders = shuffle(
      Array(totalCount)
        .fill(0)
        .map((_, i) => i)
    );
    members.forEach((member) => {
      if (member) {
        for (let j = 0; j < member.count; j++) {
          const order = orders.pop() || 0;
          this._marbles.push(new Marble(this.physics, order, totalCount, member.name, member.weight));
        }
      }
    });
    this._totalMarbleCount = totalCount;

    // 카메라를 구슬 생성 위치 중앙으로 이동 + 줌인
    if (totalCount > 0) {
      const cols = Math.min(totalCount, 10);
      const rows = Math.ceil(totalCount / 10);
      const lineDelta = -Math.max(0, Math.ceil(rows - 5));
      const centerX = 10.25 + (cols - 1) * 0.3;
      const centerY = (1 + rows) / 2 + lineDelta;

      const spawnWidth = Math.max((cols - 1) * 0.6, 1);
      const spawnHeight = Math.max(rows - 1, 1);
      const margin = 3;
      const viewW = canvasWidth / initialZoom;
      const viewH = canvasHeight / initialZoom;
      const zoom = Math.max(
        1.5,
        Math.min(Math.min(viewW / (spawnWidth + margin * 2), viewH / (spawnHeight + margin * 2)), 3)
      );

      this._camera.initializePosition({ x: centerX, y: centerY }, zoom);
    }
  }

  private _clearMap() {
    this.physics.clear();
    this._marbles = [];
  }

  public reset() {
    this.clearMarbles();
    this._clearMap();
    this._loadMap();
    this._goalDist = Infinity;
  }

  public getCount() {
    return this._marbles.length;
  }

  public getMaps() {
    return stages.map((stage, index) => {
      return {
        index,
        title: stage.title,
      };
    });
  }

  public getRankingSnapshot() {
    const winners = this._winners.map((marble, index) => ({
      rank: index + 1,
      name: marble.name,
      hue: marble.hue,
      isTarget: index === this._winnerRank,
      isWinner: true,
    }));

    const pending = this._marbles.map((marble, index) => ({
      rank: winners.length + index + 1,
      name: marble.name,
      hue: marble.hue,
      isTarget: winners.length + index === this._winnerRank,
      isWinner: false,
    }));

    return [...winners, ...pending];
  }

  public setMap(index: number) {
    if (index < 0 || index > stages.length - 1) {
      throw new Error('Incorrect map number');
    }
    const names = this._marbles.map((marble) => marble.name);
    this._stage = stages[index];
    this.setMarbles(names);
    this._camera.initializePosition();
  }

  public setFastForwardEnabled(enabled: boolean) {
    this._fastForwardEnabled = enabled;
  }

  public setCameraViewportPosition(pos?: { x: number; y: number }) {
    if (pos) {
      this._camera.setPosition(pos, false);
      this._camera.lock(true);
    } else {
      this._camera.lock(false);
    }
  }

  public getUiSnapshot() {
    if (!this._stage) return null;

    return {
      stageGoalY: this._stage.goalY,
      camera: { x: this._camera.x, y: this._camera.y, zoom: this._camera.zoom },
      viewport: { width: this._renderer.width, height: this._renderer.height },
      marbles: this._marbles.map((m) => ({ x: m.x, y: m.y, hue: m.hue, name: m.name })),
      entities: this.physics.getEntities(),
      winner: this._winner ? { name: this._winner.name, hue: this._winner.hue } : null,
      theme: {
        minimapBackground: this._theme.minimapBackground,
        minimapViewport: this._theme.minimapViewport,
      },
    };
  }

  public destroy() {
    this._destroyed = true;
    this._cleanup();
  }

  private _setManagedTimeout(callback: () => void, delay: number) {
    const timerId = window.setTimeout(() => {
      this._timeoutIds = this._timeoutIds.filter((id) => id !== timerId);
      if (!this._destroyed) {
        callback();
      }
    }, delay);
    this._timeoutIds.push(timerId);
  }

  private _cleanup() {
    if (this._didCleanup) return;
    this._didCleanup = true;

    this._isReady = false;
    this._isRunning = false;

    if (this._animationFrameId !== null) {
      window.cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    this._timeoutIds.forEach((timerId) => window.clearTimeout(timerId));
    this._timeoutIds = [];

    this._cleanupFns.splice(0).forEach((cleanup) => cleanup());

    if (this._recorder && this._onRecorderReady) {
      this._recorder.removeEventListener('recordingready', this._onRecorderReady);
    }
    this._recorder?.destroy();
    this._recorder = null;
    this._onRecorderReady = undefined;

    if (this.physics) {
      this.physics.clearMarbles();
      this.physics.clear();
    }
    this._renderer.destroy();
  }
}
