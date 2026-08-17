import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import type { IScannerControls } from '@zxing/browser';
import { useT } from '../i18n/useT';

type ScanState = 'idle' | 'starting' | 'scanning' | 'denied' | 'unsupported' | 'error';

interface Props {
  onResult: (code: string) => void;
}

export default function BarcodeScanner({ onResult }: Props) {
  const { t } = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [state, setState] = useState<ScanState>('idle');

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  async function startScanning() {
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
            controlsRef.current?.stop();
            setState('idle');
            onResult(result.getText());
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

  return (
    <div className="flex flex-col gap-3">
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
            {state === 'denied' && <p className="text-sm text-rose-300">{t('cameraDenied')}</p>}
            {state === 'unsupported' && <p className="text-sm text-rose-300">{t('cameraUnsupported')}</p>}
            {state === 'error' && <p className="text-sm text-rose-300">{t('cameraError')}</p>}
            {state === 'idle' && <p className="text-sm text-slate-400">{t('tapToStart')}</p>}
            {state === 'starting' && <p className="text-sm text-slate-400">{t('openingCamera')}</p>}
          </div>
        )}
      </div>

      {state === 'scanning' ? (
        <button
          onClick={stopScanning}
          className="rounded-full bg-rose-500/90 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
        >
          {t('stopScan')}
        </button>
      ) : (
        <button
          onClick={startScanning}
          className="rounded-full bg-indigo-500 py-3 text-sm font-bold text-white transition hover:bg-indigo-400"
        >
          {state === 'starting' ? t('openingCamera') : t('startScan')}
        </button>
      )}
    </div>
  );
}
