import type { MapEntity } from '../engine-core/types/MapEntity.type';
import type { SceneDef, SceneEffect, ScenePaint, SceneVisualNode } from './sceneSchema';
import { stages } from './stages';

const DEFAULT_SCENE_WIDTH = 26;
const DEFAULT_SPAWN_CENTER = {
  x: DEFAULT_SCENE_WIDTH / 2,
  y: 2,
} as const;

const STATIC_WIREFRAME = 'rgba(157, 215, 255, 0.08)';
const KINEMATIC_HIGHLIGHT = 'rgba(255, 214, 102, 0.9)';
const NO_BLOOM = 'rgba(0, 0, 0, 0)';

function createShadow(color: string, blur: number, offsetY = 0): SceneEffect {
  return {
    type: 'drop-shadow',
    color,
    offsetX: 0,
    offsetY,
    blur,
  };
}

function createGradient(from: string, to: string): ScenePaint {
  return {
    type: 'linear-gradient',
    x0: 0,
    y0: 0,
    x1: 1,
    y1: 1,
    stops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  };
}

function withVisualSplitTint(entity: MapEntity): MapEntity {
  return {
    ...entity,
    shape: {
      ...entity.shape,
      color: entity.type === 'kinematic' ? entity.shape.color ?? KINEMATIC_HIGHLIGHT : STATIC_WIREFRAME,
      bloomColor: entity.shape.bloomColor ?? NO_BLOOM,
    },
  };
}

function createBackdropVisuals(): SceneVisualNode[] {
  return [
    {
      id: 'wheel-split-backdrop',
      name: 'Wheel Split Backdrop',
      kind: 'shape',
      shape: 'rect',
      x: 13,
      y: 56,
      width: 24.6,
      height: 112,
      cornerRadius: 0.9,
      fill: {
        type: 'linear-gradient',
        x0: 0,
        y0: 0,
        x1: 1,
        y1: 1,
        stops: [
          { offset: 0, color: 'rgba(9, 18, 32, 0.18)' },
          { offset: 0.5, color: 'rgba(16, 40, 61, 0.34)' },
          { offset: 1, color: 'rgba(5, 11, 21, 0.2)' },
        ],
      },
      stroke: 'rgba(162, 217, 255, 0.48)',
      strokeWidth: 0.08,
      zIndex: -40,
      effects: [createShadow('rgba(0, 0, 0, 0.28)', 1.8, 0.7)],
    },
    {
      id: 'wheel-split-spotlight',
      name: 'Wheel Split Spotlight',
      kind: 'shape',
      shape: 'circle',
      x: 13,
      y: 31,
      radius: 8.4,
      fill: {
        type: 'radial-gradient',
        x0: 0.5,
        y0: 0.5,
        x1: 0.9,
        y1: 0.5,
        stops: [
          { offset: 0, color: 'rgba(255, 220, 132, 0.3)' },
          { offset: 0.45, color: 'rgba(255, 168, 76, 0.14)' },
          { offset: 1, color: 'rgba(255, 168, 76, 0)' },
        ],
      },
      zIndex: -32,
      blendMode: 'screen',
    },
    {
      id: 'wheel-split-lane-ribbon',
      name: 'Wheel Split Lane Ribbon',
      kind: 'shape',
      shape: 'rect',
      x: 13,
      y: 50,
      width: 8.6,
      height: 76,
      cornerRadius: 0.7,
      fill: {
        type: 'linear-gradient',
        x0: 0.5,
        y0: 0,
        x1: 0.5,
        y1: 1,
        stops: [
          { offset: 0, color: 'rgba(255, 255, 255, 0)' },
          { offset: 0.18, color: 'rgba(255, 255, 255, 0.06)' },
          { offset: 0.72, color: 'rgba(114, 196, 255, 0.08)' },
          { offset: 1, color: 'rgba(255, 255, 255, 0)' },
        ],
      },
      zIndex: -28,
    },
    {
      id: 'wheel-split-title',
      name: 'Wheel Split Title',
      kind: 'text',
      x: 13,
      y: 6.2,
      text: 'Wheel of fortune / visual split',
      fontSize: 0.95,
      fontFamily: 'Georgia',
      color: 'rgba(235, 247, 255, 0.96)',
      zIndex: -18,
      effects: [createShadow('rgba(0, 0, 0, 0.35)', 0.5, 0.08)],
    },
    {
      id: 'wheel-split-subtitle',
      name: 'Wheel Split Subtitle',
      kind: 'text',
      x: 13,
      y: 7.8,
      text: 'legacy physics with separately rendered visuals',
      fontSize: 0.38,
      fontFamily: 'Georgia',
      color: 'rgba(201, 227, 247, 0.72)',
      zIndex: -17,
    },
    {
      id: 'wheel-split-hud-tag',
      name: 'Wheel Split HUD Tag',
      kind: 'text',
      layer: 'screen',
      x: 12.2,
      y: 1.4,
      text: 'visual split scene',
      fontSize: 0.34,
      fontFamily: 'Georgia',
      color: 'rgba(255, 255, 255, 0.72)',
      zIndex: 10,
    },
    {
      id: 'wheel-split-goal-band',
      name: 'Wheel Split Goal Band',
      kind: 'shape',
      shape: 'rect',
      x: 13,
      y: 107.8,
      width: 10.8,
      height: 5.2,
      cornerRadius: 0.45,
      fill: {
        type: 'linear-gradient',
        x0: 0,
        y0: 0.5,
        x1: 1,
        y1: 0.5,
        stops: [
          { offset: 0, color: 'rgba(255, 183, 3, 0.08)' },
          { offset: 0.5, color: 'rgba(255, 213, 79, 0.22)' },
          { offset: 1, color: 'rgba(255, 183, 3, 0.08)' },
        ],
      },
      stroke: 'rgba(255, 220, 120, 0.45)',
      strokeWidth: 0.06,
      zIndex: -14,
      effects: [createShadow('rgba(255, 187, 56, 0.18)', 0.8, 0)],
    },
  ];
}

