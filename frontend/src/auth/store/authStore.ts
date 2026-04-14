import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthenticatedUser } from "@/auth/types/auth";
import {
  removeAccessToken as clearStoredAccessToken,
  setAccessToken as persistAccessToken,
} from "@/shared/lib/token-storage";

type AuthState = {
  accessToken: string | null;
  currentUser: AuthenticatedUser | null;
  isAuthenticated: boolean;
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

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      currentUser: null,
      isAuthenticated: false,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSession: ({ accessToken, currentUser }) => {
        if (accessToken) {
          persistAccessToken(accessToken);
        } else {
          clearStoredAccessToken();
        }

        set({
          accessToken,
          currentUser,
          isAuthenticated: Boolean(accessToken),
        });
      },
      setAccessToken: (token) => {
        if (token) {
          persistAccessToken(token);
        } else {
          clearStoredAccessToken();
        }

        set({ accessToken: token, isAuthenticated: Boolean(token) });
      },
      setCurrentUser: (currentUser) => set({ currentUser }),
      clearSession: () => {
        clearStoredAccessToken();
        set({
          accessToken: null,
          currentUser: null,
          isAuthenticated: false,
        });
      },
      logout: () => {
        clearStoredAccessToken();
        set({
          accessToken: null,
          currentUser: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "pm-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        currentUser: s.currentUser,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          persistAccessToken(state.accessToken);
          state.setAccessToken(state.accessToken);
        } else {
          clearStoredAccessToken();
          state?.setAccessToken(null);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);

export const useAuthStore = authStore;
