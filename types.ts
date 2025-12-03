export enum SurfaceType {
  NONE = 'NONE',
  SHOPPING = 'SHOPPING',
  AGENDA = 'AGENDA',
  NEWS = 'NEWS',
}

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

export interface JarvisState {
  isConnected: boolean;
  isSpeaking: boolean; // Model is speaking
  isListening: boolean; // User is speaking (VAD)
  activeSurface: SurfaceType;
  shoppingList: ShoppingItem[];
  agenda: AgendaEvent[];
  news: NewsItem[];
  transcript: { role: 'user' | 'model'; text: string }[];
  
  // Actions
  setConnected: (connected: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setActiveSurface: (surface: SurfaceType) => void;
  addShoppingItem: (item: string) => void;
  toggleShoppingItem: (id: string) => void;
  addTranscriptMessage: (role: 'user' | 'model', text: string) => void;
}
