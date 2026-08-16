// Core domain types for the board game matcher app.

export type Category =
  | 'משפחתי'
  | 'מסיבה'
  | 'אסטרטגיה'
  | 'שיתופי'
  | 'קלפים'
  | 'ילדים'
  | 'מילים'
  | 'אבסטרקט'
  | 'הרפתקאות'
  | 'כלכלי'
  | 'לילה'
  | 'זוגי';

export const ALL_CATEGORIES: Category[] = [
  'משפחתי',
  'מסיבה',
  'אסטרטגיה',
  'שיתופי',
  'קלפים',
  'ילדים',
  'מילים',
  'אבסטרקט',
  'הרפתקאות',
  'כלכלי',
  'לילה',
  'זוגי',
];

export interface Game {
  id: string;
  name: string;
  /** One or more barcodes (UPC/EAN) associated with printings of this game. */
  barcodes: string[];
  imageUrl: string;
  /** Short explanation of how the game is played. */
  description: string;
  /** Optional YouTube (or other) video URL explaining the game. */
  videoUrl?: string;
  minPlayers: number;
  maxPlayers: number;
  /** Playtime in minutes. */
  minPlaytime: number;
  maxPlaytime: number;
  minAge: number;
  /** Complexity / "weight" of the game, 1 = very light, 5 = very heavy. */
  weight: number;
  /** How much the outcome depends on luck vs. skill/strategy. 1 = pure luck, 5 = pure strategy. */
  luckVsStrategy: number;
  cooperative: boolean;
  categories: Category[];
  /** True when this copy physically exists in the user's collection. */
  owned: boolean;
  createdAt: number;
}

export type NewGame = Omit<Game, 'id' | 'createdAt'>;

/** A single participant's answers to the matching questionnaire. */
export interface QuestionnaireAnswers {
  personName: string;
  /** How much time is available to play, in minutes. */
  timeAvailable: number;
  /** Preferred complexity, 1 (very light) - 5 (very heavy). */
  complexity: number;
  /** Preferred balance of luck vs strategy, 1 (luck) - 5 (strategy). */
  luckVsStrategy: number;
  socialMode: 'cooperative' | 'competitive' | 'either';
  preferredCategories: Category[];
  /** 1 (dislike) - 5 (love) tolerance for long/complex rules explanations. */
  willingToLearnRules: number;
}

export interface GameMatchResult {
  game: Game;
  score: number;
  reasons: string[];
  eligible: boolean;
}
