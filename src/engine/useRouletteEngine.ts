import { useEffect, useState } from 'react';
import { createEngine } from '../legacyEngine';
import type { WinnerType } from './RouletteEngineAdapter';
import type { RouletteEngineAdapter } from './RouletteEngineAdapter';

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

  useEffect(() => {
    if (!mountElement || engine) return;
    setEngine(createEngine(mountElement));
  }, [mountElement, engine]);

  useEffect(() => {
    if (!engine) return;
    const checkReady = () => {
      if (engine.isReady) {
        setEngineReady(true);
        setMaps(engine.getMaps());
        setThemes(engine.getThemeNames());
        return true;
      }
      return false;
    };

    if (!checkReady()) {
      const timer = window.setInterval(() => {
        if (checkReady()) window.clearInterval(timer);
      }, 100);
      return () => window.clearInterval(timer);
    }
  }, [engine]);

  useEffect(() => {
    if (!engine) return;
    const offGoal = engine.onGoal((winner) => setGoalWinner(winner));
    const offMessage = engine.onMessage((msg) => setLastMessage(msg));
    return () => {
      offGoal();
      offMessage();
    };
  }, [engine]);

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
    start,
    reset,
    setMap,
  };
}
