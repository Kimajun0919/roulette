import type { MapEntity } from '../../engine-core/types/MapEntity.type';
import type { SceneAnchors, SceneDef, SceneEffect, ScenePaint, SceneVisualNode } from '../sceneSchema';

type FigmaPoint = {
  x: number;
  y: number;
};

type FigmaBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FigmaPluginData = Record<string, string | number | boolean>;

type FigmaGeometry = {
  path?: string;
};

type FigmaColor = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

type FigmaPaint = {
  type?: string;
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  gradientHandlePositions?: Array<{ x: number; y: number }>;
  gradientStops?: Array<{ position: number; color: FigmaColor }>;
  imageRef?: string;
};

type FigmaEffect = {
  type?: string;
  visible?: boolean;
  radius?: number;
  color?: FigmaColor;
  offset?: FigmaPoint;
};

export type FigmaSceneNode = {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  visible?: boolean;
  children?: FigmaSceneNode[];
  absoluteBoundingBox?: FigmaBoundingBox;
  points?: FigmaPoint[];
  pluginData?: FigmaPluginData;
  characters?: string;
  fontSize?: number;
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  fillGeometry?: FigmaGeometry[];
  strokeGeometry?: FigmaGeometry[];
  effects?: FigmaEffect[];
  cornerRadius?: number;
  strokeWeight?: number;
  opacity?: number;
  fontName?: { family?: string; style?: string };
  textAlignHorizontal?: string;
  layoutMode?: string;
  clipsContent?: boolean;
};

export type FigmaFrameNode = FigmaSceneNode & {
  type: 'FRAME';
  children: FigmaSceneNode[];
};

export type FigmaFrameImportPayload = {
  frame?: FigmaFrameNode;
  figmaFrame?: FigmaFrameNode;
  imageUrls?: Record<string, string>;
  images?: Record<string, string>;
  sceneId?: string;
  sceneTitle?: string;
  pxPerUnit?: number;
};

