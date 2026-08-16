import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { ALL_CATEGORIES, type Category } from '../types';
import GameCard from '../components/GameCard';
import CategoryPill from '../components/CategoryPill';

type OwnedFilter = 'all' | 'owned' | 'missing';

export default function Library() {
  const games = useGameStore((s) => s.games);
  const [query, setQuery] = useState('');
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [cooperativeOnly, setCooperativeOnly] = useState(false);

  function toggleCategory(cat: Category) {
    setActiveCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  const filtered = useMemo(() => {
    return games
      .filter((g) => {
        if (ownedFilter === 'owned' && !g.owned) return false;
        if (ownedFilter === 'missing' && g.owned) return false;
        if (cooperativeOnly && !g.cooperative) return false;
        if (activeCategories.length > 0 && !activeCategories.some((c) => g.categories.includes(c))) return false;
        if (query.trim() && !g.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }, [games, ownedFilter, activeCategories, cooperativeOnly, query]);

  const ownedCount = games.filter((g) => g.owned).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">ספריית המשחקים</h1>
          <p className="text-sm text-slate-400">
            {games.length} משחקים בסך הכול · {ownedCount} ברשותכם
          </p>
        </div>
        <Link
          to="/games/new"
          className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-400"
        >
          ➕ הוספת משחק
        </Link>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש לפי שם..."
        className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', 'הכול'],
            ['owned', 'ברשותי'],
            ['missing', 'לא ברשותי'],
          ] as [OwnedFilter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setOwnedFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              ownedFilter === value
                ? 'bg-indigo-500 text-white'
                : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setCooperativeOnly((v) => !v)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            cooperativeOnly
              ? 'bg-indigo-500 text-white'
              : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          🤝 שיתופי בלבד
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ALL_CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            active={activeCategories.includes(cat)}
            onClick={() => toggleCategory(cat)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
          לא נמצאו משחקים התואמים לסינון.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
