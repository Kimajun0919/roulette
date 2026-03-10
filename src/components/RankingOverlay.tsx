import { useEffect, useRef } from 'react';
import { Themes } from '../engine-core/data/constants';

type RankingItem = {
  rank: number;
  name: string;
  hue: number;
  isTarget: boolean;
  isWinner: boolean;
};

type Props = {
  ranking: RankingItem[];
  themeName: string;
};

export function RankingOverlay({ ranking, themeName }: Props) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const targetIndex = ranking.findIndex((item) => item.isTarget);
  const winnersCount = ranking.filter((item) => item.isWinner).length;
  const theme = Themes[themeName] ?? Themes.dark;
  const textShadow = theme.rankStroke
    ? `-1px 0 ${theme.rankStroke}, 0 1px ${theme.rankStroke}, 1px 0 ${theme.rankStroke}, 0 -1px ${theme.rankStroke}`
    : undefined;

  useEffect(() => {
    if (targetIndex < 0 || !listRef.current) return;
    const item = listRef.current.querySelector<HTMLElement>(`[data-rank-index="${targetIndex}"]`);
    item?.scrollIntoView({ block: 'center' });
  }, [targetIndex, ranking.length]);

  if (ranking.length === 0) return null;

  return (
    <aside className="ranking-overlay" aria-label="Ranking overlay">
      <span className="ranking-count">
        {winnersCount} / {ranking.length}
      </span>
      <ol ref={listRef} className="ranking-list">
        {ranking.map((item, index) => {
          const prefix = item.isWinner ? (item.isTarget ? '☆ ' : '✔ ') : '';
          return (
            <li
              key={`${item.rank}-${item.name}`}
              data-rank-index={index}
              className={`${item.isWinner ? 'is-winner' : ''} ${item.isTarget ? 'is-target' : ''}`.trim()}
              style={{
                color: `hsl(${item.hue} 100% ${theme.marbleLightness}%)`,
                textShadow,
              }}
            >
              {prefix}
              {item.name} #{item.rank}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
