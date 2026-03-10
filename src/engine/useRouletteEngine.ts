import { useEffect, useRef, useState } from 'react';
import { RouletteEngineAdapter, type RecordingResult, type WinnerType } from './RouletteEngineAdapter';

type Params = {
  mountElement: HTMLElement | null;
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
  isTarget: boolean;
};

type RecordingDownload = {
  url: string;
  fileName: string;
};

export function useRouletteEngine({
  mountElement,
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
  const [maps, setMaps] = useState<Array<{ index: number; title: string }>>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [recordingDownload, setRecordingDownload] = useState<RecordingDownload | null>(null);
  const recordingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mountElement) return;

    setEngineReady(false);
    setGoalWinner(null);
    setLastMessage(null);
    setMaps([]);
    setThemes([]);
    setRanking([]);
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
      recordingUrlRef.current = null;
    }
    setRecordingDownload(null);

    const nextEngine = new RouletteEngineAdapter(mountElement);
    setEngine(nextEngine);

    return () => {
      nextEngine.destroy();
    };
  }, [mountElement]);

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

    const sync = () => setRanking(engine.getRankingSnapshot());
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

  const setMap = (index: number) => {
    if (!engine || !engineReady) return;
    engine.setMap(index);
    engine.setNames(names);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
  };

  return {
    engineReady,
    goalWinner,
    lastMessage,
    maps,
    themes,
    ranking,
    recordingDownload,
    start,
    reset,
    setMap,
  };
}
