import { externalSceneUrls } from './externalSceneManifest';
import { importFigmaFrameToScene, isFigmaFrameNode } from './importers/figmaSceneImporter';
import { scenes as legacyScenes } from './scenes';
import type { SceneCatalog, SceneDef, SceneOption } from './sceneSchema';

type RawSceneJson = Partial<SceneDef> & {
  source?: SceneDef['source'];
};

function slugifySceneId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleFromUrl(url: string) {
  const fileName = url.split('/').pop() ?? 'scene';
  return fileName.replace(/\.[^.]+$/, '');
}

function normalizeScene(raw: RawSceneJson, fallbackId: string, source: SceneDef['source']): SceneDef {
  const title = (raw.title || fallbackId).trim();
  const sceneId = slugifySceneId(raw.id || title || fallbackId) || fallbackId;
  const goalY = Number(raw.goalY ?? raw.anchors?.goalY);
  const zoomY = Number(raw.zoomY ?? raw.anchors?.zoomY ?? goalY);

  if (!Number.isFinite(goalY) || !Number.isFinite(zoomY)) {
    throw new Error(`Scene "${sceneId}" is missing numeric goalY/zoomY`);
  }

  const width = Number(raw.width ?? raw.anchors?.minimapBounds?.width ?? 26);

  return {
    id: sceneId,
    title,
    width: Number.isFinite(width) && width > 0 ? width : 26,
    goalY,
    zoomY,
    anchors: {
      goalY,
      zoomY,
      spawnCenter: raw.anchors?.spawnCenter,
      minimapBounds: raw.anchors?.minimapBounds,
      cameraStart: raw.anchors?.cameraStart,
    },
    entities: raw.entities ?? [],
    visuals: raw.visuals ?? [],
    source,
  };
}

function ensureUniqueSceneIds(scenes: SceneDef[]) {
  const seen = new Map<string, number>();

  return scenes.map((scene) => {
    const count = seen.get(scene.id) ?? 0;
    seen.set(scene.id, count + 1);
    if (count === 0) {
      return scene;
    }

    return {
      ...scene,
      id: `${scene.id}-${count + 1}`,
    };
  });
}

function createSceneOptions(scenes: SceneDef[]): SceneOption[] {
  return scenes.map((scene, index) => ({
    id: scene.id,
    index,
    title: scene.title,
    source: scene.source,
  }));
}

export async function loadSceneFromUrl(url: string): Promise<SceneDef> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load scene from ${url} (${response.status})`);
  }

  const raw = await response.json();
  const fallbackId = slugifySceneId(titleFromUrl(url)) || 'external-scene';

  if (isFigmaFrameNode(raw)) {
    return importFigmaFrameToScene(raw, {
      sceneId: fallbackId,
      sceneTitle: titleFromUrl(url),
      source: 'figma',
    });
  }

  return normalizeScene(raw as RawSceneJson, fallbackId, 'json');
}

export async function loadSceneCatalog(sceneUrls: string[] = externalSceneUrls): Promise<SceneCatalog> {
  const loaded = await Promise.allSettled(sceneUrls.map((url) => loadSceneFromUrl(url)));
  const externalScenes = loaded.flatMap((result) => {
    if (result.status === 'fulfilled') {
      return [result.value];
    }

    console.warn(result.reason);
    return [];
  });

  const scenes = ensureUniqueSceneIds([...legacyScenes, ...externalScenes]);
  const options = createSceneOptions(scenes);

  return {
    scenes,
    options,
    defaultSceneId: scenes[0]?.id ?? '',
  };
}
