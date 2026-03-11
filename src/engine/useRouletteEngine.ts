import { useEffect, useRef, useState } from 'react';
import { type RecordingResult, RouletteEngineAdapter, type WinnerType } from './RouletteEngineAdapter';
import type { SceneOption } from '../maps/sceneSchema';

type Params = {
  canvasElement: HTMLCanvasElement | null;
  names: string[];
  winnerRank: number;
  winnerType: WinnerType;
  speed: number;
  autoRecording: boolean;
  useSkills: boolean;
  theme: string;
};

type RankingItem = {
  rank: number;
  name: string;
  hue: number;
  isTarget: boolean;
  isWinner: boolean;
};

type RecordingDownload = {
  url: string;
  fileName: string;
};

type UiSnapshot = NonNullable<ReturnType<RouletteEngineAdapter['getUiSnapshot']>>;

export function useRouletteEngine({
  canvasElement,
  names,
  winnerRank,
  winnerType,
  speed,
  autoRecording,
  useSkills,
  theme,
}: Params) {
  const [engine, setEngine] = useState<RouletteEngineAdapter | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [goalWinner, setGoalWinner] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [maps, setMaps] = useState<SceneOption[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [uiSnapshot, setUiSnapshot] = useState<UiSnapshot | null>(null);
  const [recordingDownload, setRecordingDownload] = useState<RecordingDownload | null>(null);
  const recordingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvasElement) return;

    setEngineReady(false);
    setGoalWinner(null);
    setLastMessage(null);
    setMaps([]);
    setThemes([]);
    setRanking([]);
    setUiSnapshot(null);
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
      recordingUrlRef.current = null;
    }
    setRecordingDownload(null);

    const nextEngine = new RouletteEngineAdapter({ canvasElement });
    setEngine(nextEngine);

    return () => {
      nextEngine.destroy();
    };
  }, [canvasElement]);

  useEffect(() => {
    if (!engine) return;

    const syncReady = () => {
      setEngineReady(true);
      setMaps(engine.getMaps());
      setThemes(engine.getThemeNames());
    };

    if (engine.isReady) {
      syncReady();
    }

    const offReady = engine.onReady(syncReady);
    return () => {
      offReady();
    };
  }, [engine]);

  useEffect(() => {
    if (!engine) return;
    const offGoal = engine.onGoal((winner) => setGoalWinner(winner));
    const offMessage = engine.onMessage((msg) => setLastMessage(msg));
    const offRecording = engine.onRecordingReady((recording: RecordingResult) => {
      const nextUrl = URL.createObjectURL(recording.blob);
      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current);
      }
      recordingUrlRef.current = nextUrl;
      setRecordingDownload({
        url: nextUrl,
        fileName: recording.fileName,
      });
    });

    return () => {
      offGoal();
      offMessage();
      offRecording();
    };
  }, [engine]);

  useEffect(() => {
    return () => {
      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!engine || !engineReady) return;

    const sync = () => {
      setRanking(engine.getRankingSnapshot());
      setUiSnapshot(engine.getUiSnapshot());
    };

    sync();
    const timer = window.setInterval(sync, 100);
    return () => window.clearInterval(timer);
  }, [engine, engineReady]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setNames(names);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
  }, [engine, engineReady, names, winnerRank, winnerType]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setSpeed(speed);
  }, [engine, engineReady, speed]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setAutoRecording(autoRecording);
  }, [engine, engineReady, autoRecording]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setUseSkills(useSkills);
  }, [engine, engineReady, useSkills]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setTheme(theme);
  }, [engine, engineReady, theme]);

  const start = () => {
    if (!engine || !engineReady) return;
    setGoalWinner(null);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
    engine.start();
  };

  const reset = () => {
    if (!engine || !engineReady) return;
    setGoalWinner(null);
    engine.reset(names);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
  };

  const setMap = (sceneId: string) => {
    if (!engine || !engineReady) return;
    engine.setScene(sceneId);
    engine.setNames(names);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
  };

  const setFastForwardEnabled = (enabled: boolean) => {
    if (!engine || !engineReady) return;
    engine.setFastForwardEnabled(enabled);
  };

  const setCameraViewportPosition = (pos?: { x: number; y: number }) => {
    if (!engine || !engineReady) return;
    engine.setCameraViewportPosition(pos);
  };

  return {
    engineReady,
    goalWinner,
    lastMessage,
    maps,
    themes,
    ranking,
    uiSnapshot,
    recordingDownload,
    start,
    reset,
    setMap,
    setFastForwardEnabled,
    setCameraViewportPosition,
  };
}
