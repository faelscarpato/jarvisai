import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ApiKeyStatus,
  BillingStatus,
  IntegrationStatus,
  JarvisState,
  SurfaceType,
  UserProfile,
  VoiceSettings,
} from './types';
import { INITIAL_AGENDA, INITIAL_NEWS } from './constants';

const DEFAULT_VOICE: VoiceSettings = {
  gender: 'female',
  style: 'casual',
  rate: 1,
  pitch: 0,
  locale: 'pt-BR',
  preferredVoiceName: 'Kore',
};

const DEFAULT_INTEGRATIONS: IntegrationStatus = {
  googleCalendar: false,
  googleKeep: false,
  googleGmail: false,
  googleNews: false,
  lastSync: undefined,
};

const DEFAULT_API_KEY_STATUS: ApiKeyStatus = {
  hasUserKey: false,
  mask: null,
  lastTestedAt: undefined,
  capabilities: {
    supportsText: true,
    supportsTts: false,
    supportsLive: false,
  },
  message: 'Nenhuma chave personalizada cadastrada.',
  provider: 'platform',
};

const DEFAULT_BILLING: BillingStatus = {
  tier: 'free',
  minutesRemaining: undefined,
  renewalDate: undefined,
  usingPlatformVoice: true,
};

const newId = () => Math.random().toString(36).slice(2, 9);

export const useJarvisStore = create<JarvisState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      isSpeaking: false,
      isListening: false,
      activeSurface: SurfaceType.NONE,
      isSettingsOpen: false,

      shoppingList: [
        { id: '1', name: 'Café Premium', checked: false, priceEstimate: 'R$ 22,00' },
        { id: '2', name: 'Leite de Aveia', checked: false, priceEstimate: 'R$ 18,50' },
      ],
      agenda: [...INITIAL_AGENDA],
      news: [...INITIAL_NEWS],
      transcript: [],

      userProfile: null,
      voice: DEFAULT_VOICE,
      integrations: DEFAULT_INTEGRATIONS,
      apiKeyStatus: DEFAULT_API_KEY_STATUS,
      billing: DEFAULT_BILLING,
      userApiKey: null,

      setConnected: (connected) => set({ isConnected: connected }),
      setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
      setIsListening: (listening) => set({ isListening: listening }),
      setActiveSurface: (surface) => set({ activeSurface: surface }),
      toggleSettings: (isOpen) => set({ isSettingsOpen: isOpen }),

      addShoppingItem: (item) =>
        set((state) => ({
          shoppingList: [
            ...state.shoppingList,
            {
              id: newId(),
              name: item,
              checked: false,
            },
          ],
        })),

      toggleShoppingItem: (id) =>
        set((state) => ({
          shoppingList: state.shoppingList.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item,
          ),
        })),

      addTranscriptMessage: (role, text) =>
        set((state) => ({
          transcript: [...state.transcript.slice(-4), { role, text }],
        })),

      setUserProfile: (profile) =>
        set((state) => ({
          userProfile: profile
            ? {
                ...(state.userProfile || {}),
                ...profile,
                updatedAt: profile.updatedAt || new Date().toISOString(),
              }
            : null,
        })),

      setVoice: (voice) =>
        set((state) => ({
          voice: { ...state.voice, ...voice },
        })),

      toggleIntegration: (service) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            [service]: !state.integrations[service],
            lastSync: new Date().toISOString(),
          },
        })),

      setIntegrationStatus: (payload) =>
        set((state) => ({
          integrations: { ...state.integrations, ...payload },
        })),

      setApiKeyStatus: (payload) =>
        set((state) => ({
          apiKeyStatus: { ...state.apiKeyStatus, ...payload },
        })),

      setBilling: (payload) =>
        set((state) => ({
          billing: { ...state.billing, ...payload },
        })),

      setUserApiKey: (key) =>
        set((state) => ({
          userApiKey: key,
          apiKeyStatus: {
            ...state.apiKeyStatus,
            hasUserKey: Boolean(key),
            provider: key ? 'user' : 'platform',
            mask: key ? `****${key.slice(-4)}` : null,
          },
        })),
    }),
    {
      name: 'jarvis-storage',
      partialize: (state) => ({
        shoppingList: state.shoppingList,
        agenda: state.agenda,
        news: state.news,
        transcript: state.transcript,
        userProfile: state.userProfile,
        voice: state.voice,
        integrations: state.integrations,
        apiKeyStatus: state.apiKeyStatus,
        billing: state.billing,
        isSettingsOpen: state.isSettingsOpen,
        activeSurface: state.activeSurface,
      }),
    },
  ),
);
