import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { getYoutubeEmbedUrl } from '../lib/video';
import { useT } from '../i18n/useT';
import CategoryPill from '../components/CategoryPill';

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, tCategory, tText } = useT();
  const games = useGameStore((s) => s.games);
  const toggleOwned = useGameStore((s) => s.toggleOwned);
  const game = games.find((g) => g.id === id);

  if (!game) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
        <p>{t('gameNotFound')}</p>
        <button onClick={() => navigate('/library')} className="btn-secondary">
          {t('backToLibrary')}
        </button>
      </div>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(game.videoUrl);
  const name = tText(game.name);
  const description = tText(game.description);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row">
        <img
          src={game.imageUrl}
          alt={name}
          className="h-48 w-48 shrink-0 self-center rounded-2xl object-cover sm:self-start"
        />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                game.owned ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'
              }`}
            >
              {game.owned ? `✓ ${t('onShelf')}` : t('notOnShelf')}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <CategoryPill label={game.cooperative ? t('cooperativeBadge') : t('competitiveBadge')} />
            {game.categories.map((c) => (
              <CategoryPill key={c} label={tCategory(c)} />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-300 sm:grid-cols-3">
            <Stat label={t('players')} value={`${game.minPlayers}–${game.maxPlayers}`} />
            <Stat label={t('playtime')} value={`${game.minPlaytime}–${game.maxPlaytime} ${t('minutesShort')}`} />
            <Stat label={t('minAge')} value={`${game.minAge}+`} />
            <Stat label={t('complexity')} value={`${game.weight}/5`} />
            <Stat label={t('luckVsStrategy')} value={`${game.luckVsStrategy}/5`} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => toggleOwned(game.id)} className="btn-secondary">
              {game.owned ? t('markNotOnShelf') : t('markOnShelf')}
            </button>
            <Link to={`/games/${game.id}/edit`} className="btn-secondary">
              {t('edit')}
            </Link>
          </div>
        </div>
      </div>

      {description && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-indigo-300">{t('howToPlay')}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{description}</p>
        </div>
      )}

      {game.videoUrl && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-indigo-300">{t('explainerVideo')}</h2>
          {embedUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl">
              <iframe
                src={embedUrl}
                title={`${t('explainerVideo')} - ${name}`}
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
              ▶️ {t('watchVideo')}
            </a>
          )}
        </div>
      )}

      {game.barcodes.length > 0 && (
        <div className="text-xs text-slate-500">
          {t('barcodesLabel')}: <span dir="ltr">{game.barcodes.join(', ')}</span>
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
