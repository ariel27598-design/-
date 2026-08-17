import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { useT } from '../i18n/useT';
import type { GameMatchResult, QuestionnaireAnswers } from '../types';
import { rankGames, rankGamesForGroup } from '../lib/matching';
import QuestionnaireForm from '../components/QuestionnaireForm';
import GameCard from '../components/GameCard';
import BarcodeScanner from '../components/BarcodeScanner';

type Mode = 'solo' | 'group';
type Step = 'setup' | 'shelf' | 'questions' | 'results';

export default function Find() {
  const { t } = useT();
  const games = useGameStore((s) => s.games);
  const findByBarcode = useGameStore((s) => s.findByBarcode);
  const setOwnedMany = useGameStore((s) => s.setOwnedMany);

  const [step, setStep] = useState<Step>('setup');
  const [mode, setMode] = useState<Mode>('solo');
  const [playerCount, setPlayerCount] = useState(4);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(games.filter((g) => g.owned).map((g) => g.id)));
  const [shelfQuery, setShelfQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [answersList, setAnswersList] = useState<QuestionnaireAnswers[]>([]);
  const [results, setResults] = useState<GameMatchResult[]>([]);

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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleScanResult(code: string) {
    const game = findByBarcode(code);
    if (game) {
      setSelectedIds((prev) => new Set(prev).add(game.id));
      const name = typeof game.name === 'string' ? game.name : game.name.he;
      setScanFeedback({ ok: true, text: t('scanFoundAdded', { name }) });
    } else {
      setScanFeedback({ ok: false, text: t('scanNotFound') });
    }
    setShowScanner(false);
  }

  function recomputeResults(list: QuestionnaireAnswers[]) {
    const ranked = mode === 'solo' ? rankGames(pool, list[0], playerCount) : rankGamesForGroup(pool, list, playerCount);
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
          <span className="text-xs text-slate-500">{mode === 'group' ? t('playerCountHintGroup') : t('playerCountHintSolo')}</span>
        </label>

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
            <button onClick={() => setSelectedIds(new Set(games.map((g) => g.id)))} className="hover:text-indigo-300">
              {t('selectAll')}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="hover:text-indigo-300">
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

        <button
          onClick={proceedToQuestions}
          disabled={selectedIds.size === 0}
          className="rounded-full bg-indigo-500 py-3 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('continueToQuestions')}
        </button>
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
          <div className="flex flex-col gap-3">
            {(eligible.length > 0 ? eligible : results).slice(0, 8).map((r, i) => (
              <GameCard
                key={r.game.id}
                game={r.game}
                score={r.score}
                reasons={r.reasons}
                rank={i + 1}
              />
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
