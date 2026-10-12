import { create } from 'zustand';
import { getAuthErrorMessage } from '../../core/utils/authErrors';
import { FirebaseAuthRepository } from '../../data/repositories/FirebaseAuthRepository';
import type { User } from '../../domain/entities/User';
import { loginUser } from '../../domain/usecases/auth/loginUser';
import { logoutUser } from '../../domain/usecases/auth/logoutUser';
import { registerUser } from '../../domain/usecases/auth/registerUser';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const authRepository = new FirebaseAuthRepository();

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  initialize: () =>
    authRepository.subscribeToAuthState((user) =>
      set({ user, isLoading: false, error: null }),
    ),

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const user = await loginUser(authRepository, email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getAuthErrorMessage(error) });
      throw error;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const user = await registerUser(authRepository, email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getAuthErrorMessage(error) });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await logoutUser(authRepository);
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getAuthErrorMessage(error) });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export const authStore = useAuthStore;
