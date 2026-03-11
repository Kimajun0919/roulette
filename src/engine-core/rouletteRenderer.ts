import type { Camera } from './camera';
import { canvasHeight, canvasWidth, initialZoom, Themes } from './data/constants';
import type { StageDef } from './data/maps';
import type { GameObject } from './gameObject';
import { KeywordService } from './keywordService';
import type { Marble } from './marble';
import type { ParticleManager } from './particleManager';
import type { ColorTheme } from './types/ColorTheme';
import type { MapEntityState } from './types/MapEntity.type';
import type { VectorLike } from './types/VectorLike';
import type { SceneEffect, SceneLinearGradientPaint, ScenePaint, SceneVisualNode } from '../maps/sceneSchema';

export type RenderParameters = {
  camera: Camera;
  stage: StageDef;
  entities: MapEntityState[];
  marbles: Marble[];
  winners: Marble[];
  particleManager: ParticleManager;
  effects: GameObject[];
  winnerRank: number;
  winner: Marble | null;
  size: VectorLike;
  theme: ColorTheme;
};

export class RouletteRenderer {
  protected _canvas!: HTMLCanvasElement;
  protected ctx!: CanvasRenderingContext2D;
  public sizeFactor = 1;

  protected _images: { [key: string]: HTMLImageElement } = {};
  protected _sceneImages = new Map<string, HTMLImageElement | Promise<HTMLImageElement>>();
  protected _theme: ColorTheme = Themes.dark;
  protected _keywordService: KeywordService;
  protected _mountElement: HTMLElement;
  protected _providedCanvas?: HTMLCanvasElement;
  private _resizeObserver: ResizeObserver | null = null;
  private _isDestroyed = false;
  private _ownsCanvas = false;

  constructor(options?: { mountElement?: HTMLElement; canvasElement?: HTMLCanvasElement }) {
    this._keywordService = this.createKeywordService();
    this._mountElement = options?.mountElement ?? document.body;
    this._providedCanvas = options?.canvasElement;
  }

  protected createKeywordService(): KeywordService {
    return new KeywordService();
  }

  get width() {
    return this._canvas.width;
  }

  get height() {
    return this._canvas.height;
  }

  get canvas() {
    return this._canvas;
  }

  set theme(value: ColorTheme) {
    this._theme = value;
  }

  async init() {
    await Promise.all([this._load(), this._keywordService.init()]);
    if (this._isDestroyed) return;

    this._canvas = this._providedCanvas ?? document.createElement('canvas');
    this._ownsCanvas = !this._providedCanvas;
    this._canvas.width = canvasWidth;
    this._canvas.height = canvasHeight;
    this.ctx = this._canvas.getContext('2d', {
      alpha: false,
    }) as CanvasRenderingContext2D;

    if (this._ownsCanvas) {
      this._mountElement.appendChild(this._canvas);
    }

    const resizing = (entries?: ResizeObserverEntry[]) => {
      const realSize = entries ? entries[0].contentRect : this._canvas.getBoundingClientRect();
      const width = Math.max(realSize.width / 2, 640);
      const height = (width / realSize.width) * realSize.height;
      this._canvas.width = width;
      this._canvas.height = height;
      this.sizeFactor = width / realSize.width;
    };

    this._resizeObserver = new ResizeObserver(resizing);
    this._resizeObserver.observe(this._canvas);
    resizing();
  }

  destroy() {
    this._isDestroyed = true;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._keywordService.destroy();
    if (this._ownsCanvas && this._canvas?.isConnected) {
      this._canvas.remove();
    }
  }

