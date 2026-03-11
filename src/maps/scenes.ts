import { stages, type StageDef as LegacyStageDef } from './stages';
import { derivedScenes } from './derivedScenes';
import type { SceneDef, SceneOption } from './sceneSchema';

const DEFAULT_SCENE_WIDTH = 26;
const DEFAULT_SPAWN_CENTER = {
  x: DEFAULT_SCENE_WIDTH / 2,
  y: 2,
} as const;

function slugifySceneTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createSceneIds(defs: LegacyStageDef[]) {
  const counts = new Map<string, number>();

  return defs.map((stage, index) => {
    const base = slugifySceneTitle(stage.title) || `scene-${index + 1}`;
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  });
}

const sceneIds = createSceneIds(stages);

const legacyScenes: SceneDef[] = stages.map((stage, index) => ({
  id: sceneIds[index],
  title: stage.title,
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
  },
  entities: stage.entities,
  source: 'legacy',
}));

export const scenes: SceneDef[] = [...legacyScenes, ...derivedScenes];

export const defaultSceneId = scenes[0]?.id ?? '';

export const sceneOptions: SceneOption[] = scenes.map((scene, index) => ({
  id: scene.id,
  index,
  title: scene.title,
  source: scene.source,
}));

export function getSceneById(sceneId: string) {
  return scenes.find((scene) => scene.id === sceneId) ?? null;
}

export function getSceneByIndex(index: number) {
  return scenes[index] ?? null;
}
