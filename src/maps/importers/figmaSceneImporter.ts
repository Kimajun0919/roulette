import type { MapEntity } from '../../engine-core/types/MapEntity.type';
import type { SceneAnchors, SceneDef } from '../sceneSchema';

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
};

export type FigmaFrameNode = FigmaSceneNode & {
  type: 'FRAME';
  children: FigmaSceneNode[];
};

type ImportOptions = {
  sceneId: string;
  sceneTitle?: string;
  pxPerUnit?: number;
  source?: SceneDef['source'];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
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

export function importFigmaFrameToScene(frame: FigmaFrameNode, options: ImportOptions): SceneDef {
  const pxPerUnit = options.pxPerUnit ?? 100;
  const frameBox = getBoundingBox(frame);
  const physicsGroup = frame.children.find((child) => child.name.trim().toLowerCase() === 'physics');
  const visualsGroup = frame.children.find((child) => child.name.trim().toLowerCase() === 'visuals');
  const anchorsGroup = frame.children.find((child) => child.name.trim().toLowerCase() === 'anchors');
  const anchors = buildAnchors(anchorsGroup, frameBox, pxPerUnit);
  const sceneId = normalizeSceneId(options.sceneId) || normalizeSceneId(frame.name) || 'figma-scene';
  const sceneTitle = options.sceneTitle?.trim() || frame.name.trim() || sceneId;
  const entities = (physicsGroup?.children ?? [])
    .filter((node) => node.visible !== false)
    .map((node) => importPhysicsNode(node, frameBox, pxPerUnit))
    .filter((entity): entity is MapEntity => entity !== null);

  return {
    id: sceneId,
    title: sceneTitle,
    width: frameBox.width > 0 ? frameBox.width / pxPerUnit : 26,
    goalY: anchors.goalY,
    zoomY: anchors.zoomY,
    anchors,
    entities,
    visuals: (visualsGroup?.children ?? []).map((node) => ({
      id: node.id,
      name: node.name,
      kind: node.type === 'TEXT' ? 'text' : node.type === 'GROUP' ? 'group' : node.type === 'RECTANGLE' || node.type === 'ELLIPSE' ? 'shape' : 'image',
    })),
    source: options.source ?? 'figma',
  };
}
