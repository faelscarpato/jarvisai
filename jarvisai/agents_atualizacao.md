[CONFIGURAÇÕES, PERFIL DO USUÁRIO E CONEXÕES]

Implemente uma **SEÇÃO DE CONFIGURAÇÕES** completa, acessível a partir da interface principal (ícone ou botão “Configurações / Perfil”), com as seguintes áreas:

1. PERFIL DO USUÁRIO
   - Campos:
     - Nome completo
     - Idade
     - O que a pessoa faz da vida (profissão / ocupação / descrição livre)
   - Requisitos:
     - Esses dados devem ser salvos no back-end, vinculados ao `userId` do login Google.
     - O modelo Gemini deve receber esses dados como parte do “contexto estável” do usuário, para personalizar o jeito de falar:
       - Ex.: “Rafael, como andam as coisas na área de front-end?” em vez de respostas genéricas.
     - A tela de Perfil deve permitir:
       - Editar informações
       - Ver quando foram atualizadas pela última vez
       - Sincronizar o “tom” do assistente com o perfil (mais técnico, mais emocional, etc. se desejado futuramente).

2. CONFIGURAÇÃO DE VOZ DO AGENTE
   - Opções obrigatórias:
     - Voz feminina
     - Voz masculina
   - (Opcional, mas desejável): tom extra:
     - “mais formal”, “mais descontraída”, “mais focada”, “mais empática”.
   - Requisitos:
     - Essas escolhas alteram a configuração enviada para a API de TTS/Live (ex: `voice_profile`, `style`, `locale=pt-BR`).
     - As preferências de voz são persistidas por usuário.
     - Se o dispositivo não suportar áudio em tempo real, ainda assim as respostas devem usar TTS sempre que possível (ou cair para texto se indisponível).

3. CHAVES DE API GEMINI (BYOK – Bring Your Own Key)
   - A tela de Configurações deve ter uma área:
     - “Minha chave de API Gemini (Google AI Studio)”
   - Funcionalidades:
     - Campo de input seguro para inserir a chave (`GEMINI_API_KEY_USER`).
     - Botão “Testar chave”:
       - O back-end:
         - Faz uma chamada de teste para:
           - Um modelo de texto (ex: `gemini-2.5-flash` ou similar).
           - Opcionalmente, um modelo compatível com Live/voz.
         - Retorna um diagnóstico:
           - `supportsTextOnly`, `supportsTts`, `supportsLive`.
       - O front exibe:
         - Mensagem como:
           - “Sua chave suporta: texto + TTS + voz em tempo real.”
           - ou “Sua chave suporta apenas chamadas de texto. Para usar o Jarvis por voz, ative um plano ou adicione outra chave compatível.”
     - A chave NUNCA deve ser exposta novamente em texto puro no front, apenas armazenada no back-end de forma segura.

   - Instrução de onboarding:
     - Na UI e na lógica, o sistema deve orientar o usuário:
       - Com um passo a passo simplificado:
         - “Crie seu projeto no Google AI Studio.”
         - “Gere uma API key.”
         - “Cole aqui para usar o Jarvis com sua própria conta.”
     - O modelo, sempre que necessário, deve ser capaz de gerar um pequeno guia em língua natural para ajudar o usuário a criar essa chave.

