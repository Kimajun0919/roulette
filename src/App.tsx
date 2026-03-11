import { useEffect, useState } from 'react';
import { ApiModeCard } from './components/ApiModeCard';
import { DrawOptionsCard } from './components/DrawOptionsCard';
import { EngineStatusCard } from './components/EngineStatusCard';
import { FastForwardOverlay } from './components/FastForwardOverlay';
import { MapThemeCard } from './components/MapThemeCard';
import { MinimapCard } from './components/MinimapCard';
import { ParticipantsCard } from './components/ParticipantsCard';
import { RankingOverlay } from './components/RankingOverlay';
import { RunCard } from './components/RunCard';
import { WinnerSpotlightCard } from './components/WinnerSpotlightCard';
import { useRouletteEngine } from './engine/useRouletteEngine';
import { useRouletteUi } from './store/useRouletteUi';

const NOTICE_VERSION = 5;
const SHOP_IMAGE_URL = new URL('../assets/images/marblerouletteshop.png', import.meta.url).toString();

export function App() {
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [settingsHidden, setSettingsHidden] = useState(false);
  const [settingsCollapsed, setSettingsCollapsed] = useState(true);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { state, dispatch, names, winnerRank, shuffleNames, loadFromAttendanceApi } = useRouletteUi();

  const {
    engineReady,
    goalWinner,
    lastMessage,
    maps,
    ranking,
    uiSnapshot,
    recordingDownload,
    start,
    setMap,
    setFastForwardEnabled,
    setCameraViewportPosition,
  } = useRouletteEngine({
    canvasElement: canvasEl,
    names,
    winnerRank,
    winnerType: state.winnerType,
    speed: state.speed,
    autoRecording: state.autoRecording,
    useSkills: state.useSkills,
    theme: state.theme,
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', state.theme === 'light');
    return () => {
      document.documentElement.classList.remove('light');
    };
  }, [state.theme]);

  useEffect(() => {
    const lastViewed = window.localStorage.getItem('lastViewedNotification');
    if (lastViewed === null || Number(lastViewed) < NOTICE_VERSION) {
      setNoticeOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    setToastMessage(lastMessage);
    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 1200);
    return () => {
      window.clearTimeout(timer);
    };
  }, [lastMessage]);

  useEffect(() => {
    if (!goalWinner) return;
    const timer = window.setTimeout(() => {
      setSettingsHidden(false);
    }, 3000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [goalWinner]);

  const onMapChange = (sceneId: string) => {
    dispatch({ type: 'setSelectedSceneId', value: sceneId });
    setMap(sceneId);
  };

  const closeNotice = () => {
    setNoticeOpen(false);
    window.localStorage.setItem('lastViewedNotification', String(NOTICE_VERSION));
  };

  const handleStart = () => {
    if (!engineReady || names.length === 0) return;
    setSettingsHidden(true);
    start();
  };

  const winnerInfo = uiSnapshot?.winner ?? null;
  const winnersCount = ranking.filter((item) => item.isWinner).length;

  return (
    <main className="app-shell">
      <div className="canvas-host">
        <canvas ref={setCanvasEl} />
        <div className="stage-overlay-layer">
          <MinimapCard snapshot={uiSnapshot} onHoverViewport={setCameraViewportPosition} />
          <RankingOverlay ranking={ranking} themeName={state.theme} />
          <WinnerSpotlightCard
            winner={winnerInfo}
            winnerRank={winnerRank}
            winnersCount={winnersCount}
            totalCount={ranking.length}
            recordingDownload={recordingDownload}
            themeName={state.theme}
          />
          <FastForwardOverlay engineReady={engineReady} onChange={setFastForwardEnabled} />
        </div>
      </div>

      <div id="settings" className={settingsHidden ? 'hide' : ''}>
        <div className="right">
          <button id="btnToggleSettings" className="btn-toggle-settings" type="button" onClick={() => setSettingsCollapsed((prev) => !prev)}>
            <span>Settings</span>
            <i className="toggle-arrow">{settingsCollapsed ? '▲' : '▼'}</i>
          </button>
          <div className={`collapsible-rows${settingsCollapsed ? ' collapsed' : ''}`}>
            <MapThemeCard
              engineReady={engineReady}
              maps={maps}
              selectedSceneId={state.selectedSceneId}
              onMapChange={onMapChange}
              theme={state.theme}
              onThemeChange={(value) => dispatch({ type: 'setTheme', value })}
            />
            <DrawOptionsCard
              winnerType={state.winnerType}
              winnerRankInput={state.winnerRankInput}
              speed={state.speed}
              autoRecording={state.autoRecording}
              useSkills={state.useSkills}
              onWinnerTypeChange={(value) => dispatch({ type: 'setWinnerType', value })}
              onWinnerRankInputChange={(value) => dispatch({ type: 'setWinnerRankInput', value })}
              onSpeedChange={(value) => dispatch({ type: 'setSpeed', value })}
              onAutoRecordingChange={(value) => dispatch({ type: 'setAutoRecording', value })}
              onUseSkillsChange={(value) => dispatch({ type: 'setUseSkills', value })}
            />
            <ApiModeCard
              mode={state.mode}
              onModeChange={(value) => dispatch({ type: 'setMode', value })}
              apiBaseUrl={state.apiBaseUrl}
              apiToken={state.apiToken}
              apiStatus={state.apiStatus}
              apiRole={state.apiRole}
              weights={state.weights}
              onApiBaseUrlChange={(value) => dispatch({ type: 'setApiBaseUrl', value })}
              onApiTokenChange={(value) => dispatch({ type: 'setApiToken', value })}
              onLoadAttendance={loadFromAttendanceApi}
            />
          </div>
        </div>

        <div className="left">
          <ParticipantsCard
            namesInput={state.namesInput}
            namesCount={names.length}
            onChange={(value) => dispatch({ type: 'setNamesInput', value })}
          />
          <RunCard
            engineReady={engineReady}
            namesCount={names.length}
            onStart={handleStart}
            onShuffle={shuffleNames}
            onOpenNotice={() => setNoticeOpen(true)}
          />
          <EngineStatusCard engineReady={engineReady} lastMessage={lastMessage} />
        </div>
      </div>

      <div id="notice" style={{ display: noticeOpen ? 'flex' : 'none' }} role="dialog" aria-modal="true" aria-labelledby="notice-title">
        <h1 id="notice-title">Notice</h1>
        <div className="notice-body">
          <h2>커스텀 룰렛 기능 오픈!</h2>
          <p>나만의 특별한 룰렛을 만들 수 있는 커스텀 룰렛 기능이 오픈했어요!</p>
          <p>
            <a href="https://marblerouletteshop.com/intro/roulette" target="_blank" rel="noreferrer" className="shop-button holographic">
              <img src={SHOP_IMAGE_URL} width="125" height="125" alt="MarbleRoulette Shop" /> 룰렛 꾸미러 가기
            </a>
          </p>
        </div>
        <div className="notice-action">
          <button id="closeNotice" type="button" onClick={closeNotice}>
            Close
          </button>
        </div>
      </div>

      {toastMessage ? <div className="toast">{toastMessage}</div> : null}

      <div className="copyright">
        &copy; 2022-2026. <a href="https://lazygyu.net" target="_blank" rel="noreferrer">lazygyu</a>{' '}
        This program is freeware and may be used freely anywhere, including in broadcasts and videos.
      </div>
    </main>
  );
}
