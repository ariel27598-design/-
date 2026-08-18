import { Link } from 'react-router-dom';
import { useT } from '../i18n/useT';

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 p-10 text-center text-ink-400">
      <span className="text-3xl">🎲</span>
      <p>{t('notFoundTitle')}</p>
      <Link to="/" className="btn-secondary">
        {t('backHome')}
      </Link>
    </div>
  );
}
