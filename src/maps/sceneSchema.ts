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

export type SceneVisualNode = {
  id: string;
  name: string;
  kind: 'group' | 'shape' | 'text' | 'image';
};

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
