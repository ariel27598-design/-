import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'בית', icon: '🏠', end: true },
  { to: '/scan', label: 'סריקה', icon: '📷', end: false },
  { to: '/match', label: 'שאלון', icon: '🎯', end: false },
  { to: '/library', label: 'ספרייה', icon: '📚', end: false },
  { to: '/games/new', label: 'הוספה', icon: '➕', end: false },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="text-2xl">🎲</span>
            <span className="bg-gradient-to-l from-indigo-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
              שולחן משחקים
            </span>
          </NavLink>
          <nav className="hidden gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-200'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 sm:pb-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/90 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-5xl items-stretch justify-between px-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                  isActive ? 'text-indigo-300' : 'text-slate-400'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
