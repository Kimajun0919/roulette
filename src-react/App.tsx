import { useMemo, useState } from 'react';
import { loadAttendanceWeights, type AttendanceWeight } from './api/haneulbit';
import { ApiModeCard } from './components/ApiModeCard';
import { DrawOptionsCard } from './components/DrawOptionsCard';
import { EngineStatusCard } from './components/EngineStatusCard';
import { MapThemeCard } from './components/MapThemeCard';
import { NextStepsCard } from './components/NextStepsCard';
import { ParticipantsCard } from './components/ParticipantsCard';
import { RunCard } from './components/RunCard';
import type { WinnerType } from './engine/RouletteEngineAdapter';
import { useRouletteEngine } from './engine/useRouletteEngine';

export function App() {
  const [canvasHostEl, setCanvasHostEl] = useState<HTMLDivElement | null>(null);
  const [namesInput, setNamesInput] = useState('');
  const [winnerType, setWinnerType] = useState<WinnerType>('first');
  const [winnerRankInput, setWinnerRankInput] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [autoRecording, setAutoRecording] = useState(true);
  const [useSkills, setUseSkills] = useState(true);
  const [selectedMap, setSelectedMap] = useState(0);
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

  const {
    engineReady,
    goalWinner,
    lastMessage,
    maps,
    themes,
    start,
    reset,
    setMap,
  } = useRouletteEngine({
    mountElement: canvasHostEl,
    names,
    winnerRank,
    winnerType,
    speed,
    autoRecording,
    useSkills,
    theme,
  });

  const onMapChange = (index: number) => {
    setSelectedMap(index);
    setMap(index);
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
        onSpeedChange={setSpeed}
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
        onStart={start}
        onReset={reset}
      />
      <section className="card">
        <h2>엔진 메시지</h2>
        <p className="muted">{lastMessage ?? '아직 메시지 없음'}</p>
      </section>
      <section className="card">
        <h2>Canvas Host (React mount)</h2>
        <div ref={setCanvasHostEl} className="canvas-host" />
      </section>
      {/* data sync card removed: replaced by API mode card */}
      <NextStepsCard />
    </main>
  );
}
