import { useEffect, useMemo, useRef, useState } from 'react';
import { loadAttendanceWeights, type AttendanceWeight } from './api/haneulbit';
import { ApiModeCard } from './components/ApiModeCard';
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
  const [useSkills, setUseSkills] = useState(true);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [maps, setMaps] = useState<Array<{ index: number; title: string }>>([]);
  const [selectedMap, setSelectedMap] = useState(0);
  const [themes, setThemes] = useState<string[]>([]);
  const [theme, setTheme] = useState('dark');
  const [mode, setMode] = useState<'local' | 'api'>('local');
  const [apiBaseUrl, setApiBaseUrl] = useState(
    (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'https://haneulbit-api.holyimpact.org'
  );
  const [apiToken, setApiToken] = useState('');
  const [apiStatus, setApiStatus] = useState('idle');
  const [apiRole, setApiRole] = useState('');
  const [weights, setWeights] = useState<AttendanceWeight[]>([]);

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
    engine.setAutoRecording(autoRecording);
  }, [engine, engineReady, autoRecording]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setTheme(theme);
  }, [engine, engineReady, theme]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setUseSkills(useSkills);
  }, [engine, engineReady, useSkills]);

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

  const loadFromAttendanceApi = async () => {
    try {
      setApiStatus('loading...');
      const { me, weights } = await loadAttendanceWeights(apiBaseUrl, apiToken.trim());
      setApiRole(me.role || 'unknown');
      setWeights(weights);
      const weightedNames = weights.map((w) => `${w.name}*${Math.max(1, w.count)}`);
      setNamesInput(weightedNames.join('\n'));
      setApiStatus(`loaded ${weights.length} users (approved attendance based weights)`);
    } catch (err) {
      setApiStatus(`failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <main className="container">
      <h1>Roulette React Migration (Phase 3+)</h1>
      <p className="desc">루트 화면도 React로 전환했고, Canvas는 React mount 노드 안에서 생성됩니다.</p>

      <EngineStatusCard engineReady={engineReady} />
      <ApiModeCard
        mode={mode}
        onModeChange={setMode}
        apiBaseUrl={apiBaseUrl}
        apiToken={apiToken}
        apiStatus={apiStatus}
        apiRole={apiRole}
        weights={weights}
        onApiBaseUrlChange={setApiBaseUrl}
        onApiTokenChange={setApiToken}
        onLoadAttendance={loadFromAttendanceApi}
      />
      <ParticipantsCard
        namesInput={namesInput}
        namesCount={names.length}
        onChange={setNamesInput}
        onShuffle={() => {
          const shuffled = [...names].sort(() => Math.random() - 0.5);
          setNamesInput(shuffled.join('\n'));
        }}
      />
      <DrawOptionsCard
        winnerType={winnerType}
        winnerRankInput={winnerRankInput}
        speed={speed}
        autoRecording={autoRecording}
        useSkills={useSkills}
        onWinnerTypeChange={setWinnerType}
        onWinnerRankInputChange={setWinnerRankInput}
        onSpeedChange={(next) => {
          setSpeed(next);
          if (engine && engineReady) engine.setSpeed(next);
        }}
        onAutoRecordingChange={setAutoRecording}
        onUseSkillsChange={setUseSkills}
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
        <h2>엔진 메시지</h2>
        <p className="muted">{lastMessage ?? '아직 메시지 없음'}</p>
      </section>
      <section className="card">
        <h2>Canvas Host (React mount)</h2>
        <div ref={canvasHostRef} className="canvas-host" />
      </section>
      {/* data sync card removed: replaced by API mode card */}
      <NextStepsCard />
    </main>
  );
}
