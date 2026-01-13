import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService, User, LoginInput, AuthError } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (input: LoginInput) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await authService.login(input);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          const message = err instanceof AuthError ? err.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        }
      },

      refreshUser: async () => {
        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });

        // Check if we have a valid token
        if (!authService.isAuthenticated()) {
          // Try to refresh if we have a refresh token
          const refreshToken = authService.getRefreshToken();
          if (refreshToken) {
            try {
              await authService.refreshTokens();
            } catch {
              set({ user: null, isAuthenticated: false, isLoading: false });
              return false;
            }
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return false;
          }
        }

        // Fetch user data
        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user) =>
        set({ user, isAuthenticated: user !== null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for convenience
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
