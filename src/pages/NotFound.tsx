import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
      <span className="text-3xl">🎲</span>
      <p>הדף לא נמצא.</p>
      <Link to="/" className="btn-secondary">
        חזרה לבית
      </Link>
    </div>
  );
}
