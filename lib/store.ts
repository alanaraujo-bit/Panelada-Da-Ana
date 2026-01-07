import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type StateStorage = {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
};

const memoryStorageData = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') {
      return memoryStorageData.get(name) ?? null;
    }

    try {
      return window.localStorage.getItem(name);
    } catch {
      return memoryStorageData.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') {
      memoryStorageData.set(name, value);
      return;
    }

    try {
      window.localStorage.setItem(name, value);
    } catch {
      memoryStorageData.set(name, value);
    }
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') {
      memoryStorageData.delete(name);
      return;
    }

    try {
      window.localStorage.removeItem(name);
    } catch {
      memoryStorageData.delete(name);
    }
  },
};

interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
}

interface RememberedAuth {
  user: User;
  token: string;
  lastUsedAt: number;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  remembered: RememberedAuth[];
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  removeRemembered: (email: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      remembered: [],
      setAuth: (user, token) =>
        set((state) => {
          const now = Date.now();
          const remembered = (state.remembered || []).filter(
            (entry) => entry.user.email !== user.email
          );

          return {
            user,
            token,
            remembered: [{ user, token, lastUsedAt: now }, ...remembered],
          };
        }),
      logout: () => set({ user: null, token: null }),
      removeRemembered: (email) =>
        set((state) => ({
          remembered: (state.remembered || []).filter(
            (entry) => entry.user.email !== email
          ),
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => safeStorage),
      version: 2,
      migrate: (persistedState: unknown) => {
        if (persistedState && typeof persistedState === 'object') {
          const state = persistedState as Record<string, unknown>;
          const remembered = Array.isArray(state.remembered) ? state.remembered : [];
          return { ...state, remembered } as unknown as AuthStore;
        }

        return persistedState as unknown as AuthStore;
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        remembered: state.remembered,
      }),
    }
  )
);
