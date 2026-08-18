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
  resetToSeed: () => void;
}

function seedWithIds(): Game[] {
  return SEED_GAMES.map((game, index) => ({
    ...game,
    createdAt: Date.now() - (SEED_GAMES.length - index) * 1000,
  }));
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
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

      resetToSeed: () => set({ games: seedWithIds() }),
    }),
    {
      name: 'boardgame-matcher-storage',
      version: 2,
      // v2: seed games moved from random per-device ids to fixed slugs so
      // shared library links resolve consistently. Reset older state.
      migrate: (persisted, version) => (version < 2 ? { games: seedWithIds() } : (persisted as GameStore)),
      // New seed games added later should reach people who already have
      // persisted state, without discarding anything they've added/edited.
      // Seed games the user never edited (still on the auto-generated
      // placeholder cover, and/or name still the original bilingual object
      // rather than the plain string the edit form saves) also pick up
      // newer seed data - a fresh cover image or a corrected name.
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<GameStore> | undefined;
        if (!persistedState || !Array.isArray(persistedState.games)) return current;
        const currentById = new Map(current.games.map((g) => [g.id, g]));
        const existingIds = new Set(persistedState.games.map((g) => g.id));
        const upgradedGames = persistedState.games.map((g) => {
          const latest = currentById.get(g.id);
          if (!latest) return g;
          let next = g;
          if (g.imageUrl.startsWith('data:image/svg+xml') && !latest.imageUrl.startsWith('data:image/svg+xml')) {
            next = { ...next, imageUrl: latest.imageUrl };
          }
          if (typeof g.name !== 'string' && typeof latest.name !== 'string') {
            next = { ...next, name: latest.name };
          }
          return next;
        });
        const newSeeds = current.games.filter((g) => !existingIds.has(g.id));
        return { ...current, ...persistedState, games: [...upgradedGames, ...newSeeds] };
      },
    },
  ),
);
