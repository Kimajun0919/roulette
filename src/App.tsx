import { useState } from 'react';
import { ApiModeCard } from './components/ApiModeCard';
import { DrawOptionsCard } from './components/DrawOptionsCard';
import { EngineStatusCard } from './components/EngineStatusCard';
import { MapThemeCard } from './components/MapThemeCard';
import { MinimapCard } from './components/MinimapCard';
import { NextStepsCard } from './components/NextStepsCard';
import { ParticipantsCard } from './components/ParticipantsCard';
import { RunCard } from './components/RunCard';
import { useRouletteEngine } from './engine/useRouletteEngine';
import { useRouletteUi } from './store/useRouletteUi';

export function App() {
  const [canvasHostEl, setCanvasHostEl] = useState<HTMLDivElement | null>(null);
  const { state, dispatch, names, winnerRank, shuffleNames, loadFromAttendanceApi } = useRouletteUi();

  const {
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
        onShuffle={shuffleNames}
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
        recordingDownload={recordingDownload}
        onStart={start}
        onReset={reset}
        onFastForwardChange={setFastForwardEnabled}
      />
      <MinimapCard snapshot={uiSnapshot} onHoverViewport={setCameraViewportPosition} />
      <section className="card">
        <h2>순위 (React UI)</h2>
        {ranking.length === 0 ? (
          <p className="muted">아직 데이터 없음</p>
        ) : (
          <ol className="ranking-list">
            {ranking.slice(0, 20).map((item) => (
              <li key={`${item.rank}-${item.name}`} className={item.isTarget ? 'target' : ''}>
                <span>#{item.rank}</span>
                <span>{item.name}</span>
                <span>{item.isTarget ? '⭐' : ''}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
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
