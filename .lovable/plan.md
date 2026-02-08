

# Plano: Modulo de Conversas (PRD-09) - Frontend Completo

## Visao Geral

Implementar o frontend do modulo de Conversas como uma interface de chat estilo WhatsApp Web, acessivel em `/app/conversas`. O modulo se conecta ao backend Express existente via API REST (`api.ts` com Axios) e usa Supabase Realtime para atualizacoes em tempo real. A UX deve ser familiar para usuarios de WhatsApp, com split-view (lista a esquerda + chat a direita).

## Arquitetura

O modulo de Conversas e diferente dos demais (Contatos, Negocios, Tarefas) pois comunica com o **backend Express** (nao acesso direto ao Supabase), utilizando o cliente Axios configurado em `src/lib/api.ts`. Isso porque as operacoes de envio de mensagem dependem de integracao com WAHA/Instagram que roda no backend.

```text
Frontend (React) --> api.ts (Axios) --> Backend Express --> Supabase + WAHA
                                                       --> Instagram API
```

Para atualizacoes em tempo real, usaremos **Supabase Realtime** para escutar inserts na tabela `mensagens` e updates na tabela `conversas`.

## Estrutura de Arquivos

```text
src/modules/conversas/
  index.ts                              -- Barrel export
  pages/
    ConversasPage.tsx                   -- Pagina principal (split-view)
  components/
    ConversasList.tsx                   -- Painel esquerdo: lista de conversas
    ConversaItem.tsx                    -- Item individual na lista
    ConversaEmpty.tsx                   -- Estado vazio (nenhuma conversa selecionada)
    ChatWindow.tsx                      -- Painel direito: janela de chat
    ChatHeader.tsx                      -- Header da conversa (foto, nome, acoes)
    ChatMessages.tsx                    -- Area de mensagens com scroll
    ChatMessageBubble.tsx              -- Bolha individual de mensagem
    ChatInput.tsx                       -- Barra de entrada (textarea + acoes)
    ContatoDrawer.tsx                   -- Drawer lateral com info do contato
    NovaConversaModal.tsx              -- Modal para iniciar nova conversa
    FiltrosConversas.tsx               -- Filtros (canal, status, busca)
    MensagensProntasPopover.tsx        -- Popover de quick replies (/)
    NotaPrivadaInput.tsx               -- Aba de nota privada no input
  hooks/
    useConversas.ts                     -- TanStack Query hooks para conversas
    useMensagens.ts                     -- TanStack Query hooks para mensagens
    useMensagensProntas.ts             -- Hook para quick replies
    useConversasRealtime.ts            -- Hook para Supabase Realtime
  services/
    conversas.api.ts                    -- Chamadas API REST via Axios
```

## Secao Tecnica

### 1. Service Layer (`conversas.api.ts`)

Todas as chamadas passam pelo `api` (Axios) configurado em `src/lib/api.ts`:

```text
conversasApi = {
  // Conversas
  listar(filtros) --> GET /v1/conversas?canal=...&status=...&busca=...&page=...
  buscarPorId(id) --> GET /v1/conversas/:id
  criar(dados) --> POST /v1/conversas
  alterarStatus(id, status) --> PATCH /v1/conversas/:id/status
  marcarComoLida(id) --> POST /v1/conversas/:id/marcar-lida

  // Mensagens
  listarMensagens(conversaId, filtros) --> GET /v1/conversas/:id/mensagens
  enviarTexto(conversaId, texto, replyTo?) --> POST /v1/conversas/:id/mensagens/texto
  enviarMedia(conversaId, dados) --> POST /v1/conversas/:id/mensagens/media
  enviarLocalizacao(conversaId, dados) --> POST /v1/conversas/:id/mensagens/localizacao
  enviarContato(conversaId, vcard) --> POST /v1/conversas/:id/mensagens/contato
  enviarEnquete(conversaId, dados) --> POST /v1/conversas/:id/mensagens/enquete

  // Mensagens Prontas
  listarProntas(filtros?) --> GET /v1/mensagens-prontas
  criarPronta(dados) --> POST /v1/mensagens-prontas
  atualizarPronta(id, dados) --> PATCH /v1/mensagens-prontas/:id
  excluirPronta(id) --> DELETE /v1/mensagens-prontas/:id

  // Notas do Contato
  listarNotas(contatoId) --> GET /v1/contatos/:contatoId/notas
  criarNota(contatoId, dados) --> POST /v1/contatos/:contatoId/notas
}
```

