import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { useLibraryStore, type GameLibrary } from '../store/useLibraryStore';
import { useT } from '../i18n/useT';
import type { GameMatchResult, QuestionnaireAnswers } from '../types';
import { rankGames, rankGamesForGroup, type GroupConstraints } from '../lib/matching';
import { buildLibraryShareUrl, decodeLibraryPayload } from '../lib/libraryShare';
import QuestionnaireForm from '../components/QuestionnaireForm';
import GameCard from '../components/GameCard';
import BarcodeScanner from '../components/BarcodeScanner';
import ShareLibraryModal from '../components/ShareLibraryModal';

type Mode = 'solo' | 'group';
type Step = 'setup' | 'shelf' | 'questions' | 'results';
const RESULT_COUNT_OPTIONS = [3, 5, 10] as const;

export default function Find() {
  const { t } = useT();
  const games = useGameStore((s) => s.games);
  const findByBarcode = useGameStore((s) => s.findByBarcode);
  const setOwnedMany = useGameStore((s) => s.setOwnedMany);
  const libraries = useLibraryStore((s) => s.libraries);
  const saveLibrary = useLibraryStore((s) => s.saveLibrary);
  const importLibrary = useLibraryStore((s) => s.importLibrary);
  const deleteLibrary = useLibraryStore((s) => s.deleteLibrary);

  const [step, setStep] = useState<Step>('setup');
  const [mode, setMode] = useState<Mode>('solo');
  const [playerCount, setPlayerCount] = useState(4);
  const [groupMinAge, setGroupMinAge] = useState(8);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(games.filter((g) => g.owned).map((g) => g.id)));
  const [activeLibraryId, setActiveLibraryId] = useState<string | null>(null);
  const [sharedBanner, setSharedBanner] = useState<{ name: string; count: number } | null>(null);
  const [shelfQuery, setShelfQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingLibraryName, setSavingLibraryName] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ name: string; url: string } | null>(null);
  const [answersList, setAnswersList] = useState<QuestionnaireAnswers[]>([]);
  const [results, setResults] = useState<GameMatchResult[]>([]);
  const [resultCount, setResultCount] = useState<number | 'all'>(5);
  const [searchParams, setSearchParams] = useSearchParams();

  // Import a shared library from the "lib" query param, if this link was opened from one.
  useEffect(() => {
    const encoded = searchParams.get('lib');
    if (!encoded) return;
    const shared = decodeLibraryPayload(encoded);
    if (!shared) return;
    const existingIds = new Set(games.map((g) => g.id));
    const validIds = shared.gameIds.filter((id) => existingIds.has(id));
    const lib = importLibrary(shared.name, validIds);
    setSelectedIds(new Set(validIds));
    setActiveLibraryId(lib.id);
    setSharedBanner({ name: shared.name, count: validIds.length });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('lib');
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pool = useMemo(() => games.filter((g) => selectedIds.has(g.id)), [games, selectedIds]);

  const filteredShelfGames = useMemo(() => {
    const q = shelfQuery.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => {
      const name = typeof g.name === 'string' ? g.name : `${g.name.he} ${g.name.en}`;
      return name.toLowerCase().includes(q);
    });
  }, [games, shelfQuery]);

  function toggleSelected(id: string) {
    setActiveLibraryId(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyLibrary(lib: GameLibrary) {
    const existingIds = new Set(games.map((g) => g.id));
    setSelectedIds(new Set(lib.gameIds.filter((id) => existingIds.has(id))));
    setActiveLibraryId(lib.id);
  }

  function handleDeleteLibrary(id: string) {
    if (!confirm(t('libraryDeleteBtn') + '?')) return;
    deleteLibrary(id);
    if (activeLibraryId === id) setActiveLibraryId(null);
  }

  function handleScanResult(code: string) {
    const game = findByBarcode(code);
    if (game) {
      setActiveLibraryId(null);
      setSelectedIds((prev) => new Set(prev).add(game.id));
      const name = typeof game.name === 'string' ? game.name : game.name.he;
      setScanFeedback({ ok: true, text: t('scanFoundAdded', { name }) });
    } else {
      setScanFeedback({ ok: false, text: t('scanNotFound') });
    }
    setShowScanner(false);
  }

  function handleSaveLibrary() {
    const name = savingLibraryName?.trim();
    if (!name) return;
    const ids = [...selectedIds];
    const lib = saveLibrary(name, ids);
    setActiveLibraryId(lib.id);
    setSavingLibraryName(null);
    setShareModal({ name, url: buildLibraryShareUrl(name, ids) });
  }

  const constraints: GroupConstraints = { playerCount, minAge: groupMinAge };

  function recomputeResults(list: QuestionnaireAnswers[]) {
    const ranked = mode === 'solo' ? rankGames(pool, list[0], constraints) : rankGamesForGroup(pool, list, constraints);
    setResults(ranked);
    setStep('results');
  }

  function handleQuestionSubmit(answers: QuestionnaireAnswers) {
    const next = [...answersList, answers];
    if (mode === 'solo' || next.length >= playerCount) {
      setAnswersList(next);
      recomputeResults(next);
    } else {
      setAnswersList(next);
    }
  }

  function proceedToQuestions() {
    setOwnedMany(selectedIds);
    setStep('questions');
  }

  function restart() {
    setStep('setup');
    setAnswersList([]);
    setResults([]);
  }

  if (step === 'setup') {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('findTitle')}</h1>
          <p className="text-sm text-slate-400">{t('findSubtitle')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-200">{t('whoFillsTitle')}</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('solo')}
              className={`rounded-2xl border p-4 text-right transition ${
                mode === 'solo' ? 'border-indigo-400/60 bg-indigo-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-2xl">🙋</div>
              <div className="mt-1 font-bold text-white">{t('soloTitle')}</div>
              <div className="text-xs text-slate-400">{t('soloDesc')}</div>
            </button>
            <button
              onClick={() => setMode('group')}
              className={`rounded-2xl border p-4 text-right transition ${
                mode === 'group' ? 'border-indigo-400/60 bg-indigo-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-2xl">👥</div>
              <div className="mt-1 font-bold text-white">{t('groupTitle')}</div>
              <div className="text-xs text-slate-400">{t('groupDesc')}</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-200">{t('playerCountLabel')}</span>
            <input
              type="number"
              min={1}
              max={20}
              value={playerCount}
              onChange={(e) => setPlayerCount(Math.max(1, Number(e.target.value)))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-200">{t('ageQuestionLabel')}</span>
            <input
              type="number"
              min={0}
              max={99}
              value={groupMinAge}
              onChange={(e) => setGroupMinAge(Math.max(0, Number(e.target.value)))}
              className="input"
            />
          </label>
        </div>
        <span className="-mt-3 text-xs text-slate-500">
          {mode === 'group' ? t('playerCountHintGroup') : t('playerCountHintSolo')} {t('ageHint')}
        </span>

        <button
          onClick={() => setStep('shelf')}
          className="rounded-full bg-indigo-500 py-3 text-sm font-bold text-white hover:bg-indigo-400"
        >
          {t('continueToShelf')}
        </button>
      </div>
    );
  }

  if (step === 'shelf') {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('shelfTitle')}</h1>
          <p className="text-sm text-slate-400">{t('shelfSubtitle')}</p>
        </div>

        {sharedBanner && (
          <p className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-sm font-semibold text-indigo-200">
            {t('librarySharedBanner', { name: sharedBanner.name, count: sharedBanner.count })}
          </p>
        )}

        {libraries.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-200">{t('myLibrariesTitle')}</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveLibraryId(null)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeLibraryId === null
                    ? 'bg-indigo-500 text-white'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {t('adHocOption')}
              </button>
              {libraries.map((lib) => (
                <span
                  key={lib.id}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    activeLibraryId === lib.id
                      ? 'bg-indigo-500 text-white'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <button onClick={() => applyLibrary(lib)}>
                    {lib.name} · {t('libraryGamesCount', { count: lib.gameIds.length })}
                  </button>
                  <button onClick={() => handleDeleteLibrary(lib.id)} className="text-current opacity-60 hover:opacity-100">
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={shelfQuery}
            onChange={(e) => setShelfQuery(e.target.value)}
            placeholder={t('shelfSearchPlaceholder')}
            className="input flex-1"
          />
          <button
            type="button"
            onClick={() => {
              setShowScanner((v) => !v);
              setScanFeedback(null);
            }}
            className="btn-secondary shrink-0 whitespace-nowrap"
          >
            {t('scanToFind')}
          </button>
        </div>

        {showScanner && <BarcodeScanner onResult={handleScanResult} />}
        {scanFeedback && (
          <p className={`text-sm font-semibold ${scanFeedback.ok ? 'text-emerald-300' : 'text-amber-300'}`}>
            {scanFeedback.text}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-200">{t('selectedCount', { count: selectedIds.size })}</span>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setActiveLibraryId(null);
                setSelectedIds(new Set(games.map((g) => g.id)));
              }}
              className="hover:text-indigo-300"
            >
              {t('selectAll')}
            </button>
            <button
              onClick={() => {
                setActiveLibraryId(null);
                setSelectedIds(new Set());
              }}
              className="hover:text-indigo-300"
            >
              {t('clearAll')}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {filteredShelfGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              selectable
              selected={selectedIds.has(game.id)}
              onToggleSelected={() => toggleSelected(game.id)}
            />
          ))}
        </div>

        <p className="text-center text-xs text-slate-500">
          {t('addMissingGameHint')}{' '}
          <Link to="/games/new" className="font-semibold text-indigo-300 hover:text-indigo-200">
            {t('addMissingGameLink')}
          </Link>
        </p>

        {selectedIds.size === 0 && <p className="text-sm text-amber-300">{t('noGamesSelectedWarning')}</p>}

        {savingLibraryName !== null ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={savingLibraryName}
              onChange={(e) => setSavingLibraryName(e.target.value)}
              placeholder={t('libraryNamePlaceholder')}
              className="input flex-1"
            />
            <button onClick={handleSaveLibrary} className="btn-secondary shrink-0">
              {t('saveLibraryConfirm')}
            </button>
            <button onClick={() => setSavingLibraryName(null)} className="btn-secondary shrink-0">
              {t('cancelBtn')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSavingLibraryName('')}
            disabled={selectedIds.size === 0}
            className="rounded-full border border-white/15 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('saveAsLibraryBtn')}
          </button>
        )}

        <button
          onClick={proceedToQuestions}
          disabled={selectedIds.size === 0}
          className="rounded-full bg-indigo-500 py-3 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('continueToQuestions')}
        </button>

        {shareModal && (
          <ShareLibraryModal name={shareModal.name} url={shareModal.url} onClose={() => setShareModal(null)} />
        )}
      </div>
    );
  }

  if (step === 'questions') {
    const currentIndex = answersList.length;
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-5">
        {mode === 'group' && (
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{t('playerOf', { current: currentIndex + 1, total: playerCount })}</span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(currentIndex / playerCount) * 100}%` }} />
            </div>
          </div>
        )}
        <QuestionnaireForm
          key={currentIndex}
          defaultName={mode === 'group' ? t('playerDefaultName', { n: currentIndex + 1 }) : t('meDefaultName')}
          requireName={mode === 'group'}
          submitLabel={mode === 'group' && currentIndex + 1 < playerCount ? t('nextPlayer') : t('findMyGame')}
          onSubmit={handleQuestionSubmit}
        />
      </div>
    );
  }

  // results
  const eligible = results.filter((r) => r.eligible);
  const ineligible = results.filter((r) => !r.eligible);
  const shownEligible = eligible.length > 0 ? eligible : results;
  const shown = resultCount === 'all' ? shownEligible : shownEligible.slice(0, resultCount);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('resultsTitle')}</h1>
        <button onClick={restart} className="btn-secondary">
          {t('newQuiz')}
        </button>
      </div>

      {pool.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
          {t('emptyShelfResults')}
        </div>
      ) : (
        <>
          {eligible.length === 0 && <p className="text-sm text-amber-300">{t('noneEligible', { count: playerCount })}</p>}

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{t('showCount')}</span>
            {RESULT_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setResultCount(n)}
                className={`rounded-full px-2.5 py-1 font-semibold transition ${
                  resultCount === n ? 'bg-indigo-500 text-white' : 'border border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setResultCount('all')}
              className={`rounded-full px-2.5 py-1 font-semibold transition ${
                resultCount === 'all' ? 'bg-indigo-500 text-white' : 'border border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              {t('showAll')}
            </button>
            <span>{t('showCountTop')}</span>
          </div>

          <div className="flex flex-col gap-3">
            {shown.map((r, i) => (
              <GameCard key={r.game.id} game={r.game} score={r.score} reasons={r.reasons} rank={i + 1} />
            ))}
          </div>
          {ineligible.length > 0 && eligible.length > 0 && (
            <details className="text-sm text-slate-400">
              <summary className="cursor-pointer select-none font-semibold text-slate-300">
                {t('moreIneligible', { count: ineligible.length })}
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                {ineligible.slice(0, 6).map((r) => (
                  <GameCard key={r.game.id} game={r.game} score={r.score} reasons={r.reasons} eligible={false} />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
