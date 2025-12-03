import * as React from 'react';
import { VoiceOrb } from './components/VoiceOrb';
import { SurfaceManager } from './components/SurfaceManager';
import { useGeminiLive } from './services/geminiLive';
import { useJarvisStore } from './store';
import { Mic, MicOff, Power } from 'lucide-react';

function App() {
  const { connect, disconnect, error } = useGeminiLive();
  const { isConnected, isListening } = useJarvisStore();

  const handleToggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden flex flex-col items-center justify-center selection:bg-cyan-500/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505] pointer-events-none"></div>
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-10">
        <div className="flex flex-col">
            <h1 className="text-2xl font-light tracking-[0.2em] uppercase text-white/90">Jarvis <span className="text-blue-500 font-bold">OS</span></h1>
            <span className="text-xs text-gray-500 tracking-wider">Home Automation System v2.5</span>
        </div>
        
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

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-col items-center gap-12">
         {/* Visualizer */}
         <div className="scale-125 md:scale-150">
            <VoiceOrb />
         </div>

         {/* Prompts / Status */}
         <div className="h-12 flex items-center justify-center">
             {!isConnected ? (
                 <p className="text-gray-500 text-sm font-light animate-pulse">Waiting for initialization...</p>
             ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                    {isListening ? <Mic className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-gray-600" />}
                    <span className="text-xs text-gray-300 tracking-wider">{isListening ? "LISTENING" : "STANDBY"}</span>
                </div>
             )}
         </div>

         {error && (
             <div className="absolute bottom-24 bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-3 rounded-lg text-sm max-w-md text-center">
                 {error}. Please check your API Key.
             </div>
         )}
      </main>

      {/* Dynamic Surfaces (Side Panel) */}
      <SurfaceManager />

      {/* Footer info */}
      <div className="absolute bottom-6 left-0 w-full text-center z-10 pointer-events-none">
          <p className="text-[10px] text-gray-700 uppercase tracking-widest">
            Powered by Google Gemini Live API • Multimodal • Realtime
          </p>
      </div>

    </div>
  );
}

export default App;