### 2. Hooks TanStack Query

```text
useConversas(filtros)          --> queryKey: ['conversas', filtros]
useConversa(id)                --> queryKey: ['conversa', id]
useMensagens(conversaId)       --> queryKey: ['mensagens', conversaId], infinite query (scroll up)
useEnviarTexto()               --> mutation, invalida ['mensagens'] e ['conversas']
useEnviarMedia()               --> mutation
useMensagensProntas()          --> queryKey: ['mensagens-prontas']
useNotasContato(contatoId)     --> queryKey: ['notas-contato', contatoId]
```

### 3. Supabase Realtime (`useConversasRealtime.ts`)

```text
Hook que escuta:
1. INSERT na tabela "mensagens" filtrado por organizacao_id
   --> Quando nova mensagem chega, invalida ['mensagens', conversaId]
   --> Invalida ['conversas'] para atualizar preview/contadores

2. UPDATE na tabela "conversas" filtrado por organizacao_id
   --> Atualiza status, contadores de nao-lidas
```

### 4. Pagina Principal (`ConversasPage.tsx`)

Layout split-view com 3 partes, sem toolbar do AppLayout (a pagina ocupa toda a area de conteudo):

```text
+------------------------------------------+------------------------------------------+
| PAINEL ESQUERDO (320px fixo no desktop)  | PAINEL DIREITO (flex-1)                  |
|                                          |                                          |
| [+ Nova Conversa]                        | ChatHeader (foto, nome, acoes)           |
| [Buscar conversas...]                    | ChatMessages (scroll infinito)           |
| [Filtros: Canal | Status]                | ChatInput (textarea + acoes)             |
|                                          |                                          |
| ConversaItem 1                           | -- OU --                                 |
| ConversaItem 2                           |                                          |
| ConversaItem 3                           | ConversaEmpty (estado sem selecao)       |
| ...                                      |                                          |
+------------------------------------------+------------------------------------------+
```

**Responsividade:**
- Desktop (>=1024px): Split-view com painel fixo 320px + chat flex
- Tablet (768-1023px): Split-view com painel 280px
- Mobile (<768px): Apenas lista visivel. Ao selecionar conversa, chat ocupa tela inteira com botao voltar

**Estados gerenciados:**
- `conversaAtiva: string | null` -- ID da conversa selecionada
- `filtros: { canal, status, busca }` -- Filtros da lista
- `drawerAberto: boolean` -- Drawer de info do contato
- `novaConversaAberta: boolean` -- Modal de nova conversa

O componente limpa a toolbar via `useAppToolbar` pois tem sua propria interface.

### 5. Lista de Conversas (`ConversasList.tsx` + `ConversaItem.tsx`)

**ConversaItem exibe:**
- Avatar do contato (foto ou inicial do nome em circulo colorido)
- Nome do contato
- Preview da ultima mensagem (truncado 50 chars) com icones por tipo:
  - Texto: texto puro
  - Imagem: "[icone Camera] Foto"
  - Video: "[icone Video] Video"
  - Audio: "[icone Mic] Audio 0:32"
  - Documento: "[icone File] nome_arquivo.pdf"
  - Localizacao: "[icone MapPin] Localizacao"
  - Contato: "[icone User] Nome"
  - Enquete: "[icone BarChart] Pergunta..."
  - Sticker: "[icone Smile] Sticker"
- Badge de canal: WhatsApp (icone verde) ou Instagram (icone gradiente roxo/rosa)
- Horario relativo (Agora, 5 min, 14:30, Ontem, 25/01) usando date-fns
- Badge de status colorido (Aberta=verde, Pendente=amarelo, Fechada=cinza)
- Indicador de nao lidas (badge numerico azul)
- Nome em negrito se nao lida

**Scroll infinito:** Paginacao de 20 itens, carrega mais ao rolar para baixo.

**Ordenacao:** Ultima mensagem DESC (mais recente primeiro).