type ImportOptions = {
  sceneId: string;
  sceneTitle?: string;
  pxPerUnit?: number;
  source?: SceneDef['source'];
  imageUrls?: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeSceneId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getBoundingBox(node: FigmaSceneNode): FigmaBoundingBox {
  if (node.absoluteBoundingBox) {
    return node.absoluteBoundingBox;
  }

  return {
    x: node.x ?? 0,
    y: node.y ?? 0,
    width: node.width ?? 0,
    height: node.height ?? 0,
  };
}

function parseMetadata(name: string, pluginData?: FigmaPluginData) {
  const result: Record<string, string> = {};

  for (const chunk of name.split('|').map((part) => part.trim())) {
    const [key, ...rest] = chunk.split('=');
    if (!rest.length) continue;
    result[key.trim()] = rest.join('=').trim();
  }

  if (pluginData) {
    for (const [key, value] of Object.entries(pluginData)) {
      result[key] = String(value);
    }
  }

  return result;
}

function toCssColor(color?: FigmaColor, opacity = 1) {
  if (!color) return undefined;
  const r = Math.round(Math.max(0, Math.min(1, color.r)) * 255);
  const g = Math.round(Math.max(0, Math.min(1, color.g)) * 255);
  const b = Math.round(Math.max(0, Math.min(1, color.b)) * 255);
  const alpha = Math.max(0, Math.min(1, (color.a ?? 1) * opacity));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function firstVisiblePaint(paints?: FigmaPaint[]) {
  return paints?.find((paint) => paint.visible !== false);
}

function readNumberField(metadata: Record<string, string>, key: string, fallback: number) {
  const raw = metadata[key];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readStringField(metadata: Record<string, string>, key: string, fallback: string) {
  return metadata[key]?.trim() || fallback;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toWorldPoint(frameBox: FigmaBoundingBox, point: FigmaPoint, pxPerUnit: number): [number, number] {
  return [(point.x - frameBox.x) / pxPerUnit, (point.y - frameBox.y) / pxPerUnit];
}

function toLocalCenter(frameBox: FigmaBoundingBox, nodeBox: FigmaBoundingBox, pxPerUnit: number) {
  return {
    x: (nodeBox.x - frameBox.x + nodeBox.width / 2) / pxPerUnit,
    y: (nodeBox.y - frameBox.y + nodeBox.height / 2) / pxPerUnit,
  };
}

function toScenePaint(paint: FigmaPaint | undefined): ScenePaint | undefined {
  if (!paint) return undefined;

  if (paint.type === 'GRADIENT_LINEAR' && paint.gradientHandlePositions && paint.gradientStops?.length) {
    const [start, end] = paint.gradientHandlePositions;
    if (start && end) {
      return {
        type: 'linear-gradient',
        x0: start.x,
        y0: start.y,
        x1: end.x,
        y1: end.y,
        stops: paint.gradientStops.map((stop) => ({
          offset: stop.position,
          color: toCssColor(stop.color, paint.opacity ?? 1) ?? 'rgba(255, 255, 255, 1)',
        })),
      };
    }
  }

  return toCssColor(paint.color, paint.opacity ?? 1);
}

function toSceneEffects(effects: FigmaEffect[] | undefined, pxPerUnit: number): SceneEffect[] | undefined {
  if (!effects?.length) return undefined;

  const normalized = effects
    .filter((effect) => effect.visible !== false)
    .flatMap((effect): SceneEffect[] => {
      if (effect.type === 'DROP_SHADOW') {
        return [
          {
            type: 'drop-shadow',
            color: toCssColor(effect.color, 1) ?? 'rgba(0, 0, 0, 0.35)',
            offsetX: (effect.offset?.x ?? 0) / pxPerUnit,
            offsetY: (effect.offset?.y ?? 0) / pxPerUnit,
            blur: (effect.radius ?? 0) / pxPerUnit,
          },
        ];
      }

      if (effect.type === 'LAYER_BLUR') {
        return [
          {
            type: 'layer-blur',
            radius: (effect.radius ?? 0) / pxPerUnit,
          },
        ];
      }

      return [];
    });

  return normalized.length ? normalized : undefined;
}

function joinGeometryPaths(geometry?: FigmaGeometry[]) {
  const paths = geometry?.map((entry) => entry.path).filter((path): path is string => Boolean(path)) ?? [];
  return paths.length ? paths.join(' ') : null;
}

function flattenNodes(nodes: FigmaSceneNode[]): FigmaSceneNode[] {
  return nodes.flatMap((node) => (node.children?.length ? [node, ...flattenNodes(node.children)] : [node]));
}

function isImageLikeNode(node: FigmaSceneNode, metadata: Record<string, string>) {
  return readStringField(metadata, 'kind', '') === 'image' || Boolean(metadata.src) || Boolean(firstVisiblePaint(node.fills)?.imageRef);
}

function isFrameLikeNode(node: FigmaSceneNode) {
  return node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET';
}

function importPhysicsNode(node: FigmaSceneNode, frameBox: FigmaBoundingBox, pxPerUnit: number): MapEntity | null {
  const metadata = parseMetadata(node.name, node.pluginData);
  const nodeBox = getBoundingBox(node);
  const position = toLocalCenter(frameBox, nodeBox, pxPerUnit);
  const bodyType = readStringField(metadata, 'body', 'static');
  const entityType = bodyType === 'kinematic' ? 'kinematic' : 'static';
  const density = readNumberField(metadata, 'density', 1);
  const restitution = readNumberField(metadata, 'restitution', 0);
  const angularVelocity = readNumberField(metadata, 'angularVelocity', 0);
  const life = readNumberField(metadata, 'life', -1);
  const rotation = toRadians(node.rotation ?? 0);

  switch (node.type) {
    case 'RECTANGLE':
      return {
        position,
        type: entityType,
        shape: {
          type: 'box',
          width: nodeBox.width / pxPerUnit / 2,
          height: nodeBox.height / pxPerUnit / 2,
          rotation,
        },
        props: { density, restitution, angularVelocity, life },
      };
    case 'ELLIPSE': {
      const radius = Math.min(nodeBox.width, nodeBox.height) / pxPerUnit / 2;
      return {
        position,
        type: entityType,
        shape: {
          type: 'circle',
          radius,
        },
        props: { density, restitution, angularVelocity, life },
      };
    }
    case 'LINE':
    case 'VECTOR': {
      const explicitPoints = Array.isArray(node.points) && node.points.length >= 2 ? node.points : null;
      const points = explicitPoints
        ? explicitPoints.map((point) => toWorldPoint(frameBox, point, pxPerUnit))
        : [
            [(nodeBox.x - frameBox.x) / pxPerUnit, (nodeBox.y - frameBox.y) / pxPerUnit],
            [(nodeBox.x - frameBox.x + nodeBox.width) / pxPerUnit, (nodeBox.y - frameBox.y + nodeBox.height) / pxPerUnit],
          ];

      return {
        position: { x: 0, y: 0 },
        type: entityType,
        shape: {
          type: 'polyline',
          rotation: 0,
          points,
        },
        props: { density, restitution, angularVelocity, life },
      };
    }
    default:
      return null;
  }
}

function importImageVisual(
  node: FigmaSceneNode,
  metadata: Record<string, string>,
  box: FigmaBoundingBox,
  center: { x: number; y: number },
  pxPerUnit: number,
  rotation: number,
  opacity: number,
  zIndex: number,
  layer: 'world' | 'screen',
  imageUrls: Record<string, string> | undefined
): SceneVisualNode | null {
  const imagePaint = firstVisiblePaint(node.fills);
  const imageSrc = readStringField(metadata, 'src', imagePaint?.imageRef ? imageUrls?.[imagePaint.imageRef] ?? '' : '');
  if (!imageSrc) return null;

  const clipShape = node.type === 'ELLIPSE' ? 'circle' : 'rect';
  const cornerRadius = node.type === 'RECTANGLE' || isFrameLikeNode(node) ? (node.cornerRadius ?? 0) / pxPerUnit : undefined;

  return {
    id: node.id,
    name: node.name,
    kind: 'image',
    x: center.x,
    y: center.y,
    width: box.width / pxPerUnit,
    height: box.height / pxPerUnit,
    rotation,
    opacity,
    zIndex,
    layer,
    src: imageSrc,
    clipShape,
    cornerRadius,
    effects: toSceneEffects(node.effects, pxPerUnit),
  };
}

function importVisualNode(
  node: FigmaSceneNode,
  frameBox: FigmaBoundingBox,
  pxPerUnit: number,
  order: number,
  imageUrls?: Record<string, string>
): SceneVisualNode | null {
  const box = getBoundingBox(node);
  const center = toLocalCenter(frameBox, box, pxPerUnit);
  const metadata = parseMetadata(node.name, node.pluginData);
  const fillPaint = firstVisiblePaint(node.fills);
  const strokePaint = firstVisiblePaint(node.strokes);
  const fill = toScenePaint(fillPaint);
  const stroke = toScenePaint(strokePaint);
  const opacity = readNumberField(metadata, 'opacity', node.opacity ?? 1);
  const zIndex = readNumberField(metadata, 'zIndex', order);
  const layer = readStringField(metadata, 'layer', 'world') === 'screen' ? 'screen' : 'world';
  const cornerRadius = readNumberField(metadata, 'cornerRadius', (node.cornerRadius ?? 0) / pxPerUnit);
  const strokeWidth = readNumberField(metadata, 'strokeWidth', (node.strokeWeight ?? 0) / pxPerUnit);
  const rotation = toRadians(node.rotation ?? 0);
  const effects = toSceneEffects(node.effects, pxPerUnit);
  const imageVisual = isImageLikeNode(node, metadata)
    ? importImageVisual(node, metadata, box, center, pxPerUnit, rotation, opacity, zIndex, layer, imageUrls)
    : null;
  if (imageVisual) {
    return imageVisual;
  }

  switch (node.type) {
    case 'RECTANGLE':
    case 'FRAME':
    case 'INSTANCE':
    case 'COMPONENT':
    case 'COMPONENT_SET':
      if (!fill && !stroke) return null;
      return {
        id: node.id,
        name: node.name,
        kind: 'shape',
        shape: 'rect',
        x: center.x,
        y: center.y,
        width: box.width / pxPerUnit,
        height: box.height / pxPerUnit,
        rotation,
        fill,
        stroke,
        strokeWidth: strokeWidth || (stroke ? 0.06 : 0),
        cornerRadius,
        opacity,
        zIndex,
        layer,
        effects,
      };
    case 'ELLIPSE':
      return {
        id: node.id,
        name: node.name,
        kind: 'shape',
        shape: 'circle',
        x: center.x,
        y: center.y,
        radius: Math.min(box.width, box.height) / pxPerUnit / 2,
        fill,
        stroke,
        strokeWidth: strokeWidth || (stroke ? 0.06 : 0),
        opacity,
        zIndex,
        layer,
        effects,
      };
    case 'VECTOR':
    case 'BOOLEAN_OPERATION':
    case 'STAR':
    case 'POLYGON': {
      const pathData = joinGeometryPaths(node.fillGeometry) ?? joinGeometryPaths(node.strokeGeometry);
      if (pathData) {
        return {
          id: node.id,
          name: node.name,
          kind: 'shape',
          shape: 'path',
          x: (box.x - frameBox.x) / pxPerUnit,
          y: (box.y - frameBox.y) / pxPerUnit,
          scaleX: 1 / pxPerUnit,
          scaleY: 1 / pxPerUnit,
          width: box.width / pxPerUnit,
          height: box.height / pxPerUnit,
          pathData,
          fill,
          stroke: stroke ?? fill ?? '#ffffff',
          strokeWidth: strokeWidth || (stroke ? 0.06 : 0),
          opacity,
          zIndex,
          layer,
          effects,
        };
      }

      if (Array.isArray(node.points) && node.points.length >= 2) {
        return {
          id: node.id,
          name: node.name,
          kind: 'shape',
          shape: 'polyline',
          x: 0,
          y: 0,
          points: node.points.map((point) => toWorldPoint(frameBox, point, pxPerUnit)),
          fill,
          stroke: stroke ?? fill ?? '#ffffff',
          strokeWidth: strokeWidth || 0.08,
          opacity,
          zIndex,
          layer,
          effects,
        };
      }

      return null;
    }
    case 'LINE':
      return {
        id: node.id,
        name: node.name,
        kind: 'shape',
        shape: 'polyline',
        x: 0,
        y: 0,
        points: (Array.isArray(node.points) ? node.points : []).map((point) => toWorldPoint(frameBox, point, pxPerUnit)),
        fill,
        stroke: stroke ?? fill ?? '#ffffff',
        strokeWidth: strokeWidth || 0.08,
        opacity,
        zIndex,
        layer,
        effects,
      };
    case 'TEXT': {
      const alignValue = readStringField(metadata, 'align', node.textAlignHorizontal?.toLowerCase() ?? 'center');
      const align = alignValue === 'left' ? 'left' : alignValue === 'right' ? 'right' : 'center';
      return {
        id: node.id,
        name: node.name,
        kind: 'text',
        x: center.x,
        y: center.y,
        text: node.characters || node.name,
        fontSize: readNumberField(metadata, 'fontSize', (node.fontSize ?? 24) / pxPerUnit),
        color: typeof fill === 'string' ? fill : '#ffffff',
        fontFamily: readStringField(metadata, 'fontFamily', node.fontName?.family ?? 'sans-serif'),
        align,
        opacity,
        zIndex,
        layer,
        effects,
      };
    }
    default:
      return null;
  }
}

function readAnchorY(node: FigmaSceneNode, frameBox: FigmaBoundingBox, pxPerUnit: number) {
  const nodeBox = getBoundingBox(node);
  return (nodeBox.y - frameBox.y + nodeBox.height / 2) / pxPerUnit;
}

function buildAnchors(anchorGroup: FigmaSceneNode | undefined, frameBox: FigmaBoundingBox, pxPerUnit: number): SceneAnchors {
  const anchors: SceneAnchors = {
    goalY: frameBox.height / pxPerUnit,
    zoomY: frameBox.height / pxPerUnit,
  };

  for (const child of anchorGroup?.children ?? []) {
    const key = child.name.trim().toLowerCase();
    if (key === 'goal-y') {
      anchors.goalY = readAnchorY(child, frameBox, pxPerUnit);
    } else if (key === 'zoom-y') {
      anchors.zoomY = readAnchorY(child, frameBox, pxPerUnit);
    } else if (key === 'spawn-center') {
      const nodeBox = getBoundingBox(child);
      anchors.spawnCenter = toLocalCenter(frameBox, nodeBox, pxPerUnit);
    } else if (key === 'minimap-bounds') {
      const nodeBox = getBoundingBox(child);
      anchors.minimapBounds = {
        x: (nodeBox.x - frameBox.x) / pxPerUnit,
        y: (nodeBox.y - frameBox.y) / pxPerUnit,
        width: nodeBox.width / pxPerUnit,
        height: nodeBox.height / pxPerUnit,
      };
    } else if (key === 'camera-start') {
      const nodeBox = getBoundingBox(child);
      anchors.cameraStart = {
        ...toLocalCenter(frameBox, nodeBox, pxPerUnit),
        zoom: 1,
      };
    }
  }

  return anchors;
}

export function isFigmaFrameNode(value: unknown): value is FigmaFrameNode {
  return isRecord(value) && value.type === 'FRAME' && Array.isArray(value.children) && typeof value.name === 'string';
}

export function isFigmaFrameImportPayload(value: unknown): value is FigmaFrameImportPayload {
  if (!isRecord(value)) return false;
  return isFigmaFrameNode(value.frame) || isFigmaFrameNode(value.figmaFrame);
}

export function importFigmaFrameToScene(frame: FigmaFrameNode, options: ImportOptions): SceneDef {
  const pxPerUnit = options.pxPerUnit ?? 100;
  const frameBox = getBoundingBox(frame);
  const physicsGroup = frame.children.find((child) => child.name.trim().toLowerCase() === 'physics');
  const visualsGroup = frame.children.find((child) => child.name.trim().toLowerCase() === 'visuals');
  const anchorsGroup = frame.children.find((child) => child.name.trim().toLowerCase() === 'anchors');
  const anchors = buildAnchors(anchorsGroup, frameBox, pxPerUnit);
  const sceneId = normalizeSceneId(options.sceneId) || normalizeSceneId(frame.name) || 'figma-scene';
  const sceneTitle = options.sceneTitle?.trim() || frame.name.trim() || sceneId;
  const entities = flattenNodes(physicsGroup?.children ?? [])
    .filter((node) => node.visible !== false)
    .map((node) => importPhysicsNode(node, frameBox, pxPerUnit))
    .filter((entity): entity is MapEntity => entity !== null);
  const visuals = flattenNodes(visualsGroup?.children ?? [])
    .filter((node) => node.visible !== false)
    .map((node, index) => importVisualNode(node, frameBox, pxPerUnit, index, options.imageUrls))
    .filter((node): node is SceneVisualNode => node !== null);

  return {
    id: sceneId,
    title: sceneTitle,
    width: frameBox.width > 0 ? frameBox.width / pxPerUnit : 26,
    goalY: anchors.goalY,
    zoomY: anchors.zoomY,
    anchors,
    entities,
    visuals,
    source: options.source ?? 'figma',
  };
}
