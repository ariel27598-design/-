import { Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import GameCard from '../components/GameCard';

export default function Home() {
  const games = useGameStore((s) => s.games);
  const owned = games.filter((g) => g.owned);
  const recentlyAdded = [...games].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-fuchsia-600/10 to-transparent p-6 sm:p-10">
        <p className="mb-2 text-sm font-semibold text-indigo-300">ערב משחקים מתחיל כאן</p>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          סורקים ברקוד, עונים על שאלון קצר,
          <br />
          ומקבלים את משחק הקופסא המושלם
        </h1>
        <p className="mb-6 max-w-xl text-slate-300">
          יש לכם {owned.length} משחקים בספרייה. סרקו משחק מהמדף או ענו על שאלון קצר - לבד או בקבוצה - ותנו
          לנו למצוא לכם את ההתאמה הכי טובה.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/scan"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg transition hover:scale-[1.02]"
          >
            📷 סריקת ברקוד
          </Link>
          <Link
            to="/match"
            className="rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
          >
            🎯 מצאו לי משחק
          </Link>
          <Link
            to="/library"
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            📚 לספרייה המלאה
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="סה״כ משחקים" value={games.length} icon="🎲" />
        <StatCard label="ברשותי" value={owned.length} icon="✅" />
        <StatCard label="שיתופיים" value={games.filter((g) => g.cooperative).length} icon="🤝" />
        <StatCard label="קטגוריות" value={new Set(games.flatMap((g) => g.categories)).size} icon="🏷️" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">נוספו לאחרונה</h2>
          <Link to="/library" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">
            לכל הספרייה ←
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
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
