import { useEffect, useMemo, useState } from 'react';
import { startLegacyEngine } from './legacyEngine';

type WinnerType = 'first' | 'last' | 'custom';

export function App() {
  const [engine, setEngine] = useState<ReturnType<typeof startLegacyEngine> | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [namesInput, setNamesInput] = useState('');
  const [winnerType, setWinnerType] = useState<WinnerType>('first');
  const [winnerRankInput, setWinnerRankInput] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [goalWinner, setGoalWinner] = useState<string | null>(null);

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
    const r = startLegacyEngine();
    setEngine(r);

    const checkReady = () => {
      if (r.isReady) {
        setEngineReady(true);
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
  }, []);

  useEffect(() => {
    if (!engine) return;
    const onGoal = (ev: Event) => {
      const detail = (ev as CustomEvent<{ winner?: string }>).detail;
      setGoalWinner(detail?.winner || null);
    };
    engine.addEventListener('goal', onGoal);
    return () => engine.removeEventListener('goal', onGoal);
  }, [engine]);

  useEffect(() => {
    if (!engine || !engineReady) return;
    engine.setMarbles(names);
    engine.setWinningRank(Math.max(0, winnerRank - 1));
  }, [engine, engineReady, names, winnerRank]);

  const onStart = () => {
    if (!engine || !engineReady) return;
    setGoalWinner(null);
    engine.setWinningRank(Math.max(0, winnerRank - 1));
    engine.start();
  };

  const onReset = () => {
    if (!engine || !engineReady) return;
    setGoalWinner(null);
    engine.setMarbles(names);
    engine.setWinningRank(Math.max(0, winnerRank - 1));
  };

  const onSpeedChange = (next: number) => {
    setSpeed(next);
    if (!engine || !engineReady) return;
    engine.setSpeed(next);
  };

  return (
    <main className="container">
      <h1>Roulette React Migration (Phase 2)</h1>
      <p className="desc">레거시 엔진은 유지하고, 입력/옵션/실행 UI를 React 상태로 점진 이관 중입니다.</p>

      <section className="card">
        <h2>엔진 상태</h2>
        <p>{engineReady ? '✅ 준비 완료' : '⏳ 초기화 중...'}</p>
        <p className="muted">Canvas는 레거시 엔진이 body에 직접 생성합니다(공존 단계).</p>
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
        <h2>당첨 옵션</h2>
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
          <li>inline script 이벤트/DOM 제어를 React 컴포넌트로 완전 이관</li>
          <li>백엔드 추첨 데이터 API 연동 레이어 추가</li>
          <li>Figma MCP 연동 가능한 컴포넌트 구조로 재배치</li>
        </ul>
      </section>
    </main>
  );
}
