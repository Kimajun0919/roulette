import type { WinnerType } from '../engine/RouletteEngineAdapter';

type Props = {
  winnerType: WinnerType;
  winnerRankInput: number;
  speed: number;
  autoRecording: boolean;
  useSkills: boolean;
  onWinnerTypeChange: (value: WinnerType) => void;
  onWinnerRankInputChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
  onAutoRecordingChange: (value: boolean) => void;
  onUseSkillsChange: (value: boolean) => void;
};

export function DrawOptionsCard(props: Props) {
  const {
    winnerType,
    winnerRankInput,
    speed,
    autoRecording,
    useSkills,
    onWinnerTypeChange,
    onWinnerRankInputChange,
    onSpeedChange,
    onAutoRecordingChange,
    onUseSkillsChange,
  } = props;

  return (
    <section className="card">
      <h2>추첨 옵션</h2>
      <div className="row">
        <button className={winnerType === 'first' ? 'active' : ''} onClick={() => onWinnerTypeChange('first')}>첫번째</button>
        <button className={winnerType === 'last' ? 'active' : ''} onClick={() => onWinnerTypeChange('last')}>마지막</button>
        <button className={winnerType === 'custom' ? 'active' : ''} onClick={() => onWinnerTypeChange('custom')}>직접입력</button>
      </div>

      {winnerType === 'custom' && (
        <div className="row" style={{ marginTop: 10 }}>
          <label htmlFor="winner-rank">당첨 순위</label>
          <input
            id="winner-rank"
            type="number"
            min={1}
            value={winnerRankInput}
            onChange={(e) => onWinnerRankInputChange(Number(e.target.value || 1))}
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
          onChange={(e) => onAutoRecordingChange(e.target.checked)}
        />
      </div>

      <div className="row" style={{ marginTop: 10 }}>
        <label htmlFor="use-skills">스킬 사용</label>
        <input
          id="use-skills"
          type="checkbox"
          checked={useSkills}
          onChange={(e) => onUseSkillsChange(e.target.checked)}
        />
      </div>
    </section>
  );
}
