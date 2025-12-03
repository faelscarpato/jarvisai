import { authService } from './authService';
import { AuthSession } from '../types';

export const authClient = {
  async loginWithGoogle(): Promise<AuthSession> {
    return authService.startGoogleLogin();
  },
  async restoreSession(): Promise<AuthSession | null> {
    return authService.loadSession();
  },
  async logout() {
    return authService.clearSession();
  },
};
