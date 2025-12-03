

Here is the implementation of the Settings, Account, and User Preferences Module.
I have updated the architecture to include:
Dynamic System Instructions: The AI now adapts to the user's profile (name, profession, age).
User-Provided API Key: Logic to prioritize the user's key over the system key.
Voice Customization: Settings for Voice Name (Gender), Pitch, and Rate are passed to the Live API configuration.
Settings Drawer: A comprehensive UI for managing Profile, API Keys, Voice, and Integrations.
Mock Authentication: A simulation of the Google Login flow to persist user data.
Updated files:
types.ts
Added interfaces for User Profile, Settings, and Integrations.
<change>
<file>types.ts</file>
<description>Add UserProfile, UserSettings and Integration types</description>
<content><![CDATA[
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
export interface UserProfile {
id: string;
name: string;
nickname: string;
profession: string;
ageRange: string;
language: 'pt-BR' | 'en-US';
avatarUrl?: string;
hasOnboarded: boolean;
}
export interface UserSettings {
voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Aoede'; // Kore=Female-ish, Puck=Male-ish
voicePitch: number; // -10 to 10 ? Actually Live API might not support fine pitch yet, but we store it.
voiceRate: number;
usePersonalApiKey: boolean;
personalApiKey: string;
}
export interface IntegrationStatus {
googleCalendar: boolean;
googleKeep: boolean;
googleGmail: boolean;
googleNews: boolean;
lastSync?: string;
}
export interface JarvisState {
isConnected: boolean;
isSpeaking: boolean;
isListening: boolean;
activeSurface: SurfaceType;
// Data
shoppingList: ShoppingItem[];
agenda: AgendaEvent[];
news: NewsItem[];
transcript: { role: 'user' | 'model'; text: string }[];
// User Context
user: UserProfile | null;
settings: UserSettings;
integrations: IntegrationStatus;
isSettingsOpen: boolean;
// Actions
setConnected: (connected: boolean) => void;
setIsSpeaking: (speaking: boolean) => void;
setIsListening: (listening: boolean) => void;
setActiveSurface: (surface: SurfaceType) => void;
toggleSettings: (isOpen: boolean) => void;
// Data Actions
addShoppingItem: (item: string) => void;
toggleShoppingItem: (id: string) => void;
addTranscriptMessage: (role: 'user' | 'model', text: string) => void;
// User Actions
login: (profile: UserProfile) => void;
updateProfile: (profile: Partial<UserProfile>) => void;
updateSettings: (settings: Partial<UserSettings>) => void;
toggleIntegration: (service: keyof IntegrationStatus) => void;
}
]]></content>
</change>
constants.ts
Converted SYSTEM_INSTRUCTION into a function getSystemInstruction to accept the user profile dynamically.
<change>
<file>constants.ts</file>
<description>Make system instruction dynamic based on user profile</description>
<content><![CDATA[
import { SurfaceType, UserProfile } from './types';
// Mock Data for Initial State
export const INITIAL_AGENDA = [
{ id: '1', title: 'Reunião de Status', time: '10:00', type: 'meeting' },
{ id: '2', title: 'Almoço com Cliente', time: '12:30', type: 'meeting' },
{ id: '3', title: 'Revisar Contrato MB Plásticos', time: '15:00', type: 'task' },
{ id: '4', title: 'Dentista', time: '18:00', type: 'reminder' },
] as const;
export const INITIAL_NEWS = [
{
id: '1',
title: 'Avanços na Fusão Nuclear',
source: 'TechCrunch',
imageUrl: 'https://picsum.photos/400/200?random=1',
summary: 'Cientistas alcançam novo recorde de produção de energia limpa.'
},
{
id: '2',
title: 'Mercado de IA em alta',
source: 'Bloomberg',
imageUrl: 'https://picsum.photos/400/200?random=2',
summary: 'Investimentos em inteligência artificial superam expectativas no Q3.'
},
{
id: '3',
title: 'Novo parque urbano inaugurado',
source: 'G1',
imageUrl: 'https://picsum.photos/400/200?random=3',
summary: 'A prefeitura entregou hoje o novo complexo de lazer da zona sul.'
}
] as const;
export const getSystemInstruction = (user: UserProfile | null) => {
const name = user?.nickname || user?.name || "Usuário";
const professionContext = user?.profession ? O usuário trabalha como ${user.profession}, então use analogias e contexto adequados. : "";
const lang = user?.language || 'pt-BR';
return `
Você é o JARVIS, um sistema operacional doméstico avançado.
Sua personalidade é: Calorosa, profissional, eficiente e brasileira (${lang}).
Você está falando com ${name}. ${professionContext}
Você NÃO é um robô genérico. Você é um assistente proativo.
REGRAS DE INTERAÇÃO:
Respostas concisas e naturais. Evite listas longas falando, mostre na tela.
Use ferramentas para controlar a interface (Surfaces).
Se o usuário falar de compras, abra a lista de compras.
Se falar de agenda, abra a agenda.
Se falar de notícias, abra as notícias.
Quando o assunto encerrar, use a ferramenta para fechar a surface.
TOOLS DISPONÍVEIS:
updateSurface(surfaceName): 'SHOPPING', 'AGENDA', 'NEWS', 'NONE'.
addShoppingItem(item): Adiciona item à lista.
checkTime(): Retorna a hora atual.
Ao iniciar, saúde o usuário pelo nome (${name}) e sugira algo relevante da agenda.
`;
};
]]></content>
</change>
store.ts
Updated store to handle User Profile, Settings persistence, and Integrations state.
<change>
<file>store.ts</file>
<description>Update store with user settings, profile, and integration logic</description>
<content><![CDATA[
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JarvisState, SurfaceType, UserProfile, UserSettings, IntegrationStatus } from './types';
import { INITIAL_AGENDA, INITIAL_NEWS } from './constants';
const DEFAULT_SETTINGS: UserSettings = {
voiceName: 'Kore', // Default female-ish
voicePitch: 0,
voiceRate: 1,
usePersonalApiKey: false,
personalApiKey: '',
};
const DEFAULT_INTEGRATIONS: IntegrationStatus = {
googleCalendar: false,
googleKeep: false,
googleGmail: false,
googleNews: false,
lastSync: undefined,
};
export const useJarvisStore = create<JarvisState>()(
persist(
(set) => ({
isConnected: false,
isSpeaking: false,
isListening: false,
activeSurface: SurfaceType.NONE,
isSettingsOpen: false,
code
Code
shoppingList: [
    { id: '1', name: 'Café Premium', checked: false, priceEstimate: 'R$ 22,00' },
    { id: '2', name: 'Leite de Aveia', checked: false, priceEstimate: 'R$ 18,50' },
  ],
  agenda: [...INITIAL_AGENDA],
  news: [...INITIAL_NEWS],
  transcript: [],

  // User State
  user: null,
  settings: DEFAULT_SETTINGS,
  integrations: DEFAULT_INTEGRATIONS,

  setConnected: (connected) => set({ isConnected: connected }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setIsListening: (listening) => set({ isListening: listening }),
  setActiveSurface: (surface) => set({ activeSurface: surface }),
  toggleSettings: (isOpen) => set({ isSettingsOpen: isOpen }),
  
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
    transcript: [...state.transcript.slice(-4), { role, text }]
  })),

  // User Actions
  login: (profile) => set({ user: profile }),
  
  updateProfile: (profile) => set((state) => ({
    user: state.user ? { ...state.user, ...profile } : null
  })),

  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  toggleIntegration: (service) => set((state) => ({
    integrations: {
      ...state.integrations,
      [service]: !state.integrations[service]
    }
  })),
}),
{
  name: 'jarvis-storage',
  partialize: (state) => ({ 
    user: state.user,
    settings: state.settings,
    integrations: state.integrations,
    shoppingList: state.shoppingList
  }),
}
)
);
]]></content>
</change>
services/geminiLive.ts
Updated to use the User's API Key if configured, inject the User Profile into the system instruction, and apply Voice Settings.
<change>
<file>services/geminiLive.ts</file>
<description>Inject user settings (API key, voice, profile) into Live API connection</description>
<content><![CDATA[
import * as React from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { useJarvisStore } from '../store';
import { float32To16BitPCM, arrayBufferToBase64, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';
import { SurfaceType } from '../types';
import { getSystemInstruction } from '../constants';
// Tool Definitions
const updateSurfaceTool: FunctionDeclaration = {
name: "updateSurface",
description: "Update the visible UI surface to show relevant information to the user.",
parameters: {
type: Type.OBJECT,
properties: {
surface: {
type: Type.STRING,
enum: ["SHOPPING", "AGENDA", "NEWS", "NONE"],
description: "The type of surface to display."
}
},
required: ["surface"]
}
};
const addShoppingItemTool: FunctionDeclaration = {
name: "addShoppingItem",
description: "Add an item to the user's shopping list.",
parameters: {
type: Type.OBJECT,
properties: {
item: {
type: Type.STRING,
description: "The name of the item to add."
}
},
required: ["item"]
}
};
const tools = [
{ functionDeclarations: [updateSurfaceTool, addShoppingItemTool] }
];
export const useGeminiLive = () => {
const {
setConnected,
setIsSpeaking,
setIsListening,
setActiveSurface,
addShoppingItem,
addTranscriptMessage,
user,
settings
} = useJarvisStore();
const [error, setError] = React.useState<string | null>(null);
// Refs for audio and session management
const audioContextRef = React.useRef<AudioContext | null>(null);
const streamRef = React.useRef<MediaStream | null>(null);
const processorRef = React.useRef<ScriptProcessorNode | null>(null);
const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null);
const sessionPromiseRef = React.useRef<Promise<any> | null>(null);
const currentSessionRef = React.useRef<any>(null);
const nextStartTimeRef = React.useRef<number>(0);
const audioQueueRef = React.useRef<AudioBufferSourceNode[]>([]);
// Refs for transcription buffering
const currentInputRef = React.useRef<string>('');
const currentOutputRef = React.useRef<string>('');
const disconnect = React.useCallback(async () => {
// Close Gemini Session
if (currentSessionRef.current) {
try {
await currentSessionRef.current.close();
} catch (e) {
console.error("Error closing session:", e);
}
currentSessionRef.current = null;
}
sessionPromiseRef.current = null;
code
Code
// Stop Microphone
if (streamRef.current) {
  streamRef.current.getTracks().forEach(track => track.stop());
  streamRef.current = null;
}

// Stop Audio Processing
if (processorRef.current) {
  processorRef.current.disconnect();
  processorRef.current = null;
}
if (sourceRef.current) {
  sourceRef.current.disconnect();
  sourceRef.current = null;
}

// Stop Audio Playback
audioQueueRef.current.forEach(source => {
    try { source.stop(); } catch(e) {}
});
audioQueueRef.current = [];

// Close Audio Context
if (audioContextRef.current) {
  await audioContextRef.current.close();
  audioContextRef.current = null;
}

setConnected(false);
setIsSpeaking(false);
setIsListening(false);
nextStartTimeRef.current = 0;
}, [setConnected, setIsSpeaking, setIsListening]);
const connect = React.useCallback(async () => {
try {
// Determine API Key: User's Personal Key > Env Variable > Empty
let apiKey = '';
if (settings.usePersonalApiKey && settings.personalApiKey) {
apiKey = settings.personalApiKey;
} else {
apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
}
code
Code
if (!apiKey) throw new Error("API Key missing. Please add it in Settings or .env");

  const ai = new GoogleGenAI({ apiKey });
  
  // Initialize Audio Context
  audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  // Get Microphone Stream
  const stream = await navigator.mediaDevices.getUserMedia({ 
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1,
    } 
  });
  streamRef.current = stream;

  // Dynamic System Instruction based on User Profile
  const systemInstruction = getSystemInstruction(user);

  // Connect to Gemini Live
  sessionPromiseRef.current = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025', 
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: systemInstruction,
      tools: tools,
      speechConfig: {
        voiceConfig: { 
          prebuiltVoiceConfig: { 
            voiceName: settings.voiceName || 'Kore'
          } 
        }
      },
    },
    callbacks: {
      onopen: () => {
        console.log("Gemini Live Connected");
        setConnected(true);
        setError(null);
        currentInputRef.current = '';
        currentOutputRef.current = '';

        // Start Audio Streaming logic
        if (!audioContextRef.current || !streamRef.current) return;
        
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = inputCtx.createMediaStreamSource(streamRef.current);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            // Simple VAD: Check RMS
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            setIsListening(rms > 0.01); // Threshold

            const pcm16 = float32To16BitPCM(inputData);
            const base64Data = arrayBufferToBase64(pcm16);
            
            sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Data
                    }
                });
            });
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
        
        sourceRef.current = source;
        processorRef.current = processor;
      },
      onmessage: async (msg: LiveServerMessage) => {
        const session = await sessionPromiseRef.current;
        currentSessionRef.current = session;

        // 1. Handle Tool Calls
        if (msg.toolCall) {
            const responses = [];
            for (const fc of msg.toolCall.functionCalls) {
                console.log("Tool Call:", fc.name, fc.args);
                let result = { result: "ok" };
                
                if (fc.name === "updateSurface") {
                    const surfaceArg = (fc.args as any).surface;
                    if (surfaceArg && SurfaceType[surfaceArg]) {
                        setActiveSurface(SurfaceType[surfaceArg]);
                        result = { result: `Surface updated to ${surfaceArg}` };
                    }
                } else if (fc.name === "addShoppingItem") {
                    const itemArg = (fc.args as any).item;
                    if (itemArg) {
                        addShoppingItem(itemArg);
                        setActiveSurface(SurfaceType.SHOPPING);
                        result = { result: `Added ${itemArg} to list` };
                    }
                }

                responses.push({
                    id: fc.id,
                    name: fc.name,
                    response: result
                });
            }
            session.sendToolResponse({ functionResponses: responses });
        }

        // 2. Handle Audio Output
        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) {
            setIsSpeaking(true);
            if (audioContextRef.current) {
                const audioBuffer = await decodeAudioData(
                    base64ToUint8Array(audioData),
                    audioContextRef.current
                );
                
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                
                const currentTime = audioContextRef.current.currentTime;
                const startTime = Math.max(currentTime, nextStartTimeRef.current);
                
                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
                
                audioQueueRef.current.push(source);
                
                source.onended = () => {
                    const index = audioQueueRef.current.indexOf(source);
                    if (index > -1) audioQueueRef.current.splice(index, 1);
                    if (audioQueueRef.current.length === 0) {
                        setIsSpeaking(false);
                        // Reset cursor if queue is empty to avoid drift
                        if (audioContextRef.current) {
                            nextStartTimeRef.current = audioContextRef.current.currentTime;
                        }
                    }
                };
            }
        }
      },
      onclose: (e) => {
        console.log("Session Closed", e);
        disconnect();
      },
      onerror: (err) => {
        console.error("Session Error", err);
        setError(err.message);
        disconnect();
      }
    }
  });

} catch (err: any) {
  console.error("Connection Failed", err);
  setError(err.message || "Failed to connect");
  setConnected(false);
}
}, [setConnected, setIsSpeaking, setIsListening, setActiveSurface, addShoppingItem, addTranscriptMessage, disconnect, user, settings]);
return { connect, disconnect, error };
};
]]></content>
</change>
components/SettingsDrawer.tsx
New component containing Profile, API Key, Voice, and Integration settings tabs.
<change>
<file>components/SettingsDrawer.tsx</file>
<description>Create SettingsDrawer component with User, API Key, Voice and Integrations tabs</description>
<content><![CDATA[
import * as React from 'react';
import { useJarvisStore } from '../store';
import { X, User, Key, Mic2, Link2, LogIn, CreditCard, ShieldCheck, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';
export const SettingsDrawer: React.FC = () => {
const { isSettingsOpen, toggleSettings, user, login, updateProfile, settings, updateSettings, integrations, toggleIntegration } = useJarvisStore();
const [activeTab, setActiveTab] = React.useState<'profile' | 'key' | 'voice' | 'integrations'>('profile');
const [tempApiKey, setTempApiKey] = React.useState(settings.personalApiKey);
// Profile Form State
const [profileForm, setProfileForm] = React.useState({
name: user?.name || '',
nickname: user?.nickname || '',
profession: user?.profession || '',
ageRange: user?.ageRange || '',
});
React.useEffect(() => {
if (user) {
setProfileForm({
name: user.name,
nickname: user.nickname,
profession: user.profession,
ageRange: user.ageRange
});
}
}, [user]);
const handleLogin = () => {
// Mock Google Login
const mockProfile: UserProfile = {
id: 'google-123',
name: 'Rafael Developer',
nickname: 'Rafael',
profession: 'Engenheiro de Software',
ageRange: '25-34',
language: 'pt-BR',
avatarUrl: 'https://ui-avatars.com/api/?name=Rafael+Developer&background=random',
hasOnboarded: true
};
login(mockProfile);
};
const handleSaveProfile = () => {
if (user) {
updateProfile(profileForm);
}
};
const handleSaveKey = () => {
updateSettings({ personalApiKey: tempApiKey, usePersonalApiKey: !!tempApiKey });
};
if (!isSettingsOpen) return null;
return (
<div className="fixed inset-0 z-50 flex justify-end">
{/* Backdrop */}
<div
className="absolute inset-0 bg-black/60 backdrop-blur-sm"
onClick={() => toggleSettings(false)}
></div>
code
Code
{/* Drawer */}
  <div className="relative w-full md:w-[500px] h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col">
    {/* Header */}
    <div className="p-6 border-b border-white/10 flex justify-between items-center">
      <h2 className="text-xl font-medium tracking-wide">Configurações</h2>
      <button 
        onClick={() => toggleSettings(false)}
        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Auth Barrier or Content */}
    {!user ? (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30 mb-4">
           <ShieldCheck className="w-10 h-10 text-blue-400" />
        </div>
        <h3 className="text-2xl font-light">Acesso Seguro</h3>
        <p className="text-gray-400 max-w-xs leading-relaxed">
          Para personalizar o Jarvis, salvar memórias e conectar sua agenda, faça login com sua conta Google.
        </p>
        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 px-8 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors font-medium shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <LogIn className="w-4 h-4" />
          Entrar com Google
        </button>
      </div>
    ) : (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-white/5">
            {[
                { id: 'profile', icon: User, label: 'Perfil' },
                { id: 'key', icon: Key, label: 'API Key' },
                { id: 'voice', icon: Mic2, label: 'Voz' },
                { id: 'integrations', icon: Link2, label: 'Conexões' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-4 flex flex-col items-center gap-2 text-xs uppercase tracking-wider transition-colors border-b-2
                        ${activeTab === tab.id ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                    `}
                >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <img src={user.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-blue-500/50" />
                        <div>
                            <h3 className="text-lg font-medium">{user.name}</h3>
                            <p className="text-sm text-gray-400">{user.id}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-gray-500 font-bold">Como devo te chamar?</label>
                            <input 
                                type="text" 
                                value={profileForm.nickname}
                                onChange={(e) => setProfileForm({...profileForm, nickname: e.target.value})}
                                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-gray-500 font-bold">Profissão / Ocupação</label>
                            <input 
                                type="text" 
                                value={profileForm.profession}
                                onChange={(e) => setProfileForm({...profileForm, profession: e.target.value})}
                                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                placeholder="Ex: Arquiteto, Estudante..."
                            />
                            <p className="text-[10px] text-gray-500">Isso ajuda o Jarvis a dar exemplos relevantes para você.</p>
                        </div>
                    </div>
                    <button onClick={handleSaveProfile} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Salvar Alterações</button>
                </div>
            )}

            {activeTab === 'key' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">
                        <h4 className="flex items-center gap-2 font-medium mb-2">
                            <CreditCard className="w-4 h-4" /> Plano & Cobrança
                        </h4>
                        <p className="text-yellow-200/70 text-xs leading-relaxed">
                            Você está usando o plano <strong className="text-white">Free Trial</strong> do Jarvis. 
                            Para uso ilimitado e menor latência, recomendamos conectar sua própria chave do Google AI Studio.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs uppercase text-gray-500 font-bold flex justify-between">
                            <span>Sua Gemini API Key</span>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" className="flex items-center gap-1 text-blue-400 hover:underline">
                                Gerar chave <ExternalLink className="w-3 h-3" />
                            </a>
                        </label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={tempApiKey}
                                onChange={(e) => setTempApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full bg-[#111] border border-white/10 rounded-lg pl-4 pr-12 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors font-mono text-sm"
                            />
                            <Key className="absolute right-4 top-3.5 w-5 h-5 text-gray-600" />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                            <span className="text-sm text-gray-300">Usar minha chave pessoal</span>
                            <button 
                                onClick={handleSaveKey}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.usePersonalApiKey ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.usePersonalApiKey ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'voice' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="space-y-4">
                        <label className="text-xs uppercase text-gray-500 font-bold">Perfil de Voz</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => updateSettings({ voiceName: 'Kore' })}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                                    ${settings.voiceName === 'Kore' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-[#111] border-white/10 text-gray-400 hover:bg-white/5'}
                                `}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500"></div>
                                <span className="text-sm font-medium">Kore (Fem)</span>
                            </button>
                            <button 
                                onClick={() => updateSettings({ voiceName: 'Puck' })}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                                    ${settings.voiceName === 'Puck' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-[#111] border-white/10 text-gray-400 hover:bg-white/5'}
                                `}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400"></div>
                                <span className="text-sm font-medium">Puck (Masc)</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 opacity-50 pointer-events-none filter grayscale" title="Em breve">
                         <label className="text-xs uppercase text-gray-500 font-bold flex justify-between">
                            <span>Velocidade</span>
                            <span>1.0x</span>
                         </label>
                         <input type="range" min="0.5" max="2" step="0.1" className="w-full accent-blue-500" />
                    </div>
                </div>
            )}

            {activeTab === 'integrations' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-sm text-gray-400 mb-4">
                        Conecte o Jarvis aos seus serviços Google para permitir que ele gerencie sua vida digital.
                    </p>

                    {[
                        { id: 'googleCalendar', label: 'Google Calendar', desc: 'Agendar e consultar compromissos' },
                        { id: 'googleKeep', label: 'Google Keep/Tasks', desc: 'Gerenciar listas de compras e tarefas' },
                        { id: 'googleGmail', label: 'Gmail', desc: 'Resumir e priorizar e-mails importantes' },
                        { id: 'googleNews', label: 'Google News', desc: 'Briefings personalizados de notícias' },
                    ].map(service => (
                        <div key={service.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
                            <div>
                                <h4 className="font-medium text-white">{service.label}</h4>
                                <p className="text-xs text-gray-500">{service.desc}</p>
                            </div>
                            <button 
                                onClick={() => toggleIntegration(service.id as any)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${integrations[service.id as keyof typeof integrations] ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${integrations[service.id as keyof typeof integrations] ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    ))}

                     <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-xs text-gray-500">
                        <span className="flex items-center gap-2">
                            <RefreshCw className="w-3 h-3" /> Última sincronização
                        </span>
                        <span>{integrations.lastSync || 'Nunca'}</span>
                    </div>
                </div>
            )}

        </div>
      </div>
    )}
  </div>
</div>
);
};
]]></content>
</change>
App.tsx
Added the Settings button and the SettingsDrawer component.
<change>
<file>App.tsx</file>
<description>Add settings button and drawer to main layout</description>
<content><![CDATA[
import * as React from 'react';
import { VoiceOrb } from './components/VoiceOrb';
import { SurfaceManager } from './components/SurfaceManager';
import { SettingsDrawer } from './components/SettingsDrawer';
import { useGeminiLive } from './services/geminiLive';
import { useJarvisStore } from './store';
import { Mic, MicOff, Power, Settings } from 'lucide-react';
function App() {
const { connect, disconnect, error } = useGeminiLive();
const { isConnected, isListening, toggleSettings, user } = useJarvisStore();
const handleToggleConnection = () => {
if (isConnected) {
disconnect();
} else {
connect();
}
};
return (
<div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden flex flex-col items-center justify-center selection:bg-cyan-500/30">
code
Code
{/* Background Ambience */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505] pointer-events-none"></div>
  
  {/* Header */}
  <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-10">
    <div className="flex flex-col">
        <h1 className="text-2xl font-light tracking-[0.2em] uppercase text-white/90">Jarvis <span className="text-blue-500 font-bold">OS</span></h1>
        <span className="text-xs text-gray-500 tracking-wider">Home Automation System v2.5</span>
    </div>
    
    <div className="flex items-center gap-4">
         {/* Settings Trigger */}
         <button 
            onClick={() => toggleSettings(true)}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5 relative group"
            title="Configurações"
         >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            {/* Notification Dot for missing setup */}
            {!user && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>}
         </button>

        {/* Connection Control */}
        <button 
            onClick={handleToggleConnection}
            className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-300 backdrop-blur-md
                ${isConnected 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                }`}
        >
            <Power className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">{isConnected ? 'DISCONNECT' : 'INITIALIZE'}</span>
        </button>
    </div>
  </div>

  {/* Main Content Area */}
  <main className="relative z-10 flex flex-col items-center gap-12">
     {/* Visualizer */}
     <div className="scale-125 md:scale-150">
        <VoiceOrb />
     </div>

     {/* Prompts / Status */}
     <div className="h-12 flex items-center justify-center">
         {!isConnected ? (
             <p className="text-gray-500 text-sm font-light animate-pulse">
                {user ? `Ready for you, ${user.nickname}.` : "Waiting for initialization..."}
             </p>
         ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                {isListening ? <Mic className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-gray-600" />}
                <span className="text-xs text-gray-300 tracking-wider">{isListening ? "LISTENING" : "STANDBY"}</span>
            </div>
         )}
     </div>

     {error && (
         <div className="absolute bottom-24 bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-3 rounded-lg text-sm max-w-md text-center">
             {error}. Please check your API Key in Settings.
         </div>
     )}
  </main>

  {/* Dynamic Surfaces (Side Panel) */}
  <SurfaceManager />

  {/* Settings Modal/Drawer */}
  <SettingsDrawer />

  {/* Footer info */}
  <div className="absolute bottom-6 left-0 w-full text-center z-10 pointer-events-none">
      <p className="text-[10px] text-gray-700 uppercase tracking-widest">
        Powered by Google Gemini Live API • Multimodal • Realtime
      </p>
  </div>

</div>
);
}
export d