const STORAGE_KEY = 'jarvis-integration-gmail';

export const googleGmailService = {
  async connect(): Promise<boolean> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ connected: true, lastSync: new Date().toISOString() }));
    return true;
  },
  async disconnect(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  },
  async status(): Promise<{ connected: boolean; lastSync?: string }> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { connected: false };
    try {
      return JSON.parse(raw) as { connected: boolean; lastSync?: string };
    } catch {
      return { connected: false };
    }
  },
};
