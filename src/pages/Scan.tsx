import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import type { IScannerControls } from '@zxing/browser';
import { useGameStore } from '../store/useGameStore';
import type { Game } from '../types';
import GameCard from '../components/GameCard';

type ScanState = 'idle' | 'starting' | 'scanning' | 'denied' | 'unsupported' | 'error';

export default function Scan() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [state, setState] = useState<ScanState>('idle');
  const [foundGame, setFoundGame] = useState<Game | null | undefined>(undefined);
  const [lastCode, setLastCode] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const findByBarcode = useGameStore((s) => s.findByBarcode);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  function handleResult(code: string) {
    setLastCode(code);
    const game = findByBarcode(code);
    setFoundGame(game ?? null);
    controlsRef.current?.stop();
    setState('idle');
  }

  async function startScanning() {
    setFoundGame(undefined);
    setState('starting');

    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      return;
    }

    try {
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (result, error) => {
          if (result) {
            handleResult(result.getText());
          } else if (error && !(error instanceof NotFoundException)) {
            // Non-fatal per-frame decode errors are expected constantly; ignore them.
          }
        },
      );
      controlsRef.current = controls;
      setState('scanning');
    } catch (err) {
      console.error(err);
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setState('denied');
      } else {
        setState('error');
      }
    }
  }

  function stopScanning() {
    controlsRef.current?.stop();
    setState('idle');
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleResult(manualCode.trim());
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">סריקת ברקוד</h1>
        <p className="text-sm text-slate-400">
          כוונו את המצלמה לברקוד שעל קופסת המשחק כדי לאתר אותו בספרייה שלכם.
        </p>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${state === 'scanning' ? '' : 'opacity-30'}`}
          muted
          playsInline
        />
        {state === 'scanning' && (
          <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-indigo-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        )}
        {state !== 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="text-4xl">📷</span>
            {state === 'denied' && (
              <p className="text-sm text-rose-300">
                הגישה למצלמה נחסמה. אפשרו הרשאת מצלמה בדפדפן ונסו שוב, או הזינו ברקוד ידנית למטה.
              </p>
            )}
            {state === 'unsupported' && (
              <p className="text-sm text-rose-300">הדפדפן הזה לא תומך בגישה למצלמה. אפשר להזין ברקוד ידנית.</p>
            )}
            {state === 'error' && <p className="text-sm text-rose-300">משהו השתבש בפתיחת המצלמה. נסו שוב.</p>}
            {state === 'idle' && <p className="text-sm text-slate-400">לחצו להתחלת סריקה</p>}
            {state === 'starting' && <p className="text-sm text-slate-400">פותח מצלמה...</p>}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {state === 'scanning' ? (
          <button
            onClick={stopScanning}
            className="flex-1 rounded-full bg-rose-500/90 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
          >
            עצירת סריקה
          </button>
        ) : (
          <button
            onClick={startScanning}
            className="flex-1 rounded-full bg-indigo-500 py-3 text-sm font-bold text-white transition hover:bg-indigo-400"
          >
            {state === 'starting' ? 'פותח מצלמה...' : '▶️ התחלת סריקה'}
          </button>
        )}
      </div>

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="או הזינו ברקוד ידנית"
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          חיפוש
        </button>
      </form>

      {foundGame !== undefined && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          {foundGame ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-emerald-300">✓ נמצא המשחק בספרייה!</p>
              <GameCard game={foundGame} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-amber-300">
                לא נמצא משחק עם הברקוד <span dir="ltr">{lastCode}</span> בספרייה שלכם.
              </p>
              <div className="flex gap-2">
                <Link
                  to={`/games/new?barcode=${encodeURIComponent(lastCode)}`}
                  className="flex-1 rounded-full bg-indigo-500 py-2.5 text-center text-sm font-bold text-white hover:bg-indigo-400"
                >
                  ➕ הוספת משחק חדש
                </Link>
                <button
                  onClick={() => navigate('/library')}
                  className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  לספרייה
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
