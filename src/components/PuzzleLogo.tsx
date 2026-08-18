export default function PuzzleLogo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="translate(6,6) scale(1.05)" strokeWidth="3.4" strokeLinejoin="round">
        {/* left piece: rounded square with a tab bulging into the right piece */}
        <path
          d="M7,14 H24 V20 A4,4 0 0 1 24,28 V34 H7 A3,3 0 0 1 4,31 V17 A3,3 0 0 1 7,14 Z"
          stroke="var(--color-primary-400)"
        />
        {/* right piece: rounded square with a matching socket the left tab plugs into */}
        <path
          d="M24,14 H41 A3,3 0 0 1 44,17 V31 A3,3 0 0 1 41,34 H24 V28 A4,4 0 0 0 24,20 Z"
          stroke="var(--color-accent-400)"
        />
      </g>
    </svg>
  );
}
