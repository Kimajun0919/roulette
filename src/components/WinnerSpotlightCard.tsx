import type { CSSProperties } from 'react';
import { Themes } from '../engine-core/data/constants';

type WinnerInfo = {
  name: string;
  hue: number;
} | null;

type Props = {
  winner: WinnerInfo;
  winnerRank: number;
  winnersCount: number;
  totalCount: number;
  recordingDownload: { url: string; fileName: string } | null;
  themeName: string;
};

export function WinnerSpotlightCard({
  winner,
  winnerRank,
  winnersCount,
  totalCount,
  recordingDownload,
  themeName,
}: Props) {
  if (!winner) return null;

  const theme = Themes[themeName] ?? Themes.dark;
  const textShadow = theme.winnerOutline
    ? `-1px 0 ${theme.winnerOutline}, 0 1px ${theme.winnerOutline}, 1px 0 ${theme.winnerOutline}, 0 -1px ${theme.winnerOutline}`
    : undefined;

  const style = {
    '--winner-bg': theme.winnerBackground,
    '--winner-text': theme.winnerText,
    '--winner-ball': `hsl(${winner.hue} 100% ${theme.marbleLightness}%)`,
  } as CSSProperties;

  return (
    <aside className="winner-overlay" style={style}>
      <div className="winner-content">
        <div className="winner-ball" aria-hidden="true" />
        <div className="winner-copy" style={{ textShadow }}>
          <span className="winner-kicker">Winner</span>
          <strong>{winner.name}</strong>
          <span className="winner-meta">
            #{winnerRank} target · {winnersCount} / {totalCount}
          </span>
          {recordingDownload ? (
            <a className="winner-download" href={recordingDownload.url} download={recordingDownload.fileName}>
              Download recording
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
