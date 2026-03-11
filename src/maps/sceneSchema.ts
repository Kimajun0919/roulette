import type { MapEntity } from '../engine-core/types/MapEntity.type';

export type ScenePoint = {
  x: number;
  y: number;
};

export type SceneRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SceneAnchors = {
  goalY: number;
  zoomY: number;
  spawnCenter?: ScenePoint;
  minimapBounds?: SceneRect;
  cameraStart?: ScenePoint & { zoom?: number };
};

export type SceneVisualBase = {
  id: string;
  name: string;
  kind: 'group' | 'shape' | 'text' | 'image';
  layer?: 'world' | 'screen';
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  zIndex?: number;
  visible?: boolean;
};

export type SceneColorStop = {
  offset: number;
  color: string;
};

export type SceneLinearGradientPaint = {
  type: 'linear-gradient';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  stops: SceneColorStop[];
};

export type ScenePaint = string | SceneLinearGradientPaint;

export type SceneDropShadowEffect = {
  type: 'drop-shadow';
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
};

export type SceneLayerBlurEffect = {
  type: 'layer-blur';
  radius: number;
};

export type SceneEffect = SceneDropShadowEffect | SceneLayerBlurEffect;

export type SceneShapeVisual = SceneVisualBase & {
  kind: 'shape';
  shape: 'rect' | 'circle' | 'polyline' | 'path';
  width?: number;
  height?: number;
  radius?: number;
  points?: [number, number][];
  pathData?: string;
  fill?: ScenePaint;
  stroke?: ScenePaint;
  strokeWidth?: number;
  cornerRadius?: number;
  effects?: SceneEffect[];
};

export type SceneTextVisual = SceneVisualBase & {
  kind: 'text';
  text: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  effects?: SceneEffect[];
};

export type SceneImageVisual = SceneVisualBase & {
  kind: 'image';
  src: string;
  width: number;
  height: number;
  cornerRadius?: number;
  clipShape?: 'rect' | 'circle';
  effects?: SceneEffect[];
};

export type SceneGroupVisual = SceneVisualBase & {
  kind: 'group';
};

export type SceneVisualNode = SceneShapeVisual | SceneTextVisual | SceneImageVisual | SceneGroupVisual;

export type SceneDef = {
  id: string;
  title: string;
  width: number;
  goalY: number;
  zoomY: number;
  anchors: SceneAnchors;
  entities?: MapEntity[];
  visuals?: SceneVisualNode[];
  source: 'legacy' | 'json' | 'figma';
};

export type SceneOption = {
  id: string;
  index: number;
  title: string;
  source: SceneDef['source'];
};

export type SceneCatalog = {
  scenes: SceneDef[];
  options: SceneOption[];
  defaultSceneId: string;
};
