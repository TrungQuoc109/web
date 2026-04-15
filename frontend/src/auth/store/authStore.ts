import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthenticatedUser } from "@/auth/types/auth";

type AuthState = {
  accessToken: string | null;
  currentUser: AuthenticatedUser | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (session: {
    accessToken: string | null;
    currentUser: AuthenticatedUser | null;
  }) => void;
  setAccessToken: (token: string | null) => void;
  setCurrentUser: (user: AuthenticatedUser | null) => void;
  clearSession: () => void;
  logout: () => void;
};

type PersistedAuthState = {
  accessToken?: string | null;
} | null;

const emptySession = {
  accessToken: null,
  currentUser: null,
};

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      ...emptySession,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSession: ({ accessToken, currentUser }) =>
        set({
          accessToken,
          currentUser,
        }),
      setAccessToken: (token) =>
        set((state) => ({
          accessToken: token,
          currentUser: token ? state.currentUser : null,
        })),
      setCurrentUser: (currentUser) => set({ currentUser }),
      clearSession: () => set(emptySession),
      logout: () => set(emptySession),
    }),
    {
      name: "pm-auth",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
      migrate: (persistedState, _version) => {
        const state =
          persistedState && typeof persistedState === "object"
            ? (persistedState as PersistedAuthState)
            : null;

        return {
          accessToken: state?.accessToken ?? null,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const useAuthStore = authStore;
