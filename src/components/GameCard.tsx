import { Link } from 'react-router-dom';
import type { Game, MatchReason } from '../types';
import { useT } from '../i18n/useT';
import { renderReason } from '../lib/reasonText';
import CategoryPill from './CategoryPill';

interface Props {
  game: Game;
  score?: number;
  reasons?: MatchReason[];
  eligible?: boolean;
  rank?: number;
  /** Render a selection checkbox instead of navigating on click (used in the shelf-select step). */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
}

export default function GameCard({
  game,
  score,
  reasons,
  eligible = true,
  rank,
  selectable,
  selected,
  onToggleSelected,
}: Props) {
  const { t, tCategory, tText } = useT();

  const content = (
    <>
      {typeof rank === 'number' && (
        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-accent-500 text-xs font-bold text-white shadow-lg">
          {rank}
        </div>
      )}
      {selectable && (
        <div
          className={`absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg ${
            selected ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-white/30 bg-ink-900 text-transparent'
          }`}
        >
          ✓
        </div>
      )}
      <img
        src={game.imageUrl}
        alt={tText(game.name)}
        className="h-24 w-24 shrink-0 rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-white">{tText(game.name)}</h3>
          {typeof score === 'number' && (
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">
              {score}%
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
          <span>
            👥 {game.minPlayers}
            {game.maxPlayers !== game.minPlayers ? `–${game.maxPlayers}` : ''}
          </span>
          <span>
            ⏱️ {game.minPlaytime}–{game.maxPlaytime} {t('minutesShort')}
          </span>
          {!selectable && (
            <span
              className={`rounded-full px-1.5 py-0.5 ${
                game.owned ? 'bg-emerald-500/15 text-emerald-300' : 'bg-ink-500/15 text-ink-400'
              }`}
            >
              {game.owned ? t('onShelf') : t('notOnShelf')}
            </span>
          )}
        </div>
        {reasons && reasons.length > 0 ? (
          <ul className="mt-0.5 space-y-0.5 text-xs text-primary-200/80">
            {reasons.map((r, i) => (
              <li key={i}>✓ {renderReason(r, { t, tCategory })}</li>
            ))}
          </ul>
        ) : (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {game.cooperative && <CategoryPill label={t('cooperativeBadge')} />}
            {game.categories.slice(0, game.cooperative ? 2 : 3).map((c) => (
              <CategoryPill key={c} label={tCategory(c)} />
            ))}
          </div>
        )}
      </div>
    </>
  );

  const className = `group relative flex gap-3 rounded-2xl border p-3 transition ${
    selectable
      ? selected
        ? 'border-emerald-400/60 bg-emerald-500/10'
        : 'border-white/10 bg-white/[0.04] hover:border-white/20'
      : `border-white/10 bg-white/[0.04] hover:border-primary-400/40 hover:bg-white/[0.07] ${eligible ? '' : 'opacity-60'}`
  }`;

  if (selectable) {
    return (
      <button type="button" onClick={onToggleSelected} className={`${className} text-right`}>
        {content}
      </button>
    );
  }

  return (
    <Link to={`/games/${game.id}`} className={className}>
      {content}
    </Link>
  );
}
