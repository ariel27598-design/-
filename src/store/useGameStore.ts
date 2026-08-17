import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Game, NewGame } from '../types';
import { SEED_GAMES } from '../data/games';
import { generateId } from '../lib/id';

interface GameStore {
  games: Game[];
  addGame: (game: NewGame) => Game;
  updateGame: (id: string, updates: Partial<NewGame>) => void;
  deleteGame: (id: string) => void;
  toggleOwned: (id: string) => void;
  setOwnedMany: (ids: Set<string>) => void;
  findByBarcode: (barcode: string) => Game | undefined;
  resetToSeed: () => void;
}

function seedWithIds(): Game[] {
  return SEED_GAMES.map((game, index) => ({
    ...game,
    id: generateId(),
    createdAt: Date.now() - (SEED_GAMES.length - index) * 1000,
  }));
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      games: seedWithIds(),

      addGame: (game) => {
        const newGame: Game = { ...game, id: generateId(), createdAt: Date.now() };
        set((state) => ({ games: [newGame, ...state.games] }));
        return newGame;
      },

      updateGame: (id, updates) => {
        set((state) => ({
          games: state.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
      },

      deleteGame: (id) => {
        set((state) => ({ games: state.games.filter((g) => g.id !== id) }));
      },

      toggleOwned: (id) => {
        set((state) => ({
          games: state.games.map((g) => (g.id === id ? { ...g, owned: !g.owned } : g)),
        }));
      },

      setOwnedMany: (ids) => {
        set((state) => ({
          games: state.games.map((g) => ({ ...g, owned: ids.has(g.id) })),
        }));
      },

      findByBarcode: (barcode) => {
        const normalized = barcode.trim();
        return get().games.find((g) => g.barcodes.includes(normalized));
      },

      resetToSeed: () => set({ games: seedWithIds() }),
    }),
    {
      name: 'boardgame-matcher-storage',
      version: 1,
    },
  ),
);
