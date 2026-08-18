import { Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { useT } from '../i18n/useT';
import GameCard from '../components/GameCard';

export default function Home() {
  const { t } = useT();
  const games = useGameStore((s) => s.games);
  const owned = games.filter((g) => g.owned);
  const recentlyAdded = [...games].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary-600/20 via-accent-600/10 to-transparent p-6 sm:p-10">
        <h1 className="mb-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl">{t('heroTitle')}</h1>
        <Link
          to="/find"
          className="inline-block rounded-full bg-primary-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-primary-500/30 transition hover:scale-[1.02]"
        >
          {t('findGameCta')}
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label={t('statTotalGames')} value={games.length} icon="🎲" />
        <StatCard label={t('statOnShelf')} value={owned.length} icon="✅" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t('recentlyAdded')}</h2>
          <Link to="/library" className="text-sm font-medium text-primary-300 hover:text-primary-200">
            {t('viewAllLibrary')}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {recentlyAdded.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
      <div className="mb-1 text-2xl">{icon}</div>
      <div className="text-xl font-extrabold text-white">{value}</div>
      <div className="text-xs text-ink-400">{label}</div>
    </div>
  );
}
