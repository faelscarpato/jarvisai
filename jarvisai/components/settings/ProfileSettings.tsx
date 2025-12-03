import * as React from 'react';
import { useJarvisStore } from '../../store';
import { useAuthStore } from '../../state/authStore';
import { userProfileService } from '../../services/userProfileService';

export const ProfileSettings: React.FC = () => {
  const { userProfile, setUserProfile, setVoice } = useJarvisStore();
  const { session, login, loading } = useAuthStore();
  const [status, setStatus] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    fullName: userProfile?.fullName || '',
    nickname: userProfile?.nickname || '',
    occupation: userProfile?.occupation || '',
    ageRange: userProfile?.ageRange || '',
    language: userProfile?.language || 'pt-BR',
  });

  React.useEffect(() => {
    setForm({
      fullName: userProfile?.fullName || '',
      nickname: userProfile?.nickname || '',
      occupation: userProfile?.occupation || '',
      ageRange: userProfile?.ageRange || '',
      language: userProfile?.language || 'pt-BR',
    });
  }, [userProfile]);

  const handleLogin = async () => {
    setStatus(null);
    await login();
  };

  const handleSave = async () => {
    if (!session) {
      setStatus('Faça login com Google para salvar no servidor.');
      return;
    }
    const payload = {
      id: session.userId,
      fullName: form.fullName || session.displayName,
      nickname: form.nickname || session.displayName,
      occupation: form.occupation,
      ageRange: form.ageRange,
      language: form.language as 'pt-BR' | 'en-US',
      updatedAt: new Date().toISOString(),
    };
    await userProfileService.saveProfile(session.userId, payload);
    setUserProfile(payload);
    setVoice({ locale: payload.language });
    setStatus('Perfil salvo e sincronizado.');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Perfil do usuário</h3>
          <p className="text-sm text-gray-500">Personalize como o Jarvis fala com você.</p>
        </div>
        <button
          onClick={session ? undefined : handleLogin}
          className="px-4 py-2 text-xs rounded-full border border-white/10 hover:border-blue-400 hover:text-blue-300 transition-colors"
          disabled={loading}
        >
          {session ? 'Conectado' : loading ? 'Conectando...' : 'Login Google'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-gray-400">Nome completo</span>
          <input
            className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            placeholder="Nome"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-400">Como devo te chamar?</span>
          <input
            className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
            value={form.nickname}
            onChange={(e) => setForm((prev) => ({ ...prev, nickname: e.target.value }))}
            placeholder="Apelido"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-400">O que você faz da vida?</span>
          <input
            className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
            value={form.occupation}
            onChange={(e) => setForm((prev) => ({ ...prev, occupation: e.target.value }))}
            placeholder="Profissão / ocupação"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-gray-400">Faixa de idade</span>
            <input
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
              value={form.ageRange}
              onChange={(e) => setForm((prev) => ({ ...prev, ageRange: e.target.value }))}
              placeholder="Ex: 25-34"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-gray-400">Idioma</span>
            <select
              className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
              value={form.language}
              onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))}
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
            </select>
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
      >
        Salvar alterações
      </button>

      {status && <p className="text-xs text-green-400">{status}</p>}
      {userProfile?.updatedAt && (
        <p className="text-[11px] text-gray-500">
          Última atualização: {new Date(userProfile.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};
