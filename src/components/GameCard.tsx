import { Link } from 'react-router-dom';
import type { Game } from '../types';
import CategoryPill from './CategoryPill';

interface Props {
  game: Game;
  score?: number;
  reasons?: string[];
  eligible?: boolean;
  rank?: number;
}

export default function GameCard({ game, score, reasons, eligible = true, rank }: Props) {
  return (
    <Link
      to={`/games/${game.id}`}
      className={`group relative flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-indigo-400/40 hover:bg-white/[0.07] ${
        eligible ? '' : 'opacity-60'
      }`}
    >
      {typeof rank === 'number' && (
        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-xs font-bold text-white shadow-lg">
          {rank}
        </div>
      )}
      <img
        src={game.imageUrl}
        alt={game.name}
        className="h-24 w-24 shrink-0 rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-white">{game.name}</h3>
          {typeof score === 'number' && (
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">
              {score}%
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <span>
            👥 {game.minPlayers}
            {game.maxPlayers !== game.minPlayers ? `–${game.maxPlayers}` : ''}
          </span>
          <span>⏱️ {game.minPlaytime}–{game.maxPlaytime} דק'</span>
          <span
            className={`rounded-full px-1.5 py-0.5 ${
              game.owned ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'
            }`}
          >
            {game.owned ? 'ברשותי' : 'לא ברשותי'}
          </span>
        </div>
        {reasons && reasons.length > 0 ? (
          <ul className="mt-0.5 space-y-0.5 text-xs text-indigo-200/80">
            {reasons.map((r) => (
              <li key={r}>✓ {r}</li>
            ))}
          </ul>
        ) : (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {game.categories.slice(0, 3).map((c) => (
              <CategoryPill key={c} label={c} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
