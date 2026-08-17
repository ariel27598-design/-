export default function PuzzleLogo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="puzzleA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="puzzleB" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5d0fe" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      {/* left piece: rounded square with a tab bulging into the right piece */}
      <path
        d="M7,14 H24 V20 A4,4 0 0 1 24,28 V34 H7 A3,3 0 0 1 4,31 V17 A3,3 0 0 1 7,14 Z"
        fill="url(#puzzleA)"
      />
      {/* right piece: rounded square with a matching socket the left tab plugs into */}
      <path
        d="M24,14 H41 A3,3 0 0 1 44,17 V31 A3,3 0 0 1 41,34 H24 V28 A4,4 0 0 0 24,20 Z"
        fill="url(#puzzleB)"
      />
    </svg>
  );
}