function createBoardShellPath(leftWall: MapEntity, rightWall: MapEntity) {
  if (leftWall.shape.type !== 'polyline' || rightWall.shape.type !== 'polyline') {
    return null;
  }

  const left = leftWall.shape.points;
  const right = rightWall.shape.points;
  if (left.length < 2 || right.length < 2) {
    return null;
  }

  const leftBoundary = left.slice(1);
  const rightBoundary = right.slice().reverse();
  const points = [...leftBoundary, ...rightBoundary];
  if (!points.length) {
    return null;
  }

  const [first, ...rest] = points;
  return `M ${first[0]} ${first[1]} ${rest.map(([x, y]) => `L ${x} ${y}`).join(' ')} Z`;
}

function createBoardShellVisuals(stageEntities: MapEntity[]): SceneVisualNode[] {
  const leftWall = stageEntities[0];
  const rightWall = stageEntities[1];
  if (!leftWall || !rightWall) {
    return [];
  }

  const pathData = createBoardShellPath(leftWall, rightWall);
  if (!pathData) {
    return [];
  }

  return [
    {
      id: 'wheel-split-board-shell',
      name: 'Wheel Split Board Shell',
      kind: 'shape',
      shape: 'path',
      x: 0,
      y: 0,
      width: DEFAULT_SCENE_WIDTH,
      height: 112,
      pathData,
      fill: {
        type: 'linear-gradient',
        x0: 0.5,
        y0: 0,
        x1: 0.5,
        y1: 1,
        stops: [
          { offset: 0, color: 'rgba(255, 255, 255, 0.02)' },
          { offset: 0.08, color: 'rgba(255, 255, 255, 0.08)' },
          { offset: 0.42, color: 'rgba(95, 181, 255, 0.09)' },
          { offset: 0.78, color: 'rgba(67, 120, 201, 0.13)' },
          { offset: 1, color: 'rgba(255, 201, 107, 0.08)' },
        ],
      },
      stroke: 'rgba(184, 230, 255, 0.14)',
      strokeWidth: 0.03,
      zIndex: -26,
    },
    {
      id: 'wheel-split-board-shell-edge',
      name: 'Wheel Split Board Shell Edge',
      kind: 'shape',
      shape: 'path',
      x: 0,
      y: 0,
      width: DEFAULT_SCENE_WIDTH,
      height: 112,
      pathData,
      stroke: 'rgba(182, 227, 255, 0.12)',
      strokeWidth: 0.08,
      zIndex: -10,
    },
  ];
}

