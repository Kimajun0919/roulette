import { useMemo, useReducer, useState } from 'react';
import { loadAttendanceWeights } from './api/haneulbit';
import { ApiModeCard } from './components/ApiModeCard';
import { DrawOptionsCard } from './components/DrawOptionsCard';
import { EngineStatusCard } from './components/EngineStatusCard';
import { MapThemeCard } from './components/MapThemeCard';
import { NextStepsCard } from './components/NextStepsCard';
import { ParticipantsCard } from './components/ParticipantsCard';
import { RunCard } from './components/RunCard';
import { useRouletteEngine } from './engine/useRouletteEngine';
import { createInitialUiState, uiReducer } from './store/uiState';

export function App() {
  const [canvasHostEl, setCanvasHostEl] = useState<HTMLDivElement | null>(null);
  const [state, dispatch] = useReducer(
    uiReducer,
    createInitialUiState((import.meta.env.VITE_API_BASE_URL as string | undefined) || 'https://haneulbit-api.holyimpact.org')
  );

  const names = useMemo(
    () => state.namesInput.split(/[\n,]/g).map((v) => v.trim()).filter(Boolean),
    [state.namesInput]
  );

  const winnerRank = useMemo(() => {
    if (state.winnerType === 'first') return 1;
    if (state.winnerType === 'last') return Math.max(1, names.length);
    return Math.max(1, state.winnerRankInput);
  }, [state.winnerRankInput, state.winnerType, names.length]);

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
    winnerType: state.winnerType,
    speed: state.speed,
    autoRecording: state.autoRecording,
    useSkills: state.useSkills,
    theme: state.theme,
  });

  const onMapChange = (index: number) => {
    dispatch({ type: 'setSelectedMap', value: index });
    setMap(index);
  };

  const loadFromAttendanceApi = async () => {
    try {
      dispatch({ type: 'setApiStatus', value: 'loading...' });
      const { me, weights } = await loadAttendanceWeights(state.apiBaseUrl, state.apiToken.trim());
      const weightedNames = weights.map((w) => `${w.name}*${Math.max(1, w.count)}`);
      dispatch({
        type: 'apiLoaded',
        role: me.role || 'unknown',
        weights,
        namesInput: weightedNames.join('\n'),
      });
      dispatch({ type: 'setApiStatus', value: `loaded ${weights.length} users (approved attendance based weights)` });
    } catch (err) {
      dispatch({ type: 'setApiStatus', value: `failed: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  return (
    <main className="container">
      <h1>Roulette React Migration (Phase 3+)</h1>
      <p className="desc">루트 화면도 React로 전환했고, Canvas는 React mount 노드 안에서 생성됩니다.</p>

      <EngineStatusCard engineReady={engineReady} />
      <ApiModeCard
        mode={state.mode}
        onModeChange={(v) => dispatch({ type: 'setMode', value: v })}
        apiBaseUrl={state.apiBaseUrl}
        apiToken={state.apiToken}
        apiStatus={state.apiStatus}
        apiRole={state.apiRole}
        weights={state.weights}
        onApiBaseUrlChange={(v) => dispatch({ type: 'setApiBaseUrl', value: v })}
        onApiTokenChange={(v) => dispatch({ type: 'setApiToken', value: v })}
        onLoadAttendance={loadFromAttendanceApi}
      />
      <ParticipantsCard
        namesInput={state.namesInput}
        namesCount={names.length}
        onChange={(v) => dispatch({ type: 'setNamesInput', value: v })}
        onShuffle={() => {
          const shuffled = [...names].sort(() => Math.random() - 0.5);
          dispatch({ type: 'setNamesInput', value: shuffled.join('\n') });
        }}
      />
      <DrawOptionsCard
        winnerType={state.winnerType}
        winnerRankInput={state.winnerRankInput}
        speed={state.speed}
        autoRecording={state.autoRecording}
        useSkills={state.useSkills}
        onWinnerTypeChange={(v) => dispatch({ type: 'setWinnerType', value: v })}
        onWinnerRankInputChange={(v) => dispatch({ type: 'setWinnerRankInput', value: v })}
        onSpeedChange={(v) => dispatch({ type: 'setSpeed', value: v })}
        onAutoRecordingChange={(v) => dispatch({ type: 'setAutoRecording', value: v })}
        onUseSkillsChange={(v) => dispatch({ type: 'setUseSkills', value: v })}
      />
      <MapThemeCard
        engineReady={engineReady}
        maps={maps}
        selectedMap={state.selectedMap}
        onMapChange={onMapChange}
        themes={themes}
        theme={state.theme}
        onThemeChange={(v) => dispatch({ type: 'setTheme', value: v })}
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
      <NextStepsCard />
    </main>
  );
}
