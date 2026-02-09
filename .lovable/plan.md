

# Plano: Correcoes e Funcionalidades do Menu de Acoes de Mensagem

## Problema 1: Popover cortado pela janela de conversa

O menu de acoes (`MessageActionMenu`) usa `position: absolute` dentro de um container com `overflow-y: auto` (a area de mensagens `ChatMessages`), o que faz o dropdown ser cortado pelas bordas do container.

**Solucao:** Renderizar o dropdown via `createPortal` no `document.body` com `position: fixed`, calculando a posicao com base no botao clicado (usando `getBoundingClientRect()`). Mesmo padrao ja aplicado com sucesso no `FiltrosConversas.tsx`.

---

## Problema 2: Funcionalidade Fixar Mensagem

**API WAHA disponivel:**
- `POST /api/{session}/chats/{chatId}/messages/{messageId}/pin` com body `{"duration": 86400}` (NOWEB suportado)
- `POST /api/{session}/chats/{chatId}/messages/{messageId}/unpin` (NOWEB suportado)

**Implementacao:**
- Nova action `fixar_mensagem` no `waha-proxy` chamando o endpoint de pin
- Novo metodo `fixarMensagem()` no `conversas.api.ts`
- Novo hook `useFixarMensagem()` no `useConversas.ts`
- Conectar o botao "Fixar" no `MessageActionMenu` ao handler real
- Propagar callbacks de `ChatWindow` -> `ChatMessages` -> `ChatMessageBubble`

---

## Problema 3: Funcionalidade Reagir

**API WAHA disponivel:**
- `POST /api/reaction` com body `{"chatId": "...", "session": "...", "messageId": "...", "reaction": "emoji"}` (NOWEB suportado)

**Implementacao:**
- Nova action `reagir_mensagem` no `waha-proxy`
- Novo metodo `reagirMensagem()` no `conversas.api.ts`
- Novo hook `useReagirMensagem()` no `useConversas.ts`
- Ao clicar em "Reagir", abrir um mini picker de emojis rapidos (6 emojis mais usados + botao para abrir EmojiPicker completo), posicionado via Portal junto ao menu
- A reacao selecionada e enviada ao WhatsApp via WAHA e salva localmente como mensagem tipo `reaction`

---

## Problema 4: Funcionalidade Encaminhar

**API WAHA disponivel:**
- `POST /api/forwardMessage` com body `{"chatId": "destino", "session": "...", "messageId": "..."}` (NOWEB suportado)

**Implementacao:**
- Nova action `encaminhar_mensagem` no `waha-proxy`
- Novo metodo `encaminharMensagem()` no `conversas.api.ts`
- Novo hook `useEncaminharMensagem()` no `useConversas.ts`
- Novo componente `EncaminharModal.tsx` - modal com busca de contatos/conversas existentes do CRM (usando `conversasApi.buscarContatos()` e lista de conversas ativas)
- O usuario seleciona o destino e a mensagem e encaminhada via WAHA
- A lista de destinos sera baseada nos contatos salvos no CRM (tabela `contatos`) - abordagem mais confiavel e consistente

---

## Problema 5: Copiar qualquer tipo de conteudo + CTRL+V no textarea

**Copiar:**
- Texto: copia texto para clipboard (ja funciona)
- Imagem/Video: copia a URL da midia para clipboard (para colar em outra conversa ou app)
- Audio: copia URL do audio
- Documento: copia URL do documento
- Contato: copia vCard

**CTRL+V no textarea:**
- Adicionar handler `onPaste` no textarea do `ChatInput.tsx`
- Detectar tipo de conteudo colado:
  - Se for texto, inserir normalmente (ja funciona nativamente)
  - Se for arquivo/imagem (via `clipboardData.files`), tratar como anexo, chamando `onFileSelected` com o arquivo colado

---

## Detalhes Tecnicos

### Arquivos a criar:
1. `src/modules/conversas/components/EncaminharModal.tsx` - Modal de selecao de destino para encaminhamento

### Arquivos a modificar:
1. **`supabase/functions/waha-proxy/index.ts`** - 3 novas actions: `fixar_mensagem`, `reagir_mensagem`, `encaminhar_mensagem`
2. **`src/modules/conversas/services/conversas.api.ts`** - 3 novos metodos: `fixarMensagem`, `reagirMensagem`, `encaminharMensagem`
3. **`src/modules/conversas/hooks/useConversas.ts`** - 3 novos hooks de mutacao
4. **`src/modules/conversas/components/ChatMessageBubble.tsx`** - Portal no menu, handler de fixar/reagir/encaminhar/copiar universal, mini emoji picker para reacoes
5. **`src/modules/conversas/components/ChatMessages.tsx`** - Propagar novos callbacks
6. **`src/modules/conversas/components/ChatWindow.tsx`** - Conectar novos hooks e gerenciar estado do modal de encaminhar
7. **`src/modules/conversas/components/ChatInput.tsx`** - Handler `onPaste` para CTRL+V de arquivos/imagens

### Sequencia de implementacao:
1. Portal do menu (correcao visual)
2. CTRL+V no textarea
3. Copiar universal (todos os tipos de midia)
4. Fixar mensagem (waha-proxy + API + UI)
5. Reagir (waha-proxy + API + UI com mini picker)
6. Encaminhar (waha-proxy + API + Modal + UI)
7. Deploy do waha-proxy atualizado

