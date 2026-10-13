import { create } from 'zustand';
import { getAuthErrorMessage } from '../../core/utils/authErrors';
import type { User } from '../../domain/entities/User';
import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import { loginUser } from '../../domain/usecases/auth/loginUser';
import { logoutUser } from '../../domain/usecases/auth/logoutUser';
import { registerUser } from '../../domain/usecases/auth/registerUser';
import { appLogger } from '../../core/utils/appLogger';
import { useTaskStore } from './taskStore';

interface AuthState {
  user: User | null;
  isHydrating: boolean;
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

const resetTasksIfUserChanged = (previousUserId: string | null, nextUser: User | null) => {
  const nextUserId = nextUser?.id ?? null;
  if (previousUserId === nextUserId) return;
  useTaskStore.getState().reset();
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrating: true,
  error: null,

  initialize: () => {
    appLogger.action('auth.initialize');
    return getRepository().subscribeToAuthState((user) => {
      appLogger.success('auth.stateChanged', { signedIn: Boolean(user) });
      resetTasksIfUserChanged(get().user?.id ?? null, user);
      set({ user, isHydrating: false, error: null });
    });
  },

  login: async (email, password) => {
    appLogger.action('auth.login');
    set({ error: null });

    try {
      const user = await loginUser(getRepository(), email, password);
      resetTasksIfUserChanged(get().user?.id ?? null, user);
      set({ user, isHydrating: false });
      appLogger.success('auth.login');
    } catch (error) {
      set({ error: getAuthErrorMessage(error) });
      appLogger.failure('auth.login', error);
      throw error;
    }
  },

  register: async (email, password) => {
    appLogger.action('auth.register');
    set({ error: null });

    try {
      const user = await registerUser(getRepository(), email, password);
      resetTasksIfUserChanged(get().user?.id ?? null, user);
      set({ user, isHydrating: false });
      appLogger.success('auth.register');
    } catch (error) {
      set({ error: getAuthErrorMessage(error) });
      appLogger.failure('auth.register', error);
      throw error;
    }
  },

  logout: async () => {
    appLogger.action('auth.logout');
    set({ error: null });

    try {
      await logoutUser(getRepository());
      resetTasksIfUserChanged(get().user?.id ?? null, null);
      set({ user: null, isHydrating: false });
      appLogger.success('auth.logout');
    } catch (error) {
      set({ error: getAuthErrorMessage(error) });
      appLogger.failure('auth.logout', error);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export const authStore = useAuthStore;
