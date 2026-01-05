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

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
