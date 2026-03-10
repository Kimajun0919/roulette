import { useEffect, useMemo, useState } from 'react';
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
import { getEngine } from './legacyEngine';

export function App() {
  const [engine] = useState(() => getEngine());
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

  const names = useMemo(
    () => namesInput.split(/[\n,]/g).map((v) => v.trim()).filter(Boolean),
    [namesInput]
  );

  const winnerRank = useMemo(() => {
    if (winnerType === 'first') return 1;
    if (winnerType === 'last') return Math.max(1, names.length);
    return Math.max(1, winnerRankInput);
  }, [winnerRankInput, winnerType, names.length]);

  useEffect(() => {
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

  useEffect(() => engine.onGoal((winner) => setGoalWinner(winner)), [engine]);

  useEffect(() => {
    if (!engineReady) return;
    engine.setNames(names);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
  }, [engine, engineReady, names, winnerRank, winnerType]);

  useEffect(() => {
    if (!engineReady) return;
    engine.setAutoRecording(autoRecording);
  }, [engine, engineReady, autoRecording]);

  useEffect(() => {
    if (!engineReady) return;
    engine.setTheme(theme);
  }, [engine, engineReady, theme]);

  const onStart = () => {
    if (!engineReady) return;
    setGoalWinner(null);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
    engine.start();
  };

  const onReset = () => {
    if (!engineReady) return;
    setGoalWinner(null);
    engine.reset(names);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
  };

  const onMapChange = (index: number) => {
    setSelectedMap(index);
    if (!engineReady) return;
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
      await drawApi.create({
        participants: names,
        winner: goalWinner,
        winnerRank,
        winnerType,
      });
      setSyncStatus('saved');
      await refreshRecords();
    } catch (err) {
      setSyncStatus(`save failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <main className="container">
      <h1>Roulette React Migration (Phase 3+)</h1>
      <p className="desc">컴포넌트 분해 + 엔진 어댑터 + 백엔드 연동 스캐폴드 결합 단계입니다.</p>

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
          if (engineReady) engine.setSpeed(next);
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