4. LOGIN COM GOOGLE (GOOGLE AUTH) E MEMÓRIA DE ESTADO

   - Implementar **login com Google Auth** para:
     - Identificar o usuário de forma única (`userId`, e-mail, nome).
     - Salvar:
       - Perfil
       - Preferências (voz, idioma, superfícies favoritas)
       - Estado de memória do agente (resumos de contexto, hábitos, rotinas).
   - Após o login, o sistema deve:
     - Carregar automaticamente:
       - Perfil do usuário
       - Configurações de voz
       - Ligações com Google Keep / Agenda / Gmail / etc.
       - Planos ativos (se estiver usando plano pago).
     - Engajar o usuário com base nesses dados:
       - Ex.: “Rafael, vi que ontem você adicionou ‘reunião com o fornecedor’ no calendário. Quer revisar isso agora?”

   - Integrações com Google:
     - Pelo menos as seguintes conexões devem ser previstas como módulos:
       - Google Keep (listas e anotações)
       - Google Calendar (agenda, lembretes e compromissos)
       - Gmail (leitura/resumo de e-mails importantes, com permissão explícita)
       - Google Notícias ou equivalente (busca de notícias relevantes)
     - Na seção de Configurações, exibir **switches**/toggles:
       - “Conectar ao Google Keep”
       - “Conectar ao Google Agenda”
       - “Conectar ao Gmail”
       - “Conectar a Notícias”
     - Ao ativar um toggle:
       - O sistema dispara o fluxo OAuth correspondente.
       - Se o usuário conceder acesso, armazenar tokens de forma segura no back-end.
       - Na conversa, o modelo passa a poder:
         - Criar notas no Keep, tarefas e eventos no Calendar.
         - Ler/resumir e-mails (ex: caixa de entrada marcada como importante).
         - Buscar notícias atuais e mostrá-las visualmente.

5. PLANOS, PAGAMENTO E DETECÇÃO DE CAPACIDADE DE VOZ

   - Há duas formas de uso da IA Gemini:

     A) **BYOK – Usuário traz a própria API key (uso simples / direto)**
        - O usuário cria a chave no Google AI Studio.
        - Cola a chave na seção de Configurações.
        - O sistema testa e identifica:
          - Se a chave permite:
            - Apenas chamadas de texto.
            - TTS (texto → voz).
            - Live API (voz em tempo real).
        - A UI deve mostrar claramente:
          - Que recursos estão habilitados com a chave atual.

     B) **Serviço interno “Jarvis Gemini TTS/Voice” (plano pago)**
        - Para usuários sem chave própria (ou com chave limitada), oferecer:
          - Plano mensal (assinatura, voz + TTS inclusos até certo limite).
          - Plano por uso (paga por minuto de voz ou por número de chamadas).
        - A tela de Configurações deve ter:
          - Uma área “Plano Jarvis / Assinatura”.
          - Estado do plano:
            - “Gratuito (texto apenas)”
            - “Assinatura ativa (voz + TTS)”
            - “Pré-pago por uso (x minutos restantes)”
        - O back-end deve ter um `billingService` (mesmo que implementado como stub inicial) que:
          - Verifica se o usuário pode usar:
            - Live API (voz contínua)
            - TTS (respostas faladas)
          - Informa ao front e ao modelo, via flags no contexto.

   - Lógica de detecção e fallback:
     - Após login + configuração:
       - Se `userHasOwnLiveCapableKey`: usar a chave do usuário para voz em tempo real.
       - Senão, se `userHasPaidPlan`: usar chave do serviço “Jarvis Cloud” para Live/TTS.
       - Senão:
         - Restrição automática:
           - Assistente funciona em texto.
           - TTS e voz ficam desabilitados ou limitados.
         - O modelo deve avisar de forma amigável:
           - “No momento estou falando com você só por texto. Se quiser voz, você pode colar uma chave do Google AI Studio ou ativar um plano de voz aqui nas configurações.”

6. SUPERFÍCIE DE CONFIGURAÇÕES NA UI

   - Implemente um componente de interface para Configurações com:
     - Abas ou seções:
       1. “Perfil”
       2. “Voz”
       3. “Conexões Google”
       4. “Chaves de API”
       5. “Plano / Assinatura”
   - Requisitos de UX:
     - Mobile-first:
       - Configurações em um `drawer` ou `sheet` que sobe de baixo.
     - Desktop:
       - Modal central ou coluna lateral.
     - Todas as alterações relevantes devem:
       - Ser salvas apenas quando o usuário clicar em “Salvar”.
       - Enviar feedback claro (“Configurações atualizadas com sucesso.”).

   - Integração com o fluxo de conversa:
     - O modelo deve ser capaz de sugerir abertura da tela de Configurações:
       - Ex.: “Quer que eu configure sua voz para algo mais calmo? Posso te levar até as configurações.”
     - O back-end pode retornar eventos de UI:
       - `uiEvent: "OPEN_SETTINGS_TAB", tab: "voice"`
       - E o front deve reagir abrindo a seção correta.