function createRailVisuals(entity: MapEntity, index: number): SceneVisualNode[] {
  if (entity.shape.type !== 'polyline') return [];

  return [
    {
      id: `wheel-split-rail-glow-${index}`,
      name: `Wheel Split Rail Glow ${index + 1}`,
      kind: 'shape',
      shape: 'polyline',
      x: 0,
      y: 0,
      points: entity.shape.points,
      stroke: 'rgba(120, 204, 255, 0.12)',
      strokeWidth: 0.32,
      zIndex: -6,
      effects: [createShadow('rgba(89, 181, 255, 0.22)', 0.6, 0)],
    },
    {
      id: `wheel-split-rail-${index}`,
      name: `Wheel Split Rail ${index + 1}`,
      kind: 'shape',
      shape: 'polyline',
      x: 0,
      y: 0,
      points: entity.shape.points,
      stroke: {
        type: 'linear-gradient',
        x0: 0,
        y0: 0,
        x1: 0,
        y1: 1,
        stops: [
          { offset: 0, color: 'rgba(205, 235, 255, 0.5)' },
          { offset: 0.55, color: 'rgba(116, 197, 255, 0.62)' },
          { offset: 1, color: 'rgba(255, 214, 121, 0.56)' },
        ],
      },
      strokeWidth: 0.14,
      zIndex: -4,
    },
  ];
}

function createBoxFill(y: number): ScenePaint {
  if (y < 40) {
    return createGradient('rgba(255, 159, 67, 0.92)', 'rgba(255, 99, 132, 0.92)');
  }
  if (y < 80) {
    return createGradient('rgba(120, 230, 255, 0.9)', 'rgba(78, 140, 255, 0.82)');
  }
  return createGradient('rgba(255, 230, 155, 0.94)', 'rgba(255, 177, 122, 0.92)');
}

function createBoxStroke(y: number) {
  if (y < 40) return 'rgba(255, 235, 204, 0.72)';
  if (y < 80) return 'rgba(207, 241, 255, 0.68)';
  return 'rgba(255, 244, 207, 0.78)';
}

function createStaticBoxVisual(entity: MapEntity, index: number): SceneVisualNode | null {
  if (entity.shape.type !== 'box' || entity.type !== 'static') return null;

  const width = entity.shape.width * 2;
  const height = entity.shape.height * 2;
  const y = entity.position.y;
  const baseRadius = Math.min(width, height) * 0.42;

  return {
    id: `wheel-split-box-${index}`,
    name: `Wheel Split Box ${index + 1}`,
    kind: 'shape',
    shape: 'rect',
    x: entity.position.x,
    y,
    width,
    height,
    rotation: entity.shape.rotation,
    cornerRadius: Math.max(0.04, baseRadius),
    fill: createBoxFill(y),
    stroke: createBoxStroke(y),
    strokeWidth: width >= 2 ? 0.06 : 0.045,
    zIndex: y >= 90 ? 2 : y >= 60 ? 1 : 0,
    effects: [createShadow('rgba(0, 0, 0, 0.24)', 0.18, 0.04)],
  };
}

function createKinematicHalo(entity: MapEntity, index: number): SceneVisualNode | null {
  if (entity.shape.type !== 'box' || entity.type !== 'kinematic') return null;

  const radius = Math.max(0.65, entity.shape.width * 0.55);

  return {
    id: `wheel-split-rotor-halo-${index}`,
    name: `Wheel Split Rotor Halo ${index + 1}`,
    kind: 'shape',
    shape: 'circle',
    x: entity.position.x,
    y: entity.position.y,
    radius,
    fill: {
      type: 'radial-gradient',
      x0: 0.5,
      y0: 0.5,
      x1: 0.95,
      y1: 0.5,
      stops: [
        { offset: 0, color: 'rgba(255, 233, 168, 0.32)' },
        { offset: 0.55, color: 'rgba(255, 204, 102, 0.12)' },
        { offset: 1, color: 'rgba(255, 204, 102, 0)' },
      ],
    },
    stroke: 'rgba(255, 231, 173, 0.24)',
    strokeWidth: 0.04,
    zIndex: -2,
    blendMode: 'screen',
  };
}

function createWheelOfFortuneVisualSplitScene(): SceneDef | null {
  const stage = stages.find((entry) => entry.title === 'Wheel of fortune');
  if (!stage?.entities?.length) {
    return null;
  }

  const entities = stage.entities.map(withVisualSplitTint);
  const visuals = [
    ...createBackdropVisuals(),
    ...createBoardShellVisuals(stage.entities),
    ...stage.entities.flatMap(createRailVisuals),
    ...stage.entities.map(createStaticBoxVisual).filter((node): node is SceneVisualNode => node !== null),
  ];

  return {
    id: 'wheel-of-fortune-visual-split',
    title: 'Wheel of fortune / Visual split',
    width: DEFAULT_SCENE_WIDTH,
    goalY: stage.goalY,
    zoomY: stage.zoomY,
    anchors: {
      goalY: stage.goalY,
      zoomY: stage.zoomY,
      spawnCenter: DEFAULT_SPAWN_CENTER,
      minimapBounds: {
        x: 0,
        y: 0,
        width: DEFAULT_SCENE_WIDTH,
        height: Math.max(stage.goalY, stage.zoomY),
      },
      cameraStart: {
        x: DEFAULT_SPAWN_CENTER.x,
        y: 4,
        zoom: 1,
      },
    },
    entities,
    visuals,
    source: 'legacy',
  };
}

