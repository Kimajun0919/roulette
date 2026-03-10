type Props = {
  engineReady: boolean;
  namesCount: number;
  winnerRank: number;
  goalWinner: string | null;
  onStart: () => void;
  onReset: () => void;
};

export function RunCard({ engineReady, namesCount, winnerRank, goalWinner, onStart, onReset }: Props) {
  return (
    <section className="card">
      <h2>실행</h2>
      <div className="row">
        <button onClick={onStart} disabled={!engineReady || namesCount === 0}>추첨 시작</button>
        <button onClick={onReset} disabled={!engineReady}>리셋</button>
      </div>
      <p className="muted">현재 당첨 순위 기준: {winnerRank}번째</p>
      <p>{goalWinner ? `🏆 당첨자: ${goalWinner}` : '아직 당첨자 없음'}</p>
    </section>
  );
}
