import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CurrentUser = { id: string; email: string; name?: string };

type AuthState = {
  accessToken: string | null;
  currentUser: CurrentUser | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (session: {
    accessToken: string | null;
    currentUser: CurrentUser | null;
  }) => void;
  setAccessToken: (token: string | null) => void;
  setCurrentUser: (user: CurrentUser | null) => void;
  logout: () => void;
};

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      currentUser: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSession: ({ accessToken, currentUser }) =>
        set({ accessToken, currentUser }),
      setAccessToken: (token) => set({ accessToken: token }),
      setCurrentUser: (currentUser) => set({ currentUser }),
      logout: () => set({ accessToken: null, currentUser: null }),
    }),
    {
      name: "pm-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        currentUser: s.currentUser,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const useAuthStore = authStore;