### 6. Filtros (`FiltrosConversas.tsx`)

Barra compacta acima da lista:
- **Busca:** Input com icone de lupa e debounce 300ms
- **Canal:** Tabs compactas (Todas | WhatsApp | Instagram)
- **Status:** Dropdown ou tabs (Todas | Abertas | Pendentes | Fechadas)

### 7. Janela de Chat (`ChatWindow.tsx`)

Composicao de 3 partes: Header + Messages + Input

**ChatHeader:**
- Avatar + Nome do contato (clicavel para abrir drawer)
- Subtitulo "Clique para info. do contato"
- Acoes na direita: Buscar [Search], Nova Oportunidade [Plus], Menu [...] (alterar status)

**ChatMessages:**
- Bolhas de mensagem alinhadas:
  - Enviadas (from_me=true): direita, fundo `bg-primary/10` com borda `border-primary/20`
  - Recebidas (from_me=false): esquerda, fundo `bg-muted`
- Ticks de status por ACK:
  - 1 (PENDING): 1 check cinza
  - 2 (SENT): 2 checks cinza
  - 3 (DELIVERED): 2 checks cinza
  - 4 (READ): 2 checks azuis
  - 5 (PLAYED): 2 checks azuis + icone play
- Horario formatado em cada bolha
- Separadores de data ("Hoje", "Ontem", "15/01/2026")
- Scroll infinito para cima (mensagens mais antigas)
- Auto-scroll para baixo ao abrir ou receber nova mensagem

**ChatMessageBubble:** Renderiza por tipo:
- `text`: Texto com suporte a formatacao (*negrito*, _italico_)
- `image`: Thumbnail clicavel (lightbox)
- `video`: Player inline com controles
- `audio`: Player customizado com waveform e duracao
- `document`: Card com icone do tipo + nome + tamanho + botao download
- `location`: Preview estilizado com nome/endereco + link para Google Maps
- `contact`: Card com dados do vCard
- `poll`: Enquete com opcoes e votos
- `reaction`: Emoji sobre mensagem referenciada
- `sticker`: Imagem de sticker (tamanho fixo 150x150)

**ChatInput:**
- Tabs: [Responder] [Nota Privada]
- Na aba Responder:
  - Icones: Emoji (futuro), Raio (mensagens prontas), Clip (anexos), Mic (gravacao)
  - Textarea auto-expansivel (max 6 linhas)
  - Shift+Enter = nova linha, Enter = enviar
  - Botao Enviar (icone Send) aparece quando tem texto
  - Icone de Mic aparece quando textarea vazio (para gravacao de audio)
- Na aba Nota Privada:
  - Fundo amarelo claro (`bg-yellow-50`)
  - Aviso "Esta nota e interna e nao sera enviada ao contato"
  - Textarea + botao "Salvar Nota"
  - Salva via API de notas do contato

### 8. Drawer Lateral (`ContatoDrawer.tsx`)

Desliza da direita ao clicar no header do chat:
- Foto grande do contato (80x80px)
- Nome, email, telefone, empresa
- Botoes de acao: Nova mensagem, Nova tarefa, Nova oportunidade
- Secao expansivel: Notas do Contato (lista + adicionar)
- Secao expansivel: Mensagens Prontas (lista + adicionar)
- Secao expansivel: Informacoes da Conversa (status, canal, total, datas)

### 9. Nova Conversa (`NovaConversaModal.tsx`)

Modal usando ModalBase:
- Campo de telefone com mascara brasileira (+55)
- OU busca de contato existente (debounce 300ms)
- Textarea para mensagem inicial (obrigatorio)
- Botoes: Cancelar + Iniciar Conversa
- Ao criar, seleciona a conversa e abre o chat

### 10. Mensagens Prontas (`MensagensProntasPopover.tsx`)

Acionado de 2 formas:
1. Digitar "/" no textarea
2. Clicar no icone de raio

Popover com:
- Busca com debounce 200ms
- Secao "Minhas Mensagens" (pessoais)
- Secao "Mensagens da Equipe" (globais)
- Click insere conteudo no textarea
- Botao [+ Nova mensagem pronta] abre sub-modal de criacao

### 11. Roteamento

