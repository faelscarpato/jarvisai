import { create } from 'zustand';
import { authClient } from '../services/authClient';
import { AuthSession } from '../types';

interface AuthState {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<AuthSession | null>;
  logout: () => Promise<void>;
  restore: () => Promise<AuthSession | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: false,
  error: null,
  async login() {
    set({ loading: true, error: null });
    try {
      const session = await authClient.loginWithGoogle();
      set({ session, loading: false });
      return session;
    } catch (err: any) {
      set({ error: err.message || 'Falha no login', loading: false });
      return null;
    }
  },
  async logout() {
    set({ loading: true });
    await authClient.logout();
    set({ session: null, loading: false });
  },
  async restore() {
    set({ loading: true });
    const session = await authClient.restoreSession();
    set({ session, loading: false });
    return session;
  },
}));
