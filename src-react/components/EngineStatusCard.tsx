type Props = {
  engineReady: boolean;
};

export function EngineStatusCard({ engineReady }: Props) {
  return (
    <section className="card">
      <h2>엔진 상태</h2>
      <p>{engineReady ? '✅ 준비 완료' : '⏳ 초기화 중...'}</p>
      <p className="muted">Canvas는 레거시 엔진이 body에 생성합니다(최종 단계에서 React mount로 이동 예정).</p>
    </section>
  );
}
