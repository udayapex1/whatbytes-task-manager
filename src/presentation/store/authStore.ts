import { create } from 'zustand';
import { getAuthErrorMessage } from '../../core/utils/authErrors';
import type { User } from '../../domain/entities/User';
import type { AuthRepository } from '../../domain/repositories/AuthRepository';
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

let authRepository: AuthRepository | null = null;

export const configureAuthStore = (repository: AuthRepository): void => {
  authRepository = repository;
};

const getRepository = (): AuthRepository => {
  if (!authRepository) {
    throw new Error('Auth store has not been configured.');
  }

  return authRepository;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  initialize: () =>
    getRepository().subscribeToAuthState((user) =>
      set({ user, isLoading: false, error: null }),
    ),

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const user = await loginUser(getRepository(), email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getAuthErrorMessage(error) });
      throw error;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const user = await registerUser(getRepository(), email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getAuthErrorMessage(error) });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await logoutUser(getRepository());
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: getAuthErrorMessage(error) });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export const authStore = useAuthStore;
