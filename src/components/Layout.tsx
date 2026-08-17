import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useLanguageStore } from '../store/useLanguageStore';
import PuzzleLogo from './PuzzleLogo';

export default function Layout() {
  const { t, lang } = useT();
  const toggleLang = useLanguageStore((s) => s.toggleLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('appName');
  }, [lang, t]);

  const NAV_ITEMS = [
    { to: '/', label: t('navHome'), icon: '🏠', end: true },
    { to: '/find', label: t('navFind'), icon: '🎯', end: false },
    { to: '/games/new', label: t('navAdd'), icon: '➕', end: false },
    { to: '/library', label: t('navLibrary'), icon: '📚', end: false },
  ];

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <PuzzleLogo className="h-7 w-7 shrink-0" />
            <span className="bg-gradient-to-l from-indigo-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
              {t('appName')}
            </span>
          </NavLink>
          <div className="flex items-center gap-2">
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
            <button
              onClick={toggleLang}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
              aria-label="Toggle language"
            >
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
          </div>
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