const wheelOfFortuneVisualSplitScene = createWheelOfFortuneVisualSplitScene();

const YORU_WALL_SPRITE = '/obstacles/yoru-wall.svg';
const YORU_GEM_SPRITE = '/obstacles/yoru-gem.svg';
const YORU_ORB_SPRITE = '/obstacles/yoru-orb.svg';
const YORU_ROTOR_LIME_SPRITE = '/obstacles/yoru-rotor-lime.svg';
const YORU_ROTOR_CORAL_SPRITE = '/obstacles/yoru-rotor-coral.svg';
const YORU_ROTOR_BLUE_SPRITE = '/obstacles/yoru-rotor-blue.svg';
const YORU_ROTOR_PLUM_SPRITE = '/obstacles/yoru-rotor-plum.svg';

function createYoruBackdropVisuals(): SceneVisualNode[] {
  return [
    {
      id: 'yoru-split-backdrop',
      name: 'Yoru Split Backdrop',
      kind: 'shape',
      shape: 'rect',
      x: 11.5,
      y: 124,
      width: 19.6,
      height: 242,
      cornerRadius: 1.2,
      fill: {
        type: 'linear-gradient',
        x0: 0,
        y0: 0,
        x1: 1,
        y1: 1,
        stops: [
          { offset: 0, color: 'rgba(8, 11, 26, 0.2)' },
          { offset: 0.38, color: 'rgba(18, 28, 58, 0.34)' },
          { offset: 1, color: 'rgba(5, 8, 19, 0.22)' },
        ],
      },
      stroke: 'rgba(155, 182, 255, 0.42)',
      strokeWidth: 0.08,
      zIndex: -42,
      effects: [createShadow('rgba(0, 0, 0, 0.24)', 2.2, 1)],
    },
    {
      id: 'yoru-split-moon',
      name: 'Yoru Split Moon',
      kind: 'shape',
      shape: 'circle',
      x: 11.5,
      y: 17,
      radius: 6.2,
      fill: {
        type: 'radial-gradient',
        x0: 0.5,
        y0: 0.5,
        x1: 0.88,
        y1: 0.5,
        stops: [
          { offset: 0, color: 'rgba(255, 246, 214, 0.48)' },
          { offset: 0.55, color: 'rgba(186, 213, 255, 0.2)' },
          { offset: 1, color: 'rgba(186, 213, 255, 0)' },
        ],
      },
      zIndex: -35,
      blendMode: 'screen',
    },
    {
      id: 'yoru-split-aurora',
      name: 'Yoru Split Aurora',
      kind: 'shape',
      shape: 'rect',
      x: 11.5,
      y: 118,
      width: 8.4,
      height: 180,
      cornerRadius: 1.1,
      fill: {
        type: 'linear-gradient',
        x0: 0.5,
        y0: 0,
        x1: 0.5,
        y1: 1,
        stops: [
          { offset: 0, color: 'rgba(255, 255, 255, 0)' },
          { offset: 0.18, color: 'rgba(163, 196, 255, 0.06)' },
          { offset: 0.56, color: 'rgba(125, 152, 246, 0.11)' },
          { offset: 1, color: 'rgba(255, 255, 255, 0)' },
        ],
      },
      zIndex: -30,
    },
    {
      id: 'yoru-split-title',
      name: 'Yoru Split Title',
      kind: 'text',
      x: 11.5,
      y: 7,
      text: 'Yoru ni Kakeru / visual split',
      fontSize: 0.9,
      fontFamily: 'Georgia',
      color: 'rgba(237, 244, 255, 0.94)',
      zIndex: -18,
      effects: [createShadow('rgba(0, 0, 0, 0.32)', 0.6, 0.08)],
    },
    {
      id: 'yoru-split-subtitle',
      name: 'Yoru Split Subtitle',
      kind: 'text',
      x: 11.5,
      y: 8.8,
      text: 'night palette for legacy physics',
      fontSize: 0.38,
      fontFamily: 'Georgia',
      color: 'rgba(202, 215, 252, 0.68)',
      zIndex: -17,
    },
    {
      id: 'yoru-split-tag',
      name: 'Yoru Split Tag',
      kind: 'text',
      layer: 'screen',
      x: 10.4,
      y: 1.4,
      text: 'visual split scene',
      fontSize: 0.34,
      fontFamily: 'Georgia',
      color: 'rgba(255, 255, 255, 0.7)',
      zIndex: 10,
    },
    {
      id: 'yoru-split-goal-band',
      name: 'Yoru Split Goal Band',
      kind: 'shape',
      shape: 'rect',
      x: 11.5,
      y: 234,
      width: 15.4,
      height: 20,
      cornerRadius: 0.9,
      fill: {
        type: 'linear-gradient',
        x0: 0,
        y0: 0.5,
        x1: 1,
        y1: 0.5,
        stops: [
          { offset: 0, color: 'rgba(123, 92, 245, 0.08)' },
          { offset: 0.5, color: 'rgba(236, 209, 255, 0.18)' },
          { offset: 1, color: 'rgba(123, 92, 245, 0.08)' },
        ],
      },
      stroke: 'rgba(206, 197, 255, 0.32)',
      strokeWidth: 0.06,
      zIndex: -12,
    },
  ];
}