  private async _loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((rs) => {
      const img = new Image();
      img.addEventListener('load', () => {
        rs(img);
      });
      img.src = url;
    });
  }

  private async _load(): Promise<void> {
    const loadPromises = [
      { name: '챔루', imgUrl: new URL('../../assets/images/chamru.png', import.meta.url) },
      { name: '쿠빈', imgUrl: new URL('../../assets/images/kubin.png', import.meta.url) },
      { name: '꽉변', imgUrl: new URL('../../assets/images/kkwak.png', import.meta.url) },
      { name: '꽉변호사', imgUrl: new URL('../../assets/images/kkwak.png', import.meta.url) },
      { name: '꽉 변호사', imgUrl: new URL('../../assets/images/kkwak.png', import.meta.url) },
      { name: '주누피', imgUrl: new URL('../../assets/images/junyoop.png', import.meta.url) },
      { name: '왈도쿤', imgUrl: new URL('../../assets/images/waldokun.png', import.meta.url) },
    ].map(({ name, imgUrl }) => {
      return (async () => {
        this._images[name] = await this._loadImage(imgUrl.toString());
      })();
    });

    await Promise.all(loadPromises);
  }

  private getMarbleImage(name: string): CanvasImageSource | undefined {
    // Priority 1: Hardcoded images
    if (this._images[name]) {
      return this._images[name];
    }
    // Priority 2: Keyword sprites from API
    return this._keywordService.getSprite(name);
  }

  private getSceneImage(src: string): HTMLImageElement | undefined {
    const cached = this._sceneImages.get(src);
    if (cached instanceof HTMLImageElement) {
      return cached;
    }

    if (!cached) {
      const promise = this._loadImage(src)
        .then((img) => {
          this._sceneImages.set(src, img);
          return img;
        })
        .catch(() => {
          this._sceneImages.delete(src);
          return null;
        });
      this._sceneImages.set(src, promise);
    }

    return undefined;
  }

  protected onBeforeEntities(): void {}
  protected onAfterScene(): void {}

  render(renderParameters: RenderParameters) {
    this._theme = renderParameters.theme;
    this.ctx.fillStyle = this._theme.background;
    this.ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    this.ctx.save();
    this.ctx.scale(initialZoom, initialZoom);
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.font = '0.4pt sans-serif';
    this.ctx.lineWidth = 3 / (renderParameters.camera.zoom + initialZoom);
    renderParameters.camera.renderScene(this.ctx, () => {
      this.onBeforeEntities();
      this.renderVisuals(renderParameters.stage.visuals);
      this.renderEntities(renderParameters.entities);
      this.renderEffects(renderParameters);
      this.renderMarbles(renderParameters);
    });
    this.ctx.restore();
    this.onAfterScene();

    this.ctx.save();
    this.ctx.scale(initialZoom, initialZoom);
    this.renderVisuals(renderParameters.stage.visuals, 'screen');
    this.ctx.restore();
    renderParameters.particleManager.render(this.ctx);
  }

  private renderVisuals(visuals?: SceneVisualNode[], layer: 'world' | 'screen' = 'world') {
    if (!visuals?.length) return;

    const items = visuals
      .filter((visual) => visual.visible !== false && (visual.layer ?? 'world') === layer)
      .slice()
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

    if (!items.length) return;

    this.ctx.save();
    for (const visual of items) {
      const transform = this.ctx.getTransform();
      this.applyVisualEffects(visual.effects);
      this.ctx.globalAlpha = visual.opacity ?? 1;
      this.ctx.translate(visual.x ?? 0, visual.y ?? 0);
      this.ctx.rotate(visual.rotation ?? 0);
      this.ctx.scale(visual.scaleX ?? 1, visual.scaleY ?? 1);

      switch (visual.kind) {
        case 'shape':
          this.renderShapeVisual(visual);
          break;
        case 'text':
          this.renderTextVisual(visual);
          break;
        case 'image':
          this.renderImageVisual(visual);
          break;
        case 'group':
          break;
      }

      this.ctx.setTransform(transform);
      this.ctx.globalAlpha = 1;
      this.resetVisualEffects();
    }
    this.ctx.restore();
  }

  private renderShapeVisual(visual: Extract<SceneVisualNode, { kind: 'shape' }>) {
    const bounds = this.getVisualBounds(visual);
    const fill = this.resolvePaint(visual.fill, bounds) ?? 'transparent';
    const stroke = this.resolvePaint(visual.stroke, bounds) ?? 'transparent';
    const strokeWidth = visual.strokeWidth ?? 0;
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = strokeWidth;

    switch (visual.shape) {
      case 'rect': {
        const width = visual.width ?? 0;
        const height = visual.height ?? 0;
        const x = -width / 2;
        const y = -height / 2;
        if (visual.cornerRadius && visual.cornerRadius > 0) {
          this.ctx.beginPath();
          this.ctx.roundRect(x, y, width, height, visual.cornerRadius);
          if (fill !== 'transparent') this.ctx.fill();
          if (strokeWidth > 0 && stroke !== 'transparent') this.ctx.stroke();
        } else {
          if (fill !== 'transparent') this.ctx.fillRect(x, y, width, height);
          if (strokeWidth > 0 && stroke !== 'transparent') this.ctx.strokeRect(x, y, width, height);
        }
        break;
      }
      case 'circle': {
        const radius = visual.radius ?? Math.min(visual.width ?? 0, visual.height ?? 0) / 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        if (fill !== 'transparent') this.ctx.fill();
        if (strokeWidth > 0 && stroke !== 'transparent') this.ctx.stroke();
        break;
      }
      case 'polyline':
        if (!visual.points?.length) break;
        this.ctx.beginPath();
        this.ctx.moveTo(visual.points[0][0], visual.points[0][1]);
        for (let i = 1; i < visual.points.length; i++) {
          this.ctx.lineTo(visual.points[i][0], visual.points[i][1]);
        }
        if (fill !== 'transparent') this.ctx.fill();
        if (strokeWidth > 0 && stroke !== 'transparent') this.ctx.stroke();
        break;
      case 'path': {
        if (!visual.pathData) break;
        const path = new Path2D(visual.pathData);
        if (fill !== 'transparent') this.ctx.fill(path);
        if (strokeWidth > 0 && stroke !== 'transparent') this.ctx.stroke(path);
        break;
      }
    }
  }

  private renderTextVisual(visual: Extract<SceneVisualNode, { kind: 'text' }>) {
    this.ctx.font = `${visual.fontSize ?? 1}pt ${visual.fontFamily ?? 'sans-serif'}`;
    this.ctx.fillStyle = visual.color ?? '#ffffff';
    this.ctx.textAlign = visual.align ?? 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(visual.text, 0, 0);
  }

  private renderImageVisual(visual: Extract<SceneVisualNode, { kind: 'image' }>) {
    const image = this.getSceneImage(visual.src);
    if (!image) return;

    const drawImage = () => {
      this.ctx.drawImage(image, -(visual.width / 2), -(visual.height / 2), visual.width, visual.height);
    };

    if (visual.clipShape === 'circle') {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(0, 0, Math.min(visual.width, visual.height) / 2, 0, Math.PI * 2);
      this.ctx.clip();
      drawImage();
      this.ctx.restore();
      return;
    }

    if (visual.clipShape === 'rect' && visual.cornerRadius && visual.cornerRadius > 0) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.roundRect(-(visual.width / 2), -(visual.height / 2), visual.width, visual.height, visual.cornerRadius);
      this.ctx.clip();
      drawImage();
      this.ctx.restore();
      return;
    }

    drawImage();
  }

  private getVisualBounds(visual: Extract<SceneVisualNode, { kind: 'shape' }>) {
    switch (visual.shape) {
      case 'rect':
        return {
          x: -(visual.width ?? 0) / 2,
          y: -(visual.height ?? 0) / 2,
          width: visual.width ?? 0,
          height: visual.height ?? 0,
        };
      case 'circle': {
        const radius = visual.radius ?? Math.min(visual.width ?? 0, visual.height ?? 0) / 2;
        return {
          x: -radius,
          y: -radius,
          width: radius * 2,
          height: radius * 2,
        };
      }
      case 'polyline': {
        const points = visual.points ?? [];
        if (!points.length) {
          return { x: 0, y: 0, width: 0, height: 0 };
        }

        const xs = points.map(([x]) => x);
        const ys = points.map(([, y]) => y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };
      }
      case 'path':
        return {
          x: 0,
          y: 0,
          width: visual.width ?? 0,
          height: visual.height ?? 0,
        };
    }
  }

  private resolvePaint(paint: ScenePaint | undefined, bounds: { x: number; y: number; width: number; height: number }) {
    if (!paint) return undefined;
    if (typeof paint === 'string') return paint;
    return this.createLinearGradient(paint, bounds);
  }

  private createLinearGradient(
    paint: SceneLinearGradientPaint,
    bounds: { x: number; y: number; width: number; height: number }
  ) {
    const gradient = this.ctx.createLinearGradient(
      bounds.x + bounds.width * paint.x0,
      bounds.y + bounds.height * paint.y0,
      bounds.x + bounds.width * paint.x1,
      bounds.y + bounds.height * paint.y1
    );

    for (const stop of paint.stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }

    return gradient;
  }

  private applyVisualEffects(effects?: SceneEffect[]) {
    if (!effects?.length) return;

    let blurRadius = 0;
    const shadow = effects.find((effect) => effect.type === 'drop-shadow');
    const blur = effects.find((effect) => effect.type === 'layer-blur');

    if (blur?.type === 'layer-blur') {
      blurRadius = blur.radius * initialZoom;
    }

    this.ctx.filter = blurRadius > 0 ? `blur(${blurRadius}px)` : 'none';

    if (shadow?.type === 'drop-shadow') {
      this.ctx.shadowColor = shadow.color;
      this.ctx.shadowBlur = shadow.blur * initialZoom;
      this.ctx.shadowOffsetX = shadow.offsetX * initialZoom;
      this.ctx.shadowOffsetY = shadow.offsetY * initialZoom;
    }
  }

  private resetVisualEffects() {
    this.ctx.filter = 'none';
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  private renderEntities(entities: MapEntityState[]) {
    this.ctx.save();
    entities.forEach((entity) => {
      const transform = this.ctx.getTransform();
      this.ctx.translate(entity.x, entity.y);
      this.ctx.rotate(entity.angle);
      this.ctx.fillStyle = entity.shape.color ?? this._theme.entity[entity.shape.type].fill;
      this.ctx.strokeStyle = entity.shape.color ?? this._theme.entity[entity.shape.type].outline;
      this.ctx.shadowBlur = this._theme.entity[entity.shape.type].bloomRadius;
      this.ctx.shadowColor =
        entity.shape.bloomColor ?? entity.shape.color ?? this._theme.entity[entity.shape.type].bloom;
      const shape = entity.shape;
      switch (shape.type) {
        case 'polyline':
          if (shape.points.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(shape.points[0][0], shape.points[0][1]);
            for (let i = 1; i < shape.points.length; i++) {
              this.ctx.lineTo(shape.points[i][0], shape.points[i][1]);
            }
            this.ctx.stroke();
          }
          break;
        case 'box': {
          const w = shape.width * 2;
          const h = shape.height * 2;
          this.ctx.rotate(shape.rotation);
          this.ctx.fillRect(-w / 2, -h / 2, w, h);
          this.ctx.strokeRect(-w / 2, -h / 2, w, h);
          break;
        }
        case 'circle':
          this.ctx.beginPath();
          this.ctx.arc(0, 0, shape.radius, 0, Math.PI * 2, false);
          this.ctx.stroke();
          break;
      }

      this.ctx.setTransform(transform);
    });
    this.ctx.restore();
  }

  private renderEffects({ effects, camera }: RenderParameters) {
    effects.forEach((effect) => effect.render(this.ctx, camera.zoom * initialZoom, this._theme));
  }

  private renderMarbles({ marbles, camera, winnerRank, winners, size }: RenderParameters) {
    const winnerIndex = winnerRank - winners.length;

    const viewPort = { x: camera.x, y: camera.y, w: size.x, h: size.y, zoom: camera.zoom * initialZoom };
    marbles.forEach((marble, i) => {
      marble.render(
        this.ctx,
        camera.zoom * initialZoom,
        i === winnerIndex,
        false,
        this.getMarbleImage(marble.name),
        viewPort,
        this._theme
      );
    });
  }
}
