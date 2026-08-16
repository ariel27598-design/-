import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { getYoutubeEmbedUrl } from '../lib/video';
import CategoryPill from '../components/CategoryPill';

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const games = useGameStore((s) => s.games);
  const toggleOwned = useGameStore((s) => s.toggleOwned);
  const game = games.find((g) => g.id === id);

  if (!game) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
        <p>המשחק לא נמצא בספרייה.</p>
        <button onClick={() => navigate('/library')} className="btn-secondary">
          חזרה לספרייה
        </button>
      </div>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(game.videoUrl);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row">
        <img
          src={game.imageUrl}
          alt={game.name}
          className="h-48 w-48 shrink-0 self-center rounded-2xl object-cover sm:self-start"
        />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-2xl font-bold text-white">{game.name}</h1>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                game.owned ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'
              }`}
            >
              {game.owned ? '✓ ברשותי' : 'לא ברשותי'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {game.categories.map((c) => (
              <CategoryPill key={c} label={c} />
            ))}
            {game.cooperative && <CategoryPill label="🤝 שיתופי" />}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-300 sm:grid-cols-3">
            <Stat label="שחקנים" value={`${game.minPlayers}–${game.maxPlayers}`} />
            <Stat label="זמן משחק" value={`${game.minPlaytime}–${game.maxPlaytime} דק'`} />
            <Stat label="גיל מינימלי" value={`${game.minAge}+`} />
            <Stat label="מורכבות" value={`${game.weight}/5`} />
            <Stat label="מזל/אסטרטגיה" value={`${game.luckVsStrategy}/5`} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => toggleOwned(game.id)}
              className="btn-secondary"
            >
              {game.owned ? 'סמן כלא ברשותי' : 'סמן כברשותי'}
            </button>
            <Link to={`/games/${game.id}/edit`} className="btn-secondary">
              ✏️ עריכה
            </Link>
          </div>
        </div>
      </div>

      {game.description && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-indigo-300">איך משחקים</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{game.description}</p>
        </div>
      )}

      {game.videoUrl && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-indigo-300">סרטון הסבר</h2>
          {embedUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl">
              <iframe
                src={embedUrl}
                title={`סרטון הסבר - ${game.name}`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a
              href={game.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm font-semibold text-indigo-300 hover:text-indigo-200"
            >
              ▶️ צפייה בסרטון הסבר ↗
            </a>
          )}
        </div>
      )}

      {game.barcodes.length > 0 && (
        <div className="text-xs text-slate-500">
          ברקודים: <span dir="ltr">{game.barcodes.join(', ')}</span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="font-semibold text-white">{value}</div>
    </div>
  );
}
