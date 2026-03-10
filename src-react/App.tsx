import { useEffect, useMemo, useRef, useState } from 'react';
import { drawApi } from './api/client';
import type { DrawRecord } from './api/types';
import { DataSyncCard } from './components/DataSyncCard';
import { DrawOptionsCard } from './components/DrawOptionsCard';
import { EngineStatusCard } from './components/EngineStatusCard';
import { MapThemeCard } from './components/MapThemeCard';
import { NextStepsCard } from './components/NextStepsCard';
import { ParticipantsCard } from './components/ParticipantsCard';
import { RunCard } from './components/RunCard';
import type { WinnerType } from './engine/RouletteEngineAdapter';
import type { RouletteEngineAdapter } from './engine/RouletteEngineAdapter';
import { createEngine } from './legacyEngine';

export function App() {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const [engine, setEngine] = useState<RouletteEngineAdapter | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [namesInput, setNamesInput] = useState('');
  const [winnerType, setWinnerType] = useState<WinnerType>('first');
  const [winnerRankInput, setWinnerRankInput] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [goalWinner, setGoalWinner] = useState<string | null>(null);
  const [autoRecording, setAutoRecording] = useState(true);
  const [maps, setMaps] = useState<Array<{ index: number; title: string }>>([]);
  const [selectedMap, setSelectedMap] = useState(0);
  const [themes, setThemes] = useState<string[]>([]);
  const [theme, setTheme] = useState('dark');
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [syncStatus, setSyncStatus] = useState('idle');

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';

  const names = useMemo(() => namesInput.split(/[\n,]/g).map((v) => v.trim()).filter(Boolean), [namesInput]);

  const winnerRank = useMemo(() => {
    if (winnerType === 'first') return 1;
    if (winnerType === 'last') return Math.max(1, names.length);
    return Math.max(1, winnerRankInput);
  }, [winnerRankInput, winnerType, names.length]);

  useEffect(() => {
    if (!canvasHostRef.current || engine) return;
    const mountedEngine = createEngine(canvasHostRef.current);
    setEngine(mountedEngine);
  }, [engine]);

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
    return engine.onGoal((winner) => setGoalWinner(winner));
  }, [engine]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setNames(names);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
  }, [engine, engineReady, names, winnerRank, winnerType]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setAutoRecording(autoRecording);
  }, [engine, engineReady, autoRecording]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setTheme(theme);
  }, [engine, engineReady, theme]);

  const onStart = () => {
    if (!engine || !engineReady) return;
    setGoalWinner(null);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
    engine.start();
  };

  const onReset = () => {
    if (!engine || !engineReady) return;
    setGoalWinner(null);
    engine.reset(names);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
  };

  const onMapChange = (index: number) => {
    setSelectedMap(index);
    if (!engine || !engineReady) return;
    engine.setMap(index);
    engine.setNames(names);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
  };

  const refreshRecords = async () => {
    try {
      setSyncStatus('loading list...');
      const list = await drawApi.list();
      setRecords(list);
      setSyncStatus(`loaded ${list.length} record(s)`);
    } catch (err) {
      setSyncStatus(`list failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const saveCurrentResult = async () => {
    if (!goalWinner || names.length === 0) return;
    try {
      setSyncStatus('saving...');
      await drawApi.create({ participants: names, winner: goalWinner, winnerRank, winnerType });
      setSyncStatus('saved');
      await refreshRecords();
    } catch (err) {
      setSyncStatus(`save failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <main className="container">
      <h1>Roulette React Migration (Phase 3+)</h1>
      <p className="desc">루트 화면도 React로 전환했고, Canvas는 React mount 노드 안에서 생성됩니다.</p>

      <EngineStatusCard engineReady={engineReady} />
      <ParticipantsCard namesInput={namesInput} namesCount={names.length} onChange={setNamesInput} />
      <DrawOptionsCard
        winnerType={winnerType}
        winnerRankInput={winnerRankInput}
        speed={speed}
        autoRecording={autoRecording}
        onWinnerTypeChange={setWinnerType}
        onWinnerRankInputChange={setWinnerRankInput}
        onSpeedChange={(next) => {
          setSpeed(next);
          if (engine && engineReady) engine.setSpeed(next);
        }}
        onAutoRecordingChange={setAutoRecording}
      />
      <MapThemeCard
        engineReady={engineReady}
        maps={maps}
        selectedMap={selectedMap}
        onMapChange={onMapChange}
        themes={themes}
        theme={theme}
        onThemeChange={setTheme}
      />
      <RunCard
        engineReady={engineReady}
        namesCount={names.length}
        winnerRank={winnerRank}
        goalWinner={goalWinner}
        onStart={onStart}
        onReset={onReset}
      />
      <section className="card">
        <h2>Canvas Host (React mount)</h2>
        <div ref={canvasHostRef} className="canvas-host" />
      </section>
      <DataSyncCard
        apiBase={apiBase}
        status={syncStatus}
        records={records}
        onRefresh={refreshRecords}
        onSave={saveCurrentResult}
        canSave={!!goalWinner && names.length > 0}
      />
      <NextStepsCard />
    </main>
  );
}
