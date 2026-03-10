type Props = {
  engineReady: boolean;
  namesCount: number;
  winnerRank: number;
  goalWinner: string | null;
  recordingDownload: { url: string; fileName: string } | null;
  onStart: () => void;
  onReset: () => void;
  onFastForwardChange: (enabled: boolean) => void;
};

export function RunCard({
  engineReady,
  namesCount,
  winnerRank,
  goalWinner,
  recordingDownload,
  onStart,
  onReset,
  onFastForwardChange,
}: Props) {
  return (
    <section className="card">
      <h2>실행</h2>
      <div className="row">
        <button onClick={onStart} disabled={!engineReady || namesCount === 0}>
          추첨 시작
        </button>
        <button onClick={onReset} disabled={!engineReady}>
          리셋
        </button>
        <button
          type="button"
          onMouseDown={() => onFastForwardChange(true)}
          onMouseUp={() => onFastForwardChange(false)}
          onMouseLeave={() => onFastForwardChange(false)}
          onTouchStart={() => onFastForwardChange(true)}
          onTouchEnd={() => onFastForwardChange(false)}
          disabled={!engineReady}
        >
          ⏩ 누르고 있는 동안 2x
        </button>
      </div>
      <p className="muted">현재 당첨 순위 기준: {winnerRank}번째</p>
      <p>{goalWinner ? `🏆 당첨자: ${goalWinner}` : '아직 당첨자 없음'}</p>
      {recordingDownload && (
        <p className="muted">
          <a href={recordingDownload.url} download={recordingDownload.fileName}>
            최신 녹화 파일 다운로드
          </a>
        </p>
      )}
    </section>
  );
}