[ATUALIZAÇÃO NA ESTRUTURA DO CÓDIGO A GERAR]

Na seção de estrutura do projeto, inclua também:

- Front-end:
  - `src/components/SettingsPanel.tsx`
  - `src/components/settings/ProfileSettings.tsx`
  - `src/components/settings/VoiceSettings.tsx`
  - `src/components/settings/GoogleConnectionsSettings.tsx`
  - `src/components/settings/ApiKeySettings.tsx`
  - `src/components/settings/PlanSettings.tsx`
  - `src/state/authStore.ts`
  - `src/services/authClient.ts` (para fluxo Google Auth no front)

- Back-end:
  - `src/services/authService.ts` (Google Auth, geração/validação de sessões)
  - `src/services/billingService.ts` (verificação de plano, limites de uso)
  - `src/services/userProfileService.ts` (perfil, preferências)
  - `src/services/integrations/googleKeepService.ts`
  - `src/services/integrations/googleCalendarService.ts`
  - `src/services/integrations/googleGmailService.ts`
  - `src/services/integrations/googleNewsService.ts`
  - `src/services/apiKeyService.ts` (armazenar e testar chaves Gemini do usuário)

Todos esses arquivos devem ser gerados com código completo e coerente, mesmo que algumas integrações externas sejam simuladas ou stubadas na primeira versão, com comentários claros explicando onde plugar as chamadas reais às APIs Google.







---------------------------------------------

[MÓDULO DE CONFIGURAÇÕES, CONTA E PREFERÊNCIAS DO USUÁRIO]

A aplicação DEVE ter uma seção dedicada de **Configurações** (Settings), acessível via ícone no topo da interface do Jarvis, com as seguintes áreas:

1. PERFIL DO USUÁRIO
   - Campos:
     - Nome completo
     - Nome pelo qual o assistente deve chamar o usuário (apelido)
     - O que o usuário faz da vida (profissão/ocupação)
     - Idade (ou faixa etária)
     - Idioma preferido (ex: pt-BR, en-US)
   - Comportamento:
     - Esses dados são usados para personalizar o diálogo:
       - Vocabulário (mais técnico, mais simples).
       - Exemplos práticos (trazer contexto da profissão).
       - Tom de voz (mais formal ou mais solto).
     - O assistente deve memorizar essas informações e utilizá-las nas conversas futuras.
   - Persistência:
     - Salvar no banco (tabela ou coleção `user_profiles`), indexado por `userId` (ID do Google).

2. AUTENTICAÇÃO COM GOOGLE (GOOGLE AUTH)
   - Login obrigatório para:
     - Salvar estado de memória do agente.
     - Habilitar integrações com Google Keep, Agenda, Notícias, Gmail, etc.
   - Requisitos técnicos:
     - Front-end:
       - Botão “Entrar com Google” usando Google Identity Services (OAuth).
       - Após login, guardar o token de sessão no front (ex: via cookie HttpOnly ou storage seguro).
     - Back-end:
       - Endpoint `/auth/google/callback` que:
         - Valida o token do Google.
         - Cria ou atualiza o usuário no banco (`users`):
           - `id`
           - `googleId`
           - `email`
           - `createdAt`, `updatedAt`
       - Retorna um token de sessão próprio da aplicação (JWT ou sessão de servidor).
   - Após login:
     - Carregar perfil do usuário.
     - Carregar configurações de voz.
     - Carregar status de integrações (Keep, Agenda, etc.).
     - Carregar plano de uso (free, key própria, TTS pago).

