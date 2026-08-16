interface Props {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function CategoryPill({ label, active, onClick, className = '' }: Props) {
  const interactive = Boolean(onClick);
  const Comp = interactive ? 'button' : 'span';
  return (
    <Comp
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? 'border-indigo-400/60 bg-indigo-500/20 text-indigo-200'
          : 'border-white/10 bg-white/5 text-slate-300'
      } ${interactive ? 'cursor-pointer hover:border-indigo-400/40 hover:text-indigo-200' : ''} ${className}`}
    >
      {label}
    </Comp>
  );
}
