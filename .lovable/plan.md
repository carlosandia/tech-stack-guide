

## Plano: Suporte a Canal WhatsApp, Enquete, Audio, Contato, Camera e Documento com Icones Coloridos

---

## Resumo

Este plano cobre 2 grandes areas:
1. **Suporte a Canal do WhatsApp** (`@newsletter`) no webhook e frontend
2. **Ativacao completa do menu Anexar**: Enquete, Audio, Camera, Contato e Documento com icones coloridos (estilo WhatsApp Web - imagem de referencia)

---

## Parte 1: Suporte a Canal do WhatsApp (`@newsletter`)

### O que e um Canal WhatsApp?
Canais do WhatsApp usam IDs com `@newsletter` (ex: `29847512@newsletter`). Sao broadcasts unidirecionais do administrador. Mensagens recebidas de canais devem ser salvas como `tipo = 'canal'` na tabela `conversas`.

### Alteracoes

**Arquivo: `supabase/functions/waha-webhook/index.ts`**
- Adicionar deteccao de `@newsletter` no campo `rawFrom`
- Se detectado, setar `conversaTipo = "canal"` (em vez de `"grupo"` ou `"individual"`)
- Tratar similar a grupo: `chatId` = ID do canal, `participant` = quem enviou
- Buscar metadados do canal (nome, foto) via WAHA API se disponivel
- Salvar na conversa com `tipo: "canal"`

**Arquivo: `src/modules/conversas/components/ConversaItem.tsx`**
- Ja possui `getTipoBadge('canal')` retornando badge roxo - sem mudanca necessaria

**Arquivo: `src/modules/conversas/components/ChatMessages.tsx`**
- Tratar `conversaTipo === 'canal'` de forma similar a grupo (mostrar nomes de participantes)

---

## Parte 2: Menu Anexar Completo com Icones Coloridos

### 2.1 Redesign Visual do Menu (icones coloridos)

**Arquivo: `src/modules/conversas/components/AnexosMenu.tsx`**

Cada opcao tera um icone com cor distinta, seguindo a referencia do WhatsApp Web:

| Opcao | Cor do Icone | Acao |
|-------|-------------|------|
| Documento | Roxo (#7C3AED) | Seletor de arquivo |
| Fotos e Videos | Azul (#2563EB) | Seletor de midia |
| Camera | Vermelho/Coral (#EF4444) | Captura via navegador |
| Audio | Laranja (#F97316) | Gravacao de audio |
| Contato | Azul Escuro (#1D4ED8) | Busca de contatos do CRM |
| Enquete | Verde (#16A34A) | Modal de criacao |

Remover o estado `disabled` de Camera, Audio, Contato e Enquete. Adicionar callbacks especificos para cada um.

### 2.2 Gravacao de Audio

**Componente novo: `src/modules/conversas/components/AudioRecorder.tsx`**
- Usa `MediaRecorder API` com codec WebM/Opus (32kbps) - mesmo padrao ja usado no modulo de anotacoes
- UI: barra de gravacao inline substituindo o input de texto temporariamente
- Botoes: Cancelar (lixeira) | Tempo decorrido | Enviar (check)
- Ao finalizar: upload para bucket `chat-media` no Supabase Storage, depois envio via `waha-proxy` (action `enviar_media` com `media_type: "audio"`)

**Arquivo: `src/modules/conversas/components/ChatInput.tsx`**
- Integrar `AudioRecorder` - quando clicado no menu ou no botao Mic (ja existente), mostrar a barra de gravacao
- O botao Mic que ja existe na barra inferior passara a ativar a gravacao diretamente (sem menu)

### 2.3 Camera (Foto/Video via Navegador)

**Componente novo: `src/modules/conversas/components/CameraCapture.tsx`**
- Usa `navigator.mediaDevices.getUserMedia` para acessar a camera
- Modal fullscreen com preview da camera
- Botao para capturar foto (Canvas API para snapshot)
- Apos captura: preview + opcao de enviar ou descartar
- Upload para `chat-media` e envio via `enviarMedia`

### 2.4 Envio de Contato (vCard)

**Componente novo: `src/modules/conversas/components/ContatoSelectorModal.tsx`**
- Modal de busca de contatos do CRM (usa `conversasApi.buscarContatos`)
- Ao selecionar, gerar vCard simples com nome/telefone/email
- Enviar via `waha-proxy` com nova action `enviar_contato` que usa `POST /api/sendContactVcard` da WAHA API

**Arquivo: `supabase/functions/waha-proxy/index.ts`**
- Nova action `enviar_contato`:
  - Recebe `chat_id`, `vcard` (string vCard), `name` (nome do contato)
  - POST para `${baseUrl}/api/sendContactVcard` com `{ chatId, session, contacts: [{ fullName, vcard }] }`
  - Retorna `message_id`

**Arquivo: `src/modules/conversas/services/conversas.api.ts`**
- Novo metodo `enviarContato(conversaId, contatoData)` que:
  1. Chama `waha-proxy` action `enviar_contato`
  2. Salva mensagem local com `tipo: 'contact'`, `vcard` preenchido

### 2.5 Enquete

**Componente novo: `src/modules/conversas/components/EnqueteModal.tsx`**
- Modal conforme PRD-09:
  - Campo "Pergunta" (obrigatorio)
  - Lista de opcoes (minimo 2, maximo 12)
  - Botao "+ Adicionar opcao"
  - Checkbox "Permitir multiplas respostas"
  - Botoes "Cancelar" e "Enviar Enquete"
- Validacao: minimo 2 opcoes preenchidas

**Arquivo: `supabase/functions/waha-proxy/index.ts`**
- Nova action `enviar_enquete`:
  - Recebe `chat_id`, `poll_name`, `poll_options`, `poll_allow_multiple`
  - POST para `${baseUrl}/api/sendPoll` com `{ chatId, session, poll: { name, options, multipleAnswers } }`
  - Retorna `message_id`

**Arquivo: `src/modules/conversas/services/conversas.api.ts`**
- Novo metodo `enviarEnquete(conversaId, enqueteData)` que:
  1. Chama `waha-proxy` action `enviar_enquete`
  2. Salva mensagem local com `tipo: 'poll'`, `poll_question`, `poll_options`, `poll_allow_multiple`

### 2.6 Integracao no ChatWindow e ChatInput

**Arquivo: `src/modules/conversas/components/AnexosMenu.tsx`**
- Interface atualizada: `onFileSelected`, `onAudioRecord`, `onCamera`, `onContato`, `onEnquete`
- Cada opcao chama o callback correspondente

**Arquivo: `src/modules/conversas/components/ChatInput.tsx`**
- Receber novos callbacks: `onStartAudioRecord`, `onOpenCamera`, `onOpenContato`, `onOpenEnquete`
- Passar para `AnexosMenu`
- Botao Mic existente (quando sem texto): ativar gravacao diretamente

**Arquivo: `src/modules/conversas/components/ChatWindow.tsx`**
- Gerenciar estados: `audioRecording`, `cameraOpen`, `contatoModalOpen`, `enqueteModalOpen`
- Handlers para cada tipo de envio especializado
- Renderizar modais/componentes condicionais

### 2.7 Hooks adicionais

**Arquivo: `src/modules/conversas/hooks/useMensagens.ts`**
- Adicionar `useEnviarContato` e `useEnviarEnquete` mutations

---

## Parte 3: Storage

O bucket `chat-media` **nao existe** ainda no Supabase Storage. Sera necessario cria-lo via migracao SQL:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true);
```

Tambem sera necessario adicionar politica RLS para upload autenticado.

---

## Sequencia de Implementacao

1. **Migracao SQL**: Criar bucket `chat-media` com RLS
2. **Edge Functions**: Adicionar actions `enviar_contato` e `enviar_enquete` no `waha-proxy`, e suporte a `@newsletter` no `waha-webhook`
3. **Componentes novos**: `AudioRecorder`, `CameraCapture`, `ContatoSelectorModal`, `EnqueteModal`
4. **Refatorar AnexosMenu**: Icones coloridos, remover disabled, novos callbacks
5. **Atualizar ChatInput/ChatWindow**: Integrar todos os novos componentes
6. **API service**: Novos metodos `enviarContato` e `enviarEnquete`
7. **Deploy e teste**: Deploy das edge functions e teste end-to-end

---

## Arquivos a serem criados

- `src/modules/conversas/components/AudioRecorder.tsx`
- `src/modules/conversas/components/CameraCapture.tsx`
- `src/modules/conversas/components/ContatoSelectorModal.tsx`
- `src/modules/conversas/components/EnqueteModal.tsx`

## Arquivos a serem editados

- `supabase/functions/waha-proxy/index.ts` (2 novas actions)
- `supabase/functions/waha-webhook/index.ts` (suporte `@newsletter`)
- `src/modules/conversas/components/AnexosMenu.tsx` (redesign completo)
- `src/modules/conversas/components/ChatInput.tsx` (novos callbacks + audio inline)
- `src/modules/conversas/components/ChatWindow.tsx` (estados e handlers)
- `src/modules/conversas/components/ChatMessages.tsx` (tratar tipo `canal`)
- `src/modules/conversas/services/conversas.api.ts` (novos metodos)
- `src/modules/conversas/hooks/useMensagens.ts` (novas mutations)

