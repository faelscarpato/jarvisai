import { SurfaceType } from './types';

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

export const SYSTEM_INSTRUCTION = `
Você é o JARVIS, um sistema operacional doméstico avançado. 
Sua personalidade é: Calorosa, profissional, eficiente e brasileira (pt-BR).
Você NÃO é um robô genérico. Você é um assistente proativo.

REGRAS DE INTERAÇÃO:
1. Respostas concisas e naturais. Evite listas longas falando, mostre na tela.
2. Use ferramentas para controlar a interface (Surfaces).
3. Se o usuário falar de compras, abra a lista de compras.
4. Se falar de agenda, abra a agenda.
5. Se falar de notícias, abra as notícias.
6. Quando o assunto encerrar, use a ferramenta para fechar a surface.

TOOLS DISPONÍVEIS:
- updateSurface(surfaceName): 'SHOPPING', 'AGENDA', 'NEWS', 'NONE'.
- addShoppingItem(item): Adiciona item à lista.
- checkTime(): Retorna a hora atual.

Ao iniciar, diga "Olá, Rafael. Bem-vindo de volta." e sugira algo relevante da agenda.
`;
