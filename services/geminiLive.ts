import * as React from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { useJarvisStore } from '../store';
import { float32To16BitPCM, arrayBufferToBase64, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';
import { SurfaceType } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

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
    addTranscriptMessage
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
      // Safely access env var or empty string to prevent crashes if process is undefined
      const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
      
      if (!apiKey) throw new Error("API Key not found in process.env");

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

      // Connect to Gemini Live
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025', 
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: tools,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          // Transcription disabled to prevent internal errors in preview
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setConnected(true);
            currentInputRef.current = '';
            currentOutputRef.current = '';

            // Start Audio Streaming logic
            if (!audioContextRef.current || !streamRef.current) return;
            
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(streamRef.current);
            // Using ScriptProcessor for broader compatibility in this context
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

            // 3. Handle Transcriptions (Context)
            const inputTranscript = msg.serverContent?.inputTranscription?.text;
            if (inputTranscript) {
                currentInputRef.current += inputTranscript;
            }
            
            const outputTranscript = msg.serverContent?.outputTranscription?.text;
            if (outputTranscript) {
                currentOutputRef.current += outputTranscript;
            }

            // 4. Handle Turn Completion (Commit transcripts)
            if (msg.serverContent?.turnComplete) {
                // Interruption handling
                if (msg.serverContent.interrupted) {
                    audioQueueRef.current.forEach(s => s.stop());
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
  }, [setConnected, setIsSpeaking, setIsListening, setActiveSurface, addShoppingItem, addTranscriptMessage, disconnect]);

  return { connect, disconnect, error };
};
