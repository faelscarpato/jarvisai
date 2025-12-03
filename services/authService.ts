import { AuthSession } from '../types';

const SESSION_KEY = 'jarvis-auth-session';

const buildMockSession = (): AuthSession => ({
  userId: 'google-demo-user',
  email: 'demo.user@gmail.com',
  token: 'mock-token',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  displayName: 'Demo User',
});

export const authService = {
  async startGoogleLogin(): Promise<AuthSession> {
    const session = buildMockSession();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },
  async loadSession(): Promise<AuthSession | null> {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (new Date(parsed.expiresAt).getTime() < Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },
  async clearSession() {
    localStorage.removeItem(SESSION_KEY);
  },
};
