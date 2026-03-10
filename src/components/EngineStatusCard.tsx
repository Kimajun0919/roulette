type Props = {
  engineReady: boolean;
};

export function EngineStatusCard({ engineReady }: Props) {
  return (
    <section className="card">
      <h2>엔진 상태</h2>
      <p>{engineReady ? '✅ 준비 완료' : '⏳ 초기화 중...'}</p>
      <p className="muted">Canvas는 React의 Canvas Host 영역 안에서 생성됩니다.</p>
    </section>
  );
}
