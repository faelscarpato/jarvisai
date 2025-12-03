export enum SurfaceType {
  NONE = 'NONE',
  SHOPPING = 'SHOPPING',
  AGENDA = 'AGENDA',
  NEWS = 'NEWS',
}

export type VoiceGender = 'female' | 'male' | 'neutral';
export type VoiceStyle = 'casual' | 'formal' | 'focused' | 'empathetic';

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  priceEstimate?: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  time: string;
  type: 'meeting' | 'reminder' | 'task';
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  imageUrl: string;
  summary: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  nickname: string;
  occupation: string;
  ageRange: string;
  language: 'pt-BR' | 'en-US';
  updatedAt: string;
}

export interface VoiceSettings {
  gender: VoiceGender;
  style: VoiceStyle;
  rate: number;
  pitch: number;
  locale: 'pt-BR' | 'en-US';
  preferredVoiceName?: string;
}

export interface IntegrationStatus {
  googleCalendar: boolean;
  googleKeep: boolean;
  googleGmail: boolean;
  googleNews: boolean;
  lastSync?: string;
}

export interface ApiKeyCapabilities {
  supportsText: boolean;
  supportsTts: boolean;
  supportsLive: boolean;
}

export interface ApiKeyStatus {
  hasUserKey: boolean;
  mask: string | null;
  lastTestedAt?: string;
  capabilities: ApiKeyCapabilities;
  message?: string;
  provider: 'user' | 'platform';
}

export interface BillingStatus {
  tier: 'free' | 'byok' | 'platform_tts' | 'usage';
  minutesRemaining?: number;
  renewalDate?: string;
  usingPlatformVoice: boolean;
}

export interface AuthSession {
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  displayName: string;
}

export interface JarvisState {
  isConnected: boolean;
  isSpeaking: boolean; // Model is speaking
  isListening: boolean; // User is speaking (VAD)
  activeSurface: SurfaceType;
  shoppingList: ShoppingItem[];
  agenda: AgendaEvent[];
  news: NewsItem[];
  transcript: { role: 'user' | 'model'; text: string }[];
  userProfile: UserProfile | null;
  voice: VoiceSettings;
  integrations: IntegrationStatus;
  apiKeyStatus: ApiKeyStatus;
  billing: BillingStatus;
  isSettingsOpen: boolean;
  userApiKey?: string | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setActiveSurface: (surface: SurfaceType) => void;
  addShoppingItem: (item: string) => void;
  toggleShoppingItem: (id: string) => void;
  addTranscriptMessage: (role: 'user' | 'model', text: string) => void;
  setUserProfile: (profile: Partial<UserProfile> | null) => void;
  setVoice: (voice: Partial<VoiceSettings>) => void;
  toggleIntegration: (service: keyof IntegrationStatus) => void;
  setIntegrationStatus: (payload: Partial<IntegrationStatus>) => void;
  setApiKeyStatus: (payload: Partial<ApiKeyStatus>) => void;
  setBilling: (payload: Partial<BillingStatus>) => void;
  toggleSettings: (isOpen: boolean) => void;
  setUserApiKey: (key: string | null) => void;
}
