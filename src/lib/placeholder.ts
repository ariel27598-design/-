// Deterministic placeholder cover art (SVG data URI) for games without a real image.

const PALETTE = [
  ['#f97316', '#7c2d12'],
  ['#0ea5e9', '#0c4a6e'],
  ['#22c55e', '#14532d'],
  ['#a855f7', '#4c1d95'],
  ['#ef4444', '#7f1d1d'],
  ['#eab308', '#713f12'],
  ['#ec4899', '#831843'],
  ['#14b8a6', '#134e4a'],
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function placeholderCover(name: string): string {
  const idx = hashString(name) % PALETTE.length;
  const [bg, fg] = PALETTE[idx];
  const initial = (name.trim()[0] || '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="${fg}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#g)" rx="24"/>
    <text x="200" y="235" font-family="system-ui, sans-serif" font-size="160" font-weight="700" fill="#ffffff" text-anchor="middle" opacity="0.9">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