Adicionar rota `/app/conversas` no `App.tsx` (dentro do bloco `<Route path="/app">`):

```text
<Route path="conversas" element={<ConversasPage />} />
```

O menu "Conversas" ja existe no `AppLayout.tsx`.

### 12. Barrel Export (`index.ts`)

```text
export { default as ConversasPage } from './pages/ConversasPage'
```

## Design System - Conformidade

O modulo segue rigorosamente o `docs/designsystem.md`:

- **Layout:** Split-view sem toolbar adicional (o chat e full-height)
- **Tipografia:** Inter, `text-sm` para mensagens, `text-xs` para horarios e badges
- **Espacamento:** Base 8px, `gap-3` entre bolhas, `p-3` em itens da lista
- **Border Radius:** `rounded-lg` para bolhas de mensagem, `rounded-full` para avatares e badges, `rounded-md` para inputs
- **Glass Effect:** Header do chat e painel esquerdo com `bg-white/80 backdrop-blur-md`
- **Cores semanticas:**
  - WhatsApp: `#25D366` (verde oficial)
  - Instagram: gradiente `from-purple-500 to-pink-500`
  - Bolha enviada: `bg-primary/10`
  - Bolha recebida: `bg-muted`
  - Status Aberta: `bg-green-100 text-green-700`
  - Status Pendente: `bg-yellow-100 text-yellow-700`
  - Status Fechada: `bg-gray-100 text-gray-500`
- **Transicoes:** `transition-all duration-200`
- **Z-index:** Drawer z-300, modal z-400/401 (padrao ModalBase)
- **Responsividade:** Mobile-first, split-view colapsa para tela unica no mobile

## Diferencial UX (estilo WhatsApp Web)

Para o usuario se sentir a vontade:
- Background sutil com padrao de fundo na area de mensagens (similar ao WhatsApp)
- Bolhas com "cauda" (triangle pointer) na lateral
- Avatar circular com fallback de iniciais coloridas
- Preview de imagens/videos inline
- Player de audio customizado com barra de progresso
- Indicador "digitando..." (futuro, via Realtime)
- Animacao suave ao receber nova mensagem (slide-in)
- Som de notificacao ao receber mensagem (configuravel, futuro)

## Sequencia de Implementacao

1. `conversas.api.ts` -- Service layer com todas chamadas Axios
2. `useConversas.ts` + `useMensagens.ts` + `useMensagensProntas.ts` -- Hooks TanStack Query
3. `useConversasRealtime.ts` -- Hook Supabase Realtime
4. `ConversaItem.tsx` + `ConversasList.tsx` -- Lista de conversas
5. `FiltrosConversas.tsx` -- Filtros da lista
6. `ChatMessageBubble.tsx` -- Bolha de mensagem (todos os tipos)
7. `ChatMessages.tsx` -- Area de mensagens com scroll
8. `ChatInput.tsx` + `NotaPrivadaInput.tsx` -- Barra de entrada
9. `MensagensProntasPopover.tsx` -- Quick replies
10. `ChatHeader.tsx` -- Header do chat
11. `ChatWindow.tsx` -- Composicao do chat
12. `ConversaEmpty.tsx` -- Estado vazio
13. `ContatoDrawer.tsx` -- Drawer de info do contato
14. `NovaConversaModal.tsx` -- Modal de nova conversa
15. `ConversasPage.tsx` -- Pagina principal (composicao)
16. `index.ts` -- Barrel export
17. `App.tsx` -- Registro da rota

## Escopo MVP (primeira entrega)

Para manter a entrega focada e funcional:
- Lista de conversas com filtros
- Chat com envio/recebimento de texto
- Renderizacao basica de todos tipos de mensagem
- Mensagens prontas (listar e usar)
- Notas privadas (criar)
- Status de atendimento (alterar)
- Drawer com info do contato
- Nova conversa (via WhatsApp)
- Realtime para novas mensagens

**Nao incluido no MVP** (sera implementado em fases futuras):
- Gravacao de audio nativo (RF-009)
- Agendamento de mensagens (RF-011)
- Upload de arquivos/fotos via drag-and-drop (RF-006 parcial)
- Enquetes (RF-007 parcial, apenas visualizacao)

