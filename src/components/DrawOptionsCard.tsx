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
    <>
      <div className="row row-toggles">
        <div className="toggle-item">
          <label htmlFor="chkAutoRecording">
            <i className="icon record" />
            <span>Recording</span>
          </label>
          <input
            id="chkAutoRecording"
            type="checkbox"
            checked={autoRecording}
            onChange={(e) => onAutoRecordingChange(e.target.checked)}
          />
        </div>
        <div className="toggle-item">
          <label htmlFor="chkSkill">
            <i className="icon bomb" />
            <span>Using skills</span>
          </label>
          <input id="chkSkill" type="checkbox" checked={useSkills} onChange={(e) => onUseSkillsChange(e.target.checked)} />
        </div>
      </div>

      <div className="row">
        <label>
          <i className="icon trophy" />
          <span>The winner is</span>
        </label>
        <div className="btn-group">
          <button type="button" className={winnerType === 'first' ? 'active' : ''} onClick={() => onWinnerTypeChange('first')}>
            First
          </button>
          <button type="button" className={winnerType === 'last' ? 'active' : ''} onClick={() => onWinnerTypeChange('last')}>
            Last
          </button>
          <input
            id="in_winningRank"
            type="number"
            min={1}
            value={winnerRankInput}
            className={winnerType === 'custom' ? 'active' : ''}
            onChange={(e) => onWinnerRankInputChange(Number(e.target.value || 1))}
            onFocus={() => onWinnerTypeChange('custom')}
          />
        </div>
      </div>

      <div className="row">
        <label htmlFor="speed">
          <span>Speed</span>
        </label>
        <div className="speed-field">
          <input id="speed" type="range" min={0.5} max={3} step={0.1} value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))} />
          <span>{speed.toFixed(1)}x</span>
        </div>
      </div>
    </>
  );
}
