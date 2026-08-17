import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/id';

export interface GameLibrary {
  id: string;
  name: string;
  gameIds: string[];
  createdAt: number;
}

interface LibraryStore {
  libraries: GameLibrary[];
  saveLibrary: (name: string, gameIds: string[]) => GameLibrary;
  /** Insert a shared library if a library with the same name+games isn't already saved. Returns the (new or existing) library. */
  importLibrary: (name: string, gameIds: string[]) => GameLibrary;
  deleteLibrary: (id: string) => void;
}

function sameGames(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      libraries: [],

      saveLibrary: (name, gameIds) => {
        const library: GameLibrary = { id: generateId(), name, gameIds, createdAt: Date.now() };
        set((state) => ({ libraries: [library, ...state.libraries] }));
        return library;
      },

      importLibrary: (name, gameIds) => {
        const existing = get().libraries.find((lib) => lib.name === name && sameGames(lib.gameIds, gameIds));
        if (existing) return existing;
        const library: GameLibrary = { id: generateId(), name, gameIds, createdAt: Date.now() };
        set((state) => ({ libraries: [library, ...state.libraries] }));
        return library;
      },

      deleteLibrary: (id) => {
        set((state) => ({ libraries: state.libraries.filter((lib) => lib.id !== id) }));
      },
    }),
    { name: 'boardgame-matcher-libraries' },
  ),
);
