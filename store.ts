import { create } from 'zustand';
import { JarvisState, SurfaceType } from './types';
import { INITIAL_AGENDA, INITIAL_NEWS } from './constants';

export const useJarvisStore = create<JarvisState>((set) => ({
  isConnected: false,
  isSpeaking: false,
  isListening: false,
  activeSurface: SurfaceType.NONE,
  shoppingList: [
    { id: '1', name: 'Café Premium', checked: false, priceEstimate: 'R$ 22,00' },
    { id: '2', name: 'Leite de Aveia', checked: false, priceEstimate: 'R$ 18,50' },
  ],
  agenda: [...INITIAL_AGENDA],
  news: [...INITIAL_NEWS],
  transcript: [],

  setConnected: (connected) => set({ isConnected: connected }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setIsListening: (listening) => set({ isListening: listening }),
  setActiveSurface: (surface) => set({ activeSurface: surface }),
  
  addShoppingItem: (item) => set((state) => ({
    shoppingList: [...state.shoppingList, { 
      id: Math.random().toString(36).substr(2, 9), 
      name: item, 
      checked: false 
    }]
  })),

  toggleShoppingItem: (id) => set((state) => ({
    shoppingList: state.shoppingList.map((item) => 
      item.id === id ? { ...item, checked: !item.checked } : item
    )
  })),

  addTranscriptMessage: (role, text) => set((state) => ({
    transcript: [...state.transcript.slice(-4), { role, text }] // Keep last 5 messages
  })),
}));
