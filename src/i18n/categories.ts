export type Category =
  | 'family'
  | 'party'
  | 'strategy'
  | 'cards'
  | 'kids'
  | 'words'
  | 'abstract'
  | 'adventure'
  | 'economic'
  | 'night'
  | 'couple';

export const ALL_CATEGORIES: Category[] = [
  'family',
  'party',
  'strategy',
  'cards',
  'kids',
  'words',
  'abstract',
  'adventure',
  'economic',
  'night',
  'couple',
];

export const CATEGORY_LABELS: Record<Category, { he: string; en: string }> = {
  family: { he: 'משפחתי', en: 'Family' },
  party: { he: 'מסיבה', en: 'Party' },
  strategy: { he: 'אסטרטגיה', en: 'Strategy' },
  cards: { he: 'קלפים', en: 'Cards' },
  kids: { he: 'ילדים', en: 'Kids' },
  words: { he: 'מילים', en: 'Words' },
  abstract: { he: 'אבסטרקט', en: 'Abstract' },
  adventure: { he: 'הרפתקאות', en: 'Adventure' },
  economic: { he: 'כלכלי', en: 'Economic' },
  night: { he: 'לילה', en: 'Night' },
  couple: { he: 'זוגי', en: 'For two' },
};
