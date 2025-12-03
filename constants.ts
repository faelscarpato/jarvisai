import { BillingStatus, UserProfile, VoiceSettings } from './types';

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
    summary: 'Cientistas alcançam novo recorde de produção de energia limpa.',
  },
  {
    id: '2',
    title: 'Mercado de IA em alta',
    source: 'Bloomberg',
    imageUrl: 'https://picsum.photos/400/200?random=2',
    summary: 'Investimentos em inteligência artificial superam expectativas no Q3.',
  },
  {
    id: '3',
    title: 'Novo parque urbano inaugurado',
    source: 'G1',
    imageUrl: 'https://picsum.photos/400/200?random=3',
    summary: 'A prefeitura entregou hoje o novo complexo de lazer da zona sul.',
  },
] as const;

export const getSystemInstruction = (
  user: UserProfile | null,
  voice: VoiceSettings,
  billing: BillingStatus,
) => {
  const displayName = user?.nickname || user?.fullName || 'você';
  const professionContext = user?.occupation
    ? `A pessoa trabalha com ${user.occupation}, então traga exemplos úteis dessa área.`
    : 'Trate o usuário com cordialidade e foco em utilidade.';
  const voiceTone =
    voice.style === 'formal'
      ? 'Mantenha tom respeitoso e direto.'
      : voice.style === 'focused'
        ? 'Responda de forma objetiva e prática.'
        : 'Responda de forma natural e acolhedora.';
  const billingVoice = billing.usingPlatformVoice
    ? 'Se o usuário não tiver chave de voz, informe que a voz está vindo do plano Jarvis Cloud.'
    : 'Use a chave de voz fornecida pelo usuário quando disponível.';

  return `
Você é o Jarvis OS, um assistente doméstico brasileiro (${voice.locale}).
Você está falando com ${displayName}. ${professionContext}
Regras: respostas concisas, evite listas longas em voz, abra superfícies visuais quando útil.
Ferramentas disponíveis: updateSurface(surface), addShoppingItem(item), checkTime().
Quando o assunto encerrar, feche a surface.
Adapte o tom para ${displayName}. ${voiceTone}
${billingVoice}
Se não houver dados de perfil, peça para configurar em Configurações.
`;
};