3. GERENCIAMENTO DE CHAVE DE API GEMINI (DO USUÁRIO)
   - Na tela de Configurações, seção: **“Minha chave Gemini”**.
   - Campos:
     - Input de texto mascarado para `GEMINI_API_KEY_USER`.
     - Botão “Testar chave”.
   - Comportamento ao salvar:
     - Enviar a chave ao back-end via HTTPS.
     - Back-end salva a chave de forma:
       - Criptografada, ou
       - Tokenizada, ou
       - Apenas associada a um ID seguro (explicar no README que em produção deve usar cofres de segredo).
     - Back-end executa um “teste de capacidade”:
       - Verifica se a chave consegue:
         - Chamar modelos de texto (ex: `gemini-2.5-flash`).
         - Chamar modelos com voz/Live API (se aplicável).
       - Salva flags no banco:
         - `hasGeminiTextAccess`
         - `hasGeminiVoiceAccess`
   - UI:
     - Mostrar status:
       - “Chave válida para texto e voz.”
       - “Chave válida apenas para texto. Para voz em tempo real, você pode usar o serviço TTS do Jarvis.”

4. SERVIÇO PRÓPRIO DE GEMINI TTS (PLANO PAGO)
   - Cenário:
     - Usuário logado com Google, mas:
       - Não tem chave Gemini própria, ou
       - Tem chave que só habilita texto (sem Live/TTS avançado).
   - Então o sistema oferece um **serviço de TTS próprio**, baseado em uma chave Gemini do PROJETO (do desenvolvedor), com cobrança:
     - Plano mensal (assinatura).
     - Plano por uso (pay-per-use).
   - Requisitos:
     - Tabela `billing_plans`:
       - `id`, `name`, `type` (monthly / usage), `price`, `ttsQuota` (para uso).
     - Tabela `user_subscriptions`:
       - `userId`
       - `planId`
       - `status` (active, canceled, trial)
       - `ttsUsage` (contador de caracteres / minutos)
     - Back-end:
       - Middleware que decide:
         - Se usa `GEMINI_API_KEY_USER` (quando disponível e habilitada para voz).
         - Ou se usa `GEMINI_API_KEY_PLATFORM` + cobrança de uso.
   - UI na Configuração:
     - Seção “Plano e Voz”:
       - Mostrar qual plano o usuário está usando:
         - “Usando sua própria chave Gemini (texto + voz).”
         - “Usando plano TTS mensal (X minutos/mês).”
         - “Usando plano TTS pré-pago (Y minutos restantes).”
       - Botões de upgrade/downgrade (linkando para uma tela de pagamento que pode ser mock inicialmente).

5. ORIENTAÇÃO PARA CRIAR PRÓPRIA API KEY NO GOOGLE AI STUDIO
   - Na mesma seção “Minha chave Gemini”, incluir:
     - Um pequeno tutorial em texto, explicando:
       - “1. Acesse o Google AI Studio.”
       - “2. Crie um projeto e habilite a API Gemini.”
       - “3. Gere uma chave de API.”
       - “4. Cole abaixo.”
   - Opcional:
     - Um botão “Ver tutorial passo a passo”, abrindo um modal com instruções mais detalhadas (link fictício ou docs).

6. CONFIGURAÇÃO DE VOZ DO AGENTE
   - Campos:
     - Seleção de perfil de voz:
       - “Voz feminina natural brasileira”
       - “Voz masculina natural brasileira”
       - (Opcionalmente) outras variações: neutra, mais séria, mais entusiasmada.
     - Velocidade da fala (slider).
     - Tom/entonação (slider simples: calmo ↔ energético).
   - Comportamento:
     - Salvar essas preferências na tabela `user_settings`:
       - `voiceGender` (female / male / neutral)
       - `voiceStyle` (casual, formal)
       - `voiceRate`
       - `voicePitch`
     - Toda vez que o back-end chamar o modelo TTS, deve:
       - Incluir as preferências do usuário no prompt/configuração do TTS.
   - UI:
     - Preview de voz:
       - Botão “Ouvir exemplo”.
       - O back-end chama TTS com uma frase de amostra (“Oi, eu sou o seu Jarvis, ajustado com essas configurações de voz.”).

