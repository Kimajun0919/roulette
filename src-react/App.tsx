import { useMemo, useState } from 'react';
import { startLegacyEngine } from './legacyEngine';

const phases = [
  '1) React + Vite 공존 환경 구성',
  '2) 레거시 엔진 어댑터 계층 구축',
  '3) UI 상태를 React 컴포넌트로 점진 이전',
  '4) 추첨 데이터 API 연동 계층 분리',
  '5) Figma MCP 연동 기반 UI 개선',
  '6) Parcel 제거 및 React 빌드로 완전 전환',
];

export function App() {
  const [engineStarted, setEngineStarted] = useState(false);

  const nextActions = useMemo(
    () => [
      '레거시 inline script(HTML) 기능을 React 컴포넌트로 나눠 이전',
      '입력 상태(참가자/당첨순위/옵션)를 useReducer로 이관',
      '백엔드 연동용 API 클라이언트 초안 작성',
    ],
    []
  );

  return (
    <main className="container">
      <h1>Roulette React Migration</h1>
      <p className="desc">
        최종 목표: 전체를 React 구조로 전환하고, 이후 Figma MCP로 UI 개선 + 백단 추첨 데이터 연동
      </p>

      <section className="card">
        <h2>현재 단계</h2>
        <ul>
          {phases.map((phase) => (
            <li key={phase}>{phase}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>레거시 엔진 부팅 (공존 검증)</h2>
        <button
          onClick={() => {
            startLegacyEngine();
            setEngineStarted(true);
          }}
        >
          레거시 Roulette 엔진 시작
        </button>
        <p>{engineStarted ? '엔진 시작됨 (canvas가 body에 생성됩니다).' : '아직 시작 전'}</p>
      </section>

      <section className="card">
        <h2>다음 작업 (바로 진행)</h2>
        <ul>
          {nextActions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