function getYoruRotorSprite(color: string | undefined) {
  switch (color?.toLowerCase()) {
    case '#9bec00':
      return YORU_ROTOR_LIME_SPRITE;
    case '#ff6868':
      return YORU_ROTOR_CORAL_SPRITE;
    case '#80b3ff':
      return YORU_ROTOR_BLUE_SPRITE;
    case '#5c5470':
      return YORU_ROTOR_PLUM_SPRITE;
    default:
      return YORU_ROTOR_BLUE_SPRITE;
  }
}

function withYoruEntityRender(entity: MapEntity, stageHeight: number): MapEntity {
  if (entity.shape.type === 'box') {
    if (entity.type === 'static' && entity.shape.height >= 100) {
      return {
        ...entity,
        render: {
          kind: 'image',
          src: YORU_WALL_SPRITE,
          width: entity.shape.width * 2.15,
          height: stageHeight + 10,
          offsetY: stageHeight / 2 - 2,
          opacity: 0.94,
        },
      };
    }

    if (entity.type === 'static') {
      return {
        ...entity,
        render: {
          kind: 'image',
          src: YORU_GEM_SPRITE,
          width: entity.shape.width * 2,
          height: entity.shape.height * 2,
          opacity: 0.98,
        },
      };
    }

    return {
      ...entity,
      render: {
        kind: 'image',
        src: getYoruRotorSprite(entity.shape.color),
        width: entity.shape.width * 2,
        height: Math.max(entity.shape.height * 2, 0.36),
        opacity: 0.96,
      },
    };
  }

  if (entity.shape.type === 'circle') {
    return {
      ...entity,
      render: {
        kind: 'image',
        src: YORU_ORB_SPRITE,
        width: entity.shape.radius * 2,
        height: entity.shape.radius * 2,
        opacity: 0.98,
      },
    };
  }

  return entity;
}

function createYoruNiKakeruVisualSplitScene(): SceneDef | null {
  const stage = stages.find((entry) => entry.title === 'Yoru ni Kakeru');
  if (!stage?.entities?.length) {
    return null;
  }

  const stageHeight = Math.max(stage.goalY, stage.zoomY);
  const entities = stage.entities.map((entity) => withYoruEntityRender(withVisualSplitTint(entity), stageHeight));
  const visuals = createYoruBackdropVisuals();

  return {
    id: 'yoru-ni-kakeru-visual-split',
    title: 'Yoru ni Kakeru / Visual split',
    width: DEFAULT_SCENE_WIDTH,
    goalY: stage.goalY,
    zoomY: stage.zoomY,
    anchors: {
      goalY: stage.goalY,
      zoomY: stage.zoomY,
      spawnCenter: DEFAULT_SPAWN_CENTER,
      minimapBounds: {
        x: 0,
        y: 0,
        width: DEFAULT_SCENE_WIDTH,
        height: Math.max(stage.goalY, stage.zoomY),
      },
      cameraStart: {
        x: 11.5,
        y: 16,
        zoom: 1,
      },
    },
    entities,
    visuals,
    source: 'legacy',
  };
}

const yoruNiKakeruVisualSplitScene = createYoruNiKakeruVisualSplitScene();

export const derivedScenes: SceneDef[] = [
  ...[wheelOfFortuneVisualSplitScene, yoruNiKakeruVisualSplitScene].filter((scene): scene is SceneDef => scene !== null),
];
