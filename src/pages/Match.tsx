import { useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { GameMatchResult, QuestionnaireAnswers } from '../types';
import { rankGames, rankGamesForGroup } from '../lib/matching';
import QuestionnaireForm from '../components/QuestionnaireForm';
import GameCard from '../components/GameCard';

type Mode = 'solo' | 'group';
type Step = 'setup' | 'questions' | 'results';

export default function Match() {
  const games = useGameStore((s) => s.games);
  const [step, setStep] = useState<Step>('setup');
  const [mode, setMode] = useState<Mode>('solo');
  const [playerCount, setPlayerCount] = useState(4);
  const [answersList, setAnswersList] = useState<QuestionnaireAnswers[]>([]);
  const [ownedOnly, setOwnedOnly] = useState(true);
  const [results, setResults] = useState<GameMatchResult[]>([]);

  const pool = useMemo(() => (ownedOnly ? games.filter((g) => g.owned) : games), [games, ownedOnly]);

  function recomputeResults(list: QuestionnaireAnswers[]) {
    const ranked =
      mode === 'solo'
        ? rankGames(pool, list[0], playerCount)
        : rankGamesForGroup(pool, list, playerCount);
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

  function restart() {
    setStep('setup');
    setAnswersList([]);
    setResults([]);
  }

  function toggleOwnedOnlyAndRecompute(value: boolean) {
    setOwnedOnly(value);
    const newPool = value ? games.filter((g) => g.owned) : games;
    const ranked =
      mode === 'solo'
        ? rankGames(newPool, answersList[0], playerCount)
        : rankGamesForGroup(newPool, answersList, playerCount);
    setResults(ranked);
  }

  if (step === 'setup') {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">מצאו את המשחק המושלם</h1>
          <p className="text-sm text-slate-400">כמה שאלות קצרות ונמצא לכם את ההתאמה הכי טובה.</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-200">מי ממלא את השאלון?</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('solo')}
              className={`rounded-2xl border p-4 text-right transition ${
                mode === 'solo'
                  ? 'border-indigo-400/60 bg-indigo-500/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-2xl">🙋</div>
              <div className="mt-1 font-bold text-white">אני לבד</div>
              <div className="text-xs text-slate-400">ממלא/ת בשבילי או בשביל כולם</div>
            </button>
            <button
              onClick={() => setMode('group')}
              className={`rounded-2xl border p-4 text-right transition ${
                mode === 'group'
                  ? 'border-indigo-400/60 bg-indigo-500/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-2xl">👥</div>
              <div className="mt-1 font-bold text-white">כל אחד בנפרד</div>
              <div className="text-xs text-slate-400">כל משתתף ממלא שאלון וממצעים ביחד</div>
            </button>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-200">כמה שחקנים ישבו סביב השולחן?</span>
          <input
            type="number"
            min={1}
            max={20}
            value={playerCount}
            onChange={(e) => setPlayerCount(Math.max(1, Number(e.target.value)))}
            className="input"
          />
          <span className="text-xs text-slate-500">
            {mode === 'group'
              ? 'כל אחד מהם ימלא שאלון קצר בתורו.'
              : 'נשתמש במספר הזה כדי לוודא שהמשחק תומך בכמות השחקנים שלכם.'}
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={ownedOnly}
            onChange={(e) => setOwnedOnly(e.target.checked)}
            className="h-4 w-4 accent-indigo-500"
          />
          התאימו רק בין המשחקים שברשותי
        </label>

        <button
          onClick={() => setStep('questions')}
          className="rounded-full bg-indigo-500 py-3 text-sm font-bold text-white hover:bg-indigo-400"
        >
          בואו נתחיל ←
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
            <span>
              שחקן/ית {currentIndex + 1} מתוך {playerCount}
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${(currentIndex / playerCount) * 100}%` }}
              />
            </div>
          </div>
        )}
        <QuestionnaireForm
          key={currentIndex}
          defaultName={mode === 'group' ? `שחקן/ית ${currentIndex + 1}` : 'אני'}
          requireName={mode === 'group'}
          submitLabel={
            mode === 'group' && currentIndex + 1 < playerCount ? 'הבא/ה בתור →' : 'מצאו לי משחק! 🎲'
          }
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
        <h1 className="text-2xl font-bold text-white">התוצאות שלכם</h1>
        <button onClick={restart} className="btn-secondary">
          🔄 שאלון חדש
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={ownedOnly}
          onChange={(e) => toggleOwnedOnlyAndRecompute(e.target.checked)}
          className="h-4 w-4 accent-indigo-500"
        />
        רק משחקים שברשותי
      </label>

      {pool.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
          אין משחקים בקטגוריה הזו. נסו לבטל את הסינון "רק ברשותי".
        </div>
      ) : (
        <>
          {eligible.length === 0 && (
            <p className="text-sm text-amber-300">
              אף משחק לא תומך במדויק ב-{playerCount} שחקנים - הנה ההתאמות הכי קרובות.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {(eligible.length > 0 ? eligible : results).slice(0, 8).map((r, i) => (
              <GameCard key={r.game.id} game={r.game} score={r.score} reasons={r.reasons} rank={i + 1} />
            ))}
          </div>
          {ineligible.length > 0 && eligible.length > 0 && (
            <details className="text-sm text-slate-400">
              <summary className="cursor-pointer select-none font-semibold text-slate-300">
                עוד {ineligible.length} משחקים שלא תומכים במספר השחקנים שלכם
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
