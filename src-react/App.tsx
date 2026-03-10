import { useEffect, useMemo, useState } from 'react';
import { getEngine } from './legacyEngine';
import type { WinnerType } from './engine/RouletteEngineAdapter';

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

  const onSpeedChange = (next: number) => {
    setSpeed(next);
    if (!engineReady) return;
    engine.setSpeed(next);
  };

  const onMapChange = (index: number) => {
    setSelectedMap(index);
    if (!engineReady) return;
    engine.setMap(index);
    engine.setNames(names);
    engine.setWinnerRank(winnerRank, winnerType, names.length);
  };

  return (
    <main className="container">
      <h1>Roulette React Migration (Phase 3)</h1>
      <p className="desc">레거시 inline script 없이 React 상태 + 어댑터 기반으로 UI를 이관 중입니다.</p>

      <section className="card">
        <h2>엔진 상태</h2>
        <p>{engineReady ? '✅ 준비 완료' : '⏳ 초기화 중...'}</p>
        <p className="muted">Canvas는 레거시 엔진이 body에 생성합니다(최종 단계에서 React mount로 이동 예정).</p>
      </section>

      <section className="card">
        <h2>참가자 입력</h2>
        <textarea
          rows={8}
          placeholder={'한 줄에 한 명씩 입력\n예) 김철수\n홍길동/2\n이영희*2'}
          value={namesInput}
          onChange={(e) => setNamesInput(e.target.value)}
        />
        <p className="muted">현재 인원: {names.length}명</p>
      </section>

      <section className="card">
        <h2>추첨 옵션</h2>
        <div className="row">
          <button className={winnerType === 'first' ? 'active' : ''} onClick={() => setWinnerType('first')}>첫번째</button>
          <button className={winnerType === 'last' ? 'active' : ''} onClick={() => setWinnerType('last')}>마지막</button>
          <button className={winnerType === 'custom' ? 'active' : ''} onClick={() => setWinnerType('custom')}>직접입력</button>
        </div>

        {winnerType === 'custom' && (
          <div className="row" style={{ marginTop: 10 }}>
            <label htmlFor="winner-rank">당첨 순위</label>
            <input
              id="winner-rank"
              type="number"
              min={1}
              value={winnerRankInput}
              onChange={(e) => setWinnerRankInput(Number(e.target.value || 1))}
            />
          </div>
        )}

        <div className="row" style={{ marginTop: 10 }}>
          <label htmlFor="speed">속도</label>
          <input
            id="speed"
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          />
          <span>{speed.toFixed(1)}x</span>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <label htmlFor="auto-recording">자동 녹화</label>
          <input
            id="auto-recording"
            type="checkbox"
            checked={autoRecording}
            onChange={(e) => setAutoRecording(e.target.checked)}
          />
        </div>
      </section>

      <section className="card">
        <h2>맵/테마</h2>
        <div className="row">
          <label htmlFor="map-select">맵</label>
          <select
            id="map-select"
            value={selectedMap}
            onChange={(e) => onMapChange(Number(e.target.value))}
            disabled={!engineReady}
          >
            {maps.map((m) => (
              <option key={m.index} value={m.index}>
                {m.index + 1}. {m.title}
              </option>
            ))}
          </select>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <label htmlFor="theme-select">테마</label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={!engineReady}
          >
            {themes.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="card">
        <h2>실행</h2>
        <div className="row">
          <button onClick={onStart} disabled={!engineReady || names.length === 0}>추첨 시작</button>
          <button onClick={onReset} disabled={!engineReady}>리셋</button>
        </div>
        <p className="muted">현재 당첨 순위 기준: {winnerRank}번째</p>
        <p>{goalWinner ? `🏆 당첨자: ${goalWinner}` : '아직 당첨자 없음'}</p>
      </section>

      <section className="card">
        <h2>다음 단계</h2>
        <ul>
          <li>추첨 데이터 백엔드 연동 (`src-react/api`) + 저장/조회 UI</li>
          <li>Figma MCP 연결 대비 컴포넌트 분해 (Panel, Form, ResultCard)</li>
          <li>엔진 canvas를 React mount 노드로 이동해 완전 분리</li>
        </ul>
      </section>
    </main>
  );
}
