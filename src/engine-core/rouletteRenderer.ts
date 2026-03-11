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
import type {
  SceneClipNode,
  SceneConicGradientPaint,
  SceneDiamondGradientPaint,
  SceneEffect,
  SceneLinearGradientPaint,
  ScenePaint,
  SceneRadialGradientPaint,
  SceneRect,
  SceneVisualNode,
} from '../maps/sceneSchema';

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

type RenderSurface = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

export class RouletteRenderer {
  protected _canvas!: HTMLCanvasElement;
  protected ctx!: CanvasRenderingContext2D;
  public sizeFactor = 1;

  protected _images: { [key: string]: HTMLImageElement } = {};
  protected _sceneImages = new Map<string, HTMLImageElement | Promise<HTMLImageElement>>();
  protected _effectSurfaces = new Map<string, RenderSurface>();
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
    this._effectSurfaces.clear();
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
      const baseTransform = this.ctx.getTransform();
      const pixelScale = this.getVisualPixelScale(baseTransform, visual);
      this.renderBackgroundBlurEffect(visual, baseTransform, pixelScale);

      this.ctx.save();
      this.applyVisualClip(this.ctx, visual.clipRect, visual.clips);
      this.applyVisualEffects(this.ctx, visual.effects, pixelScale);
      this.ctx.globalAlpha = visual.opacity ?? 1;
      this.ctx.globalCompositeOperation = visual.blendMode ?? 'source-over';
      this.applyVisualTransform(this.ctx, visual);
      this.renderVisualContent(this.ctx, visual);
      this.resetVisualEffects(this.ctx);
      this.ctx.restore();
      this.renderInnerShadowEffect(visual, baseTransform, pixelScale);
    }
    this.ctx.restore();
  }

  private getRenderSurface(key: string): RenderSurface {
    let surface = this._effectSurfaces.get(key);
    if (!surface) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
      surface = { canvas, ctx };
      this._effectSurfaces.set(key, surface);
    }

    if (surface.canvas.width !== this._canvas.width || surface.canvas.height !== this._canvas.height) {
      surface.canvas.width = this._canvas.width;
      surface.canvas.height = this._canvas.height;
    }

    return surface;
  }

  private resetContextState(ctx: CanvasRenderingContext2D) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  private prepareRenderSurface(key: string) {
    const surface = this.getRenderSurface(key);
    this.resetContextState(surface.ctx);
    surface.ctx.clearRect(0, 0, surface.canvas.width, surface.canvas.height);
    return surface;
  }

  private getVisualPixelScale(baseTransform: DOMMatrix, visual: SceneVisualNode) {
    const baseScaleX = Math.hypot(baseTransform.a, baseTransform.b);
    const baseScaleY = Math.hypot(baseTransform.c, baseTransform.d);
    const baseScale = ((baseScaleX || 1) + (baseScaleY || 1)) / 2;
    const visualScale = (Math.abs(visual.scaleX ?? 1) + Math.abs(visual.scaleY ?? 1)) / 2;
    return Math.max(0.001, baseScale * visualScale);
  }

  private applyVisualTransform(ctx: CanvasRenderingContext2D, visual: SceneVisualNode) {
    ctx.translate(visual.x ?? 0, visual.y ?? 0);
    ctx.rotate(visual.rotation ?? 0);
    ctx.scale(visual.scaleX ?? 1, visual.scaleY ?? 1);
  }

  private applyVisualClip(ctx: CanvasRenderingContext2D, clipRect?: SceneRect, clips?: SceneClipNode[]) {
    if (clipRect) {
      ctx.beginPath();
      ctx.rect(clipRect.x, clipRect.y, clipRect.width, clipRect.height);
      ctx.clip();
    }

    for (const clip of clips ?? []) {
      this.applyClipNode(ctx, clip);
    }
  }

  private applyClipNode(ctx: CanvasRenderingContext2D, clip: SceneClipNode) {
    switch (clip.shape) {
      case 'rect':
        ctx.beginPath();
        if (clip.cornerRadius && clip.cornerRadius > 0) {
          ctx.roundRect(clip.x, clip.y, clip.width, clip.height, clip.cornerRadius);
        } else {
          ctx.rect(clip.x, clip.y, clip.width, clip.height);
        }
        ctx.clip();
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(clip.x, clip.y, clip.radius, 0, Math.PI * 2);
        ctx.clip();
        break;
      case 'path': {
        const path = new Path2D(clip.pathData);
        const transformed = new Path2D();
        if (typeof transformed.addPath === 'function') {
          transformed.addPath(
            path,
            new DOMMatrix()
              .translateSelf(clip.x, clip.y)
              .rotateSelf(((clip.rotation ?? 0) * 180) / Math.PI)
              .scaleSelf(clip.scaleX ?? 1, clip.scaleY ?? 1)
          );
          ctx.clip(transformed);
          break;
        }

        const transform = ctx.getTransform();
        ctx.translate(clip.x, clip.y);
        ctx.rotate(clip.rotation ?? 0);
        ctx.scale(clip.scaleX ?? 1, clip.scaleY ?? 1);
        ctx.clip(path);
        ctx.setTransform(transform);
        break;
      }
    }
  }

  private renderVisualContent(ctx: CanvasRenderingContext2D, visual: SceneVisualNode) {
    switch (visual.kind) {
      case 'shape':
        this.renderShapeVisual(ctx, visual);
        break;
      case 'text':
        this.renderTextVisual(ctx, visual);
        break;
      case 'image':
        this.renderImageVisual(ctx, visual);
        break;
      case 'group':
        break;
    }
  }

  private renderVisualMask(ctx: CanvasRenderingContext2D, visual: SceneVisualNode) {
    switch (visual.kind) {
      case 'shape':
        this.renderShapeMask(ctx, visual);
        break;
      case 'text':
        this.renderTextMask(ctx, visual);
        break;
      case 'image':
        this.renderImageMask(ctx, visual);
        break;
      case 'group':
        break;
    }
  }

  private createVisualMaskSurface(visual: SceneVisualNode, baseTransform: DOMMatrix) {
    const surface = this.prepareRenderSurface('mask');
    surface.ctx.save();
    surface.ctx.setTransform(baseTransform);
    this.applyVisualClip(surface.ctx, visual.clipRect, visual.clips);
    this.applyVisualTransform(surface.ctx, visual);
    this.renderVisualMask(surface.ctx, visual);
    surface.ctx.restore();
    return surface;
  }

  private renderBackgroundBlurEffect(visual: SceneVisualNode, baseTransform: DOMMatrix, pixelScale: number) {
    const blur = visual.effects?.find((effect) => effect.type === 'background-blur');
    if (!blur || visual.kind === 'group') return;

    const blurRadius = blur.radius * pixelScale;
    if (blurRadius <= 0.01) return;

    const backdrop = this.prepareRenderSurface('backdrop');
    backdrop.ctx.drawImage(this._canvas, 0, 0);

    const blurred = this.prepareRenderSurface('background-blur');
    blurred.ctx.filter = `blur(${blurRadius}px)`;
    blurred.ctx.drawImage(backdrop.canvas, 0, 0);
    blurred.ctx.filter = 'none';

    const mask = this.createVisualMaskSurface(visual, baseTransform);
    blurred.ctx.globalCompositeOperation = 'destination-in';
    blurred.ctx.drawImage(mask.canvas, 0, 0);

    this.ctx.save();
    this.resetContextState(this.ctx);
    this.ctx.globalAlpha = visual.opacity ?? 1;
    this.ctx.drawImage(blurred.canvas, 0, 0);
    this.ctx.restore();
  }

  private renderInnerShadowEffect(visual: SceneVisualNode, baseTransform: DOMMatrix, pixelScale: number) {
    const innerShadow = visual.effects?.find((effect) => effect.type === 'inner-shadow');
    if (!innerShadow || visual.kind === 'group') return;

    const shadow = this.prepareRenderSurface('inner-shadow');
    const mask = this.createVisualMaskSurface(visual, baseTransform);
    shadow.ctx.shadowColor = innerShadow.color;
    shadow.ctx.shadowBlur = innerShadow.blur * pixelScale;
    shadow.ctx.shadowOffsetX = innerShadow.offsetX * pixelScale;
    shadow.ctx.shadowOffsetY = innerShadow.offsetY * pixelScale;
    shadow.ctx.drawImage(mask.canvas, 0, 0);

    this.resetContextState(shadow.ctx);
    shadow.ctx.globalCompositeOperation = 'destination-in';
    shadow.ctx.drawImage(mask.canvas, 0, 0);
    shadow.ctx.globalCompositeOperation = 'destination-out';
    shadow.ctx.drawImage(mask.canvas, 0, 0);

    this.ctx.save();
    this.resetContextState(this.ctx);
    this.ctx.globalAlpha = visual.opacity ?? 1;
    this.ctx.drawImage(shadow.canvas, 0, 0);
    this.ctx.restore();
  }

  private createShapePath(visual: Extract<SceneVisualNode, { kind: 'shape' }>) {
    const path = new Path2D();
    switch (visual.shape) {
      case 'rect': {
        const width = visual.width ?? 0;
        const height = visual.height ?? 0;
        const x = -width / 2;
        const y = -height / 2;
        if (visual.cornerRadius && visual.cornerRadius > 0) {
          path.roundRect(x, y, width, height, visual.cornerRadius);
        } else {
          path.rect(x, y, width, height);
        }
        return path;
      }
      case 'circle': {
        const radius = visual.radius ?? Math.min(visual.width ?? 0, visual.height ?? 0) / 2;
        path.arc(0, 0, radius, 0, Math.PI * 2);
        return path;
      }
      case 'polyline': {
        if (!visual.points?.length) return null;
        path.moveTo(visual.points[0][0], visual.points[0][1]);
        for (let i = 1; i < visual.points.length; i++) {
          path.lineTo(visual.points[i][0], visual.points[i][1]);
        }
        return path;
      }
      case 'path':
        if (!visual.pathData) return null;
        return new Path2D(visual.pathData);
    }
  }

  private renderShapeVisual(ctx: CanvasRenderingContext2D, visual: Extract<SceneVisualNode, { kind: 'shape' }>) {
    const path = this.createShapePath(visual);
    if (!path) return;

    const bounds = this.getVisualBounds(visual);
    const fill = this.resolvePaint(ctx, visual.fill, bounds) ?? 'transparent';
    const stroke = this.resolvePaint(ctx, visual.stroke, bounds) ?? 'transparent';
    const strokeWidth = visual.strokeWidth ?? 0;

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    if (fill !== 'transparent') ctx.fill(path);
    if (strokeWidth > 0 && stroke !== 'transparent') ctx.stroke(path);
  }

  private renderShapeMask(ctx: CanvasRenderingContext2D, visual: Extract<SceneVisualNode, { kind: 'shape' }>) {
    const path = this.createShapePath(visual);
    if (!path) return;
    const strokeWidth = visual.strokeWidth ?? 0;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = strokeWidth;
    if (visual.fill || !visual.stroke) {
      ctx.fill(path);
    }
    if (strokeWidth > 0 && visual.stroke) {
      ctx.stroke(path);
    }
  }

  private renderTextVisual(ctx: CanvasRenderingContext2D, visual: Extract<SceneVisualNode, { kind: 'text' }>) {
    ctx.font = `${visual.fontSize ?? 1}pt ${visual.fontFamily ?? 'sans-serif'}`;
    ctx.fillStyle = visual.color ?? '#ffffff';
    ctx.textAlign = visual.align ?? 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(visual.text, 0, 0);
  }

  private renderTextMask(ctx: CanvasRenderingContext2D, visual: Extract<SceneVisualNode, { kind: 'text' }>) {
    ctx.font = `${visual.fontSize ?? 1}pt ${visual.fontFamily ?? 'sans-serif'}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = visual.align ?? 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(visual.text, 0, 0);
  }

  private drawImageShape(ctx: CanvasRenderingContext2D, visual: Extract<SceneVisualNode, { kind: 'image' }>, image: CanvasImageSource) {
    const drawImage = () => {
      ctx.drawImage(image, -(visual.width / 2), -(visual.height / 2), visual.width, visual.height);
    };

    if (visual.clipShape === 'circle') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(visual.width, visual.height) / 2, 0, Math.PI * 2);
      ctx.clip();
      drawImage();
      ctx.restore();
      return;
    }

    if (visual.clipShape === 'rect' && visual.cornerRadius && visual.cornerRadius > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-(visual.width / 2), -(visual.height / 2), visual.width, visual.height, visual.cornerRadius);
      ctx.clip();
      drawImage();
      ctx.restore();
      return;
    }

    drawImage();
  }

  private renderImageVisual(ctx: CanvasRenderingContext2D, visual: Extract<SceneVisualNode, { kind: 'image' }>) {
    const image = this.getSceneImage(visual.src);
    if (!image) return;
    this.drawImageShape(ctx, visual, image);
  }

  private renderImageMask(ctx: CanvasRenderingContext2D, visual: Extract<SceneVisualNode, { kind: 'image' }>) {
    const image = this.getSceneImage(visual.src);
    if (image) {
      this.drawImageShape(ctx, visual, image);
      return;
    }

    ctx.fillStyle = '#ffffff';
    if (visual.clipShape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(visual.width, visual.height) / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (visual.clipShape === 'rect' && visual.cornerRadius && visual.cornerRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(-(visual.width / 2), -(visual.height / 2), visual.width, visual.height, visual.cornerRadius);
      ctx.fill();
      return;
    }

    ctx.fillRect(-(visual.width / 2), -(visual.height / 2), visual.width, visual.height);
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

  private resolvePaint(
    ctx: CanvasRenderingContext2D,
    paint: ScenePaint | undefined,
    bounds: { x: number; y: number; width: number; height: number }
  ) {
    if (!paint) return undefined;
    if (typeof paint === 'string') return paint;

    switch (paint.type) {
      case 'linear-gradient':
        return this.createLinearGradient(ctx, paint, bounds);
      case 'radial-gradient':
        return this.createRadialGradient(ctx, paint, bounds);
      case 'conic-gradient':
        return this.createConicGradient(ctx, paint, bounds);
      case 'diamond-gradient':
        return this.createDiamondGradient(ctx, paint, bounds);
    }
  }

  private createLinearGradient(
    ctx: CanvasRenderingContext2D,
    paint: SceneLinearGradientPaint,
    bounds: { x: number; y: number; width: number; height: number }
  ) {
    const gradient = ctx.createLinearGradient(
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

  private createRadialGradient(
    ctx: CanvasRenderingContext2D,
    paint: SceneRadialGradientPaint,
    bounds: { x: number; y: number; width: number; height: number }
  ) {
    const cx = bounds.x + bounds.width * paint.x0;
    const cy = bounds.y + bounds.height * paint.y0;
    const x1 = bounds.x + bounds.width * paint.x1;
    const y1 = bounds.y + bounds.height * paint.y1;
    const radius = Math.max(0.001, Math.hypot(x1 - cx, y1 - cy));
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

    for (const stop of paint.stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }

    return gradient;
  }

  private createConicGradient(
    ctx: CanvasRenderingContext2D,
    paint: SceneConicGradientPaint,
    bounds: { x: number; y: number; width: number; height: number }
  ) {
    const cx = bounds.x + bounds.width * paint.x0;
    const cy = bounds.y + bounds.height * paint.y0;
    const x1 = bounds.x + bounds.width * paint.x1;
    const y1 = bounds.y + bounds.height * paint.y1;
    const startAngle = Math.atan2(y1 - cy, x1 - cx);
    const createConicGradient = (
      ctx as CanvasRenderingContext2D & {
        createConicGradient?: (startAngle: number, x: number, y: number) => CanvasGradient;
      }
    ).createConicGradient;

    if (!createConicGradient) {
      return this.createLinearGradient(
        ctx,
        {
          type: 'linear-gradient',
          x0: paint.x0,
          y0: paint.y0,
          x1: paint.x1,
          y1: paint.y1,
          stops: paint.stops,
        },
        bounds
      );
    }

    const gradient = createConicGradient.call(ctx, startAngle, cx, cy);
    for (const stop of paint.stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }

    return gradient;
  }

  private createDiamondGradient(
    ctx: CanvasRenderingContext2D,
    paint: SceneDiamondGradientPaint,
    bounds: { x: number; y: number; width: number; height: number }
  ) {
    return this.createRadialGradient(
      ctx,
      {
        type: 'radial-gradient',
        x0: paint.x0,
        y0: paint.y0,
        x1: paint.x1,
        y1: paint.y1,
        stops: paint.stops,
      },
      bounds
    );
  }

  private applyVisualEffects(ctx: CanvasRenderingContext2D, effects: SceneEffect[] | undefined, pixelScale: number) {
    if (!effects?.length) return;

    let blurRadius = 0;
    const shadow = effects.find((effect) => effect.type === 'drop-shadow');
    const blur = effects.find((effect) => effect.type === 'layer-blur');

    if (blur?.type === 'layer-blur') {
      blurRadius = blur.radius * pixelScale;
    }

    ctx.filter = blurRadius > 0 ? `blur(${blurRadius}px)` : 'none';

    if (shadow?.type === 'drop-shadow') {
      ctx.shadowColor = shadow.color;
      ctx.shadowBlur = shadow.blur * pixelScale;
      ctx.shadowOffsetX = shadow.offsetX * pixelScale;
      ctx.shadowOffsetY = shadow.offsetY * pixelScale;
    }
  }

  private resetVisualEffects(ctx: CanvasRenderingContext2D) {
    ctx.filter = 'none';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
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