7. INTEGRAÇÕES COM GOOGLE KEEP, AGENDA, NOTÍCIAS E GMAIL
   - Seção: **“Integrações Google”**.
   - Após o login com Google, o usuário pode:
     - Autorizar escopos adicionais:
       - Keep/Tasks (listas).
       - Calendar (compromissos).
       - Gmail (leitura/resumo de e-mails importantes, opcional).
       - News (pode ser integrado via APIs externas, mas use o login para personalização).
   - Requisitos:
     - Back-end deve ter um módulo `googleIntegrationsService` que:
       - Armazena tokens de acesso/refresh por usuário.
       - Implementa funções:
         - `syncShoppingListToKeep()`
         - `createCalendarEvent(...)`
         - `getTodayEvents(...)`
         - `getImportantEmails(...)`
     - O assistente deve ser capaz de:
       - Perguntar consentimento antes de ações sensíveis:
         - “Posso acessar seu calendário para conferir sua manhã de amanhã?”
         - “Quer que eu crie uma nota no Keep com essa lista?”
   - UI:
     - Mostrar quais integrações estão ativas (toggle ON/OFF).
     - Mostrar último sync ou status (“Agenda sincronizada hoje às 18:32”).

8. MEMÓRIA DO AGENTE POR USUÁRIO
   - O sistema deve manter uma camada de **memória por usuário**, baseada em:
     - Perfil (nome, ocupação, idade).
     - Preferências de voz.
     - Integrações ativas.
     - Hábitos (por exemplo, horário em que costuma chegar em casa).
   - Técnicamente:
     - Tabela `agent_memories`:
       - `userId`
       - `key` (tipo de memória, ex: “daily_routine”, “shopping_preferences”)
       - `value` (JSON)
       - `updatedAt`
     - O modelo Gemini (texto/planejamento) deve:
       - Ter acesso a um resumo dessas memórias no início de cada sessão.
       - Atualizar e sugerir atualizações conforme interações (“percebi que você sempre compra café… tenho isso salvo aqui.”).

9. EXPERIÊNCIA DE ONBOARDING (PRIMEIRO USO)
   - No primeiro login:
     - Levar o usuário para um fluxo guiado:
       1. Boas-vindas do Jarvis (voz + texto).
       2. Formulário curto de perfil (nome, apelido, o que faz, idade).
       3. Escolha de voz (feminina/masculina).
       4. Pergunta:
          - “Você quer usar sua própria chave Gemini ou prefere usar o meu serviço de voz pronto?”
       5. Se escolher própria chave:
          - Mostrar tutorial para criação da chave no AI Studio.
       6. Se escolher serviço do Jarvis:
          - Mostrar plano free trial ou plano pago (mock/real, conforme implementação).
   - Após onboarding:
     - O usuário é levado para a tela principal com o núcleo do assistente.
     - O assistente já chama o usuário pelo apelido e ajusta o tom ao perfil.

[IMPACTO NA ARQUITETURA]

Ao gerar o código:

- Front-end:
  - Criar páginas/rotas ou modais:
    - `SettingsPage` ou `<SettingsDrawer />`
    - Componentes:
      - `ProfileForm`
      - `ApiKeySection`
      - `VoiceSettings`
      - `IntegrationsSettings`
      - `BillingSection`
  - Estado global deve guardar:
    - `currentUser`
    - `userProfile`
    - `userSettings` (voz, idioma, etc.)
    - `integrationStatus`
    - `billingStatus`

- Back-end:
  - Endpoints REST/GraphQL, por exemplo:
    - `POST /auth/google`
    - `GET /me`
    - `PUT /me/profile`
    - `PUT /me/settings`
    - `PUT /me/api-key`
    - `POST /me/api-key/test`
    - `GET /me/integrations`
    - `POST /me/integrations/connect/:service`
    - `GET /me/billing`
    - `POST /me/billing/subscribe`
  - Camada de serviço:
    - `UserService`, `SettingsService`, `BillingService`, `IntegrationsService`.

O modelo (você) deve sempre considerar essas configurações ao:
- Decidir qual chave usar (do usuário ou da plataforma).
- Decidir qual voz, estilo e idioma usar ao responder.
- Decidir se pode criar eventos, notas, ou acessar e-mails/notícias para aquele usuário.

