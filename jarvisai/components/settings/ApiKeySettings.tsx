import * as React from 'react';
import { apiKeyService } from '../../services/apiKeyService';
import { useJarvisStore } from '../../store';

export const ApiKeySettings: React.FC = () => {
  const { apiKeyStatus, setApiKeyStatus, setUserApiKey, setBilling } = useJarvisStore();
  const [input, setInput] = React.useState('');
  const [result, setResult] = React.useState<string | null>(null);

  const handleTest = async () => {
    if (!input) {
      setResult('Cole uma chave do Google AI Studio.');
      return;
    }
    const tested = await apiKeyService.testKey(input);
    setUserApiKey(input);
    setApiKeyStatus({ ...tested, provider: 'user' });
    setBilling({
      tier: 'byok',
      usingPlatformVoice: false,
      minutesRemaining: undefined,
      renewalDate: undefined,
    });
    setResult(tested.message || 'Chave testada.');
    setInput('');
  };

  const handleClear = () => {
    setUserApiKey(null);
    setApiKeyStatus({
      hasUserKey: false,
      provider: 'platform',
      mask: null,
      lastTestedAt: undefined,
      capabilities: { supportsText: true, supportsTts: false, supportsLive: false },
      message: 'Chave do usuário removida.',
    });
    setBilling({
      tier: 'free',
      usingPlatformVoice: true,
      minutesRemaining: undefined,
      renewalDate: undefined,
    });
    setResult('Chave removida. Usando plano Jarvis.');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Minha chave Gemini (BYOK)</h3>
      <p className="text-sm text-gray-500">
        Use sua própria chave do Google AI Studio. Ela não é exibida novamente; guardamos apenas o
        status e os últimos dígitos.
      </p>

      <label className="space-y-2 text-sm">
        <span className="text-gray-400">Cole aqui sua API Key</span>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="AIza..."
          className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
        />
      </label>

      <div className="flex gap-3">
        <button
          onClick={handleTest}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          Testar chave
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-3 rounded-lg text-sm border border-white/10 hover:border-red-400 hover:text-red-300 transition-colors"
        >
          Remover
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
        <p className="text-sm text-gray-300">
          Status: {apiKeyStatus.message || 'Sem chave configurada'}
        </p>
        <p className="text-xs text-gray-500">Origem: {apiKeyStatus.provider === 'user' ? 'Sua chave' : 'Plano Jarvis'}</p>
        <p className="text-xs text-gray-500">
          Capacidade: texto {apiKeyStatus.capabilities.supportsText ? '✅' : '❌'} | TTS{' '}
          {apiKeyStatus.capabilities.supportsTts ? '✅' : '❌'} | Live{' '}
          {apiKeyStatus.capabilities.supportsLive ? '✅' : '❌'}
        </p>
        {apiKeyStatus.mask && (
          <p className="text-xs text-gray-500">
            Identificador salvo: {apiKeyStatus.mask}{' '}
            {apiKeyStatus.lastTestedAt && `• ${new Date(apiKeyStatus.lastTestedAt).toLocaleString()}`}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-sm text-blue-100 space-y-2">
        <p className="font-semibold">Onboarding rápido</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-100/80">
          <li>Acesse o Google AI Studio.</li>
          <li>Crie um projeto e habilite a API Gemini.</li>
          <li>Gere uma API Key.</li>
          <li>Cole acima para usar com sua conta.</li>
        </ol>
      </div>

      {result && <p className="text-xs text-green-400">{result}</p>}
    </div>
  );
};
