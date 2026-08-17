import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useT } from '../i18n/useT';

interface Props {
  name: string;
  url: string;
  cloudStatus?: 'idle' | 'saving' | 'ok' | 'unavailable';
  onClose: () => void;
}

export default function ShareLibraryModal({ name, url, cloudStatus = 'idle', onClose }: Props) {
  const { t } = useT();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 400, color: { dark: '#1e1b2e', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable; the link is still visible to copy manually
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white">{t('shareLinkTitle', { name })}</h2>
        <p className="text-xs text-slate-400">{t('shareLinkHint')}</p>

        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR" className="mx-auto h-52 w-52 rounded-xl bg-white p-2" />
        )}

        <div className="break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300" dir="ltr">
          {url}
        </div>

        {cloudStatus !== 'idle' && (
          <p className="text-xs text-slate-400">
            {cloudStatus === 'saving' && t('cloudSaving')}
            {cloudStatus === 'ok' && t('cloudSaveOk')}
            {cloudStatus === 'unavailable' && t('cloudSaveUnavailable')}
          </p>
        )}

        <div className="flex gap-2">
          <button onClick={copyLink} className="flex-1 rounded-full bg-indigo-500 py-2.5 text-sm font-bold text-white hover:bg-indigo-400">
            {copied ? t('linkCopied') : t('copyLink')}
          </button>
          <button onClick={onClose} className="btn-secondary">
            {t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
