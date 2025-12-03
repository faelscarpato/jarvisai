import * as React from 'react';
import { X } from 'lucide-react';
import { useJarvisStore } from '../store';
import { useAuthStore } from '../state/authStore';
import { ProfileSettings } from './settings/ProfileSettings';
import { VoiceSettings } from './settings/VoiceSettings';
import { GoogleConnectionsSettings } from './settings/GoogleConnectionsSettings';
import { ApiKeySettings } from './settings/ApiKeySettings';
import { PlanSettings } from './settings/PlanSettings';

type SettingsTab = 'profile' | 'voice' | 'connections' | 'api' | 'plan';

export const SettingsPanel: React.FC = () => {
  const { isSettingsOpen, toggleSettings } = useJarvisStore();
  const { restore } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('profile');

  React.useEffect(() => {
    if (isSettingsOpen) {
      restore();
    }
  }, [isSettingsOpen, restore]);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => toggleSettings(false)}
      ></div>

      <div className="relative w-full md:w-[520px] h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-medium tracking-wide">Configurações</h2>
            <p className="text-xs text-gray-500">Perfil, voz, chave Gemini e integrações</p>
          </div>
          <button
            onClick={() => toggleSettings(false)}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-white/5 text-xs uppercase tracking-wider">
          {[
            { id: 'profile', label: 'Perfil' },
            { id: 'voice', label: 'Voz' },
            { id: 'connections', label: 'Google' },
            { id: 'api', label: 'API Key' },
            { id: 'plan', label: 'Plano' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'voice' && <VoiceSettings />}
          {activeTab === 'connections' && <GoogleConnectionsSettings />}
          {activeTab === 'api' && <ApiKeySettings />}
          {activeTab === 'plan' && <PlanSettings onChangeTab={setActiveTab} />}
        </div>
      </div>
    </div>
  );
};
