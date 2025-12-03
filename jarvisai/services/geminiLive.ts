import * as React from 'react';
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
  FunctionDeclaration,
} from '@google/genai';
import { useJarvisStore } from '../store';
import {
  float32To16BitPCM,
  arrayBufferToBase64,
  decodeAudioData,
  base64ToUint8Array,
} from '../utils/audioUtils';
import { SurfaceType } from '../types';
import { getSystemInstruction } from '../constants';

// Tool Definitions
const updateSurfaceTool: FunctionDeclaration = {
  name: 'updateSurface',
  description: 'Atualiza a surface visível para mostrar informações relevantes ao usuário.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      surface: {
        type: Type.STRING,
        enum: ['SHOPPING', 'AGENDA', 'NEWS', 'NONE'],
        description: 'Tipo de surface a abrir ou fechar.',
      },
    },
    required: ['surface'],
  },
};

const addShoppingItemTool: FunctionDeclaration = {
  name: 'addShoppingItem',
  description: 'Adiciona um item à lista de compras do usuário.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      item: {
        type: Type.STRING,
        description: 'Nome do item para adicionar.',
      },
    },
    required: ['item'],
  },
};

const checkTimeTool: FunctionDeclaration = {
  name: 'checkTime',
  description: 'Retorna a hora local do usuário para confirmar compromissos.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};

const tools = [{ functionDeclarations: [updateSurfaceTool, addShoppingItemTool, checkTimeTool] }];

const mapVoiceName = (gender: string | undefined) => {
  if (gender === 'male') return 'Puck';
  if (gender === 'neutral') return 'Aoede';
  return 'Kore';
};

export const useGeminiLive = () => {
  const {
    setConnected,
    setIsSpeaking,
    setIsListening,
    setActiveSurface,
    addShoppingItem,
    addTranscriptMessage,
    userProfile,
    voice,
    billing,
    apiKeyStatus,
    userApiKey,
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

  const resolveApiKey = () => {
    if (!billing.usingPlatformVoice && apiKeyStatus.hasUserKey && userApiKey) {
      return userApiKey;
    }
    if (typeof process !== 'undefined' && process.env) {
      const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
      if (envKey) return envKey;
    }
    if (apiKeyStatus.hasUserKey && userApiKey) {
      return userApiKey;
    }
    return '';
  };

  const disconnect = React.useCallback(async () => {
    if (currentSessionRef.current) {
      try {
        await currentSessionRef.current.close();
      } catch (e) {
        console.error('Error closing session:', e);
      }
      currentSessionRef.current = null;
    }
    sessionPromiseRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    audioQueueRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        /* ignore */ 
      }
    });
    audioQueueRef.current = [];

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    nextStartTimeRef.current = 0;
  }, [setConnected, setIsListening, setIsSpeaking]);

  const connect = React.useCallback(async () => {
    try {
      const apiKey = resolveApiKey();
      if (!apiKey) {
        throw new Error(
          'API Key ausente. Configure uma chave Gemini nas Configurações ou defina API_KEY em .env.local.',
        );
      }

      const ai = new GoogleGenAI({ apiKey });
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const systemInstruction = getSystemInstruction(userProfile, voice, billing);
      const voiceName = voice.preferredVoiceName || mapVoiceName(voice.gender);

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          tools,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
        callbacks: {
          onopen: () => {
            setConnected(true);
            setError(null);
            currentInputRef.current = '';
            currentOutputRef.current = '';

            if (!audioContextRef.current || !streamRef.current) return;

            const inputCtx = new (window.AudioContext ||
              (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(streamRef.current);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setIsListening(rms > 0.01);

              const pcm16 = float32To16BitPCM(inputData);
              const base64Data = arrayBufferToBase64(pcm16);

              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data,
                  },
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

            if (msg.toolCall) {
              const responses = [];
              for (const fc of msg.toolCall.functionCalls) {
                let result: any = { result: 'ok' };

                if (fc.name === 'updateSurface') {
                  const surfaceArg = (fc.args as any).surface;
                  if (surfaceArg && SurfaceType[surfaceArg]) {
                    setActiveSurface(SurfaceType[surfaceArg]);
                    result = { result: `Surface updated to ${surfaceArg}` };
                  }
                } else if (fc.name === 'addShoppingItem') {
                  const itemArg = (fc.args as any).item;
                  if (itemArg) {
                    addShoppingItem(itemArg);
                    setActiveSurface(SurfaceType.SHOPPING);
                    result = { result: `Added ${itemArg} to list` };
                  }
                } else if (fc.name === 'checkTime') {
                  const now = new Date();
                  result = {
                    result: new Intl.DateTimeFormat('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(now),
                  };
                }

                responses.push({
                  id: fc.id,
                  name: fc.name,
                  response: result,
                });
              }
              session.sendToolResponse({ functionResponses: responses });
            }

            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              if (audioContextRef.current) {
                const audioBuffer = await decodeAudioData(
                  base64ToUint8Array(audioData),
                  audioContextRef.current,
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
                    if (audioContextRef.current) {
                      nextStartTimeRef.current = audioContextRef.current.currentTime;
                    }
                  }
                };
              }
            }

            const inputTranscript = msg.serverContent?.inputTranscription?.text;
            if (inputTranscript) {
              currentInputRef.current += inputTranscript;
            }

            const outputTranscript = msg.serverContent?.outputTranscription?.text;
            if (outputTranscript) {
              currentOutputRef.current += outputTranscript;
            }

            if (msg.serverContent?.turnComplete) {
              if (msg.serverContent.interrupted) {
                audioQueueRef.current.forEach((s) => s.stop());
                audioQueueRef.current = [];
                setIsSpeaking(false);
                nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
              }

              if (currentInputRef.current.trim()) {
                addTranscriptMessage('user', currentInputRef.current);
                currentInputRef.current = '';
              }
              if (currentOutputRef.current.trim()) {
                addTranscriptMessage('model', currentOutputRef.current);
                currentOutputRef.current = '';
              }
            }
          },
          onclose: (e) => {
            console.log('Session Closed', e);
            disconnect();
          },
          onerror: (err) => {
            console.error('Session Error', err);
            setError(err.message);
            disconnect();
          },
        },
      });
    } catch (err: any) {
      console.error('Connection Failed', err);
      setError(err.message || 'Failed to connect');
      setConnected(false);
    }
  }, [
    addShoppingItem,
    addTranscriptMessage,
    apiKeyStatus.hasUserKey,
    billing,
    disconnect,
    setActiveSurface,
    setConnected,
    setIsListening,
    setIsSpeaking,
    userApiKey,
    userProfile,
    voice,
  ]);

  return { connect, disconnect, error };
};
