

## Implementacao: Emoji Picker, Acoes no WhatsApp e Menu de Conversa

---

### Escopo e Viabilidade (WAHA NOWEB Engine)

Antes de detalhar, aqui esta a compatibilidade real com o engine NOWEB do WAHA:

| Funcionalidade | WAHA NOWEB Suporte | CRM Local | Sincronizado? |
|---|---|---|---|
| Emoji Picker (enviar emoji no texto) | Sim (texto normal) | Sim | Sim |
| Apagar mensagem | Sim (`DELETE /api/{session}/chats/{chatId}/messages/{messageId}`) | Sim | Sim |
| Limpar conversa (apagar todas msgs) | Sim (`DELETE /api/{session}/chats/{chatId}/messages`) | Sim | Sim |
| Apagar conversa | Sim (`DELETE /api/{session}/chats/{chatId}`) | Sim | Sim |
| Arquivar conversa | Sim (`POST /api/{session}/chats/{chatId}/archive`) | Sim | Sim |
| Fixar conversa | Nao (sem endpoint WAHA) | Sim | Apenas CRM |
| Marcar como nao lido | Sim (`POST /api/{session}/chats/{chatId}/unread`) | Sim | Sim |
| Silenciar notificacoes | Nao (sem endpoint WAHA para NOWEB) | Sim | Apenas CRM |
| Mensagens temporarias | Nao (sem endpoint WAHA para NOWEB) | Nao | Nao |
| Selecionar mensagens | N/A (funcionalidade de UI) | Sim | N/A |

---

### 1. Emoji Picker Completo

**Componente:** `src/modules/conversas/components/EmojiPicker.tsx`

Criar um picker de emojis estilo WhatsApp Web com:
- Categorias por abas (icones no topo): Smileys, Pessoas, Animais, Comida, Viagens, Atividades, Objetos, Simbolos, Bandeiras
- Barra de busca "Pesquisar emoji"
- Grid de emojis nativos do sistema (sem biblioteca externa pesada)
- Emojis recentes (salvos no localStorage)
- Popover posicionado acima do botao de emoji

**Integracao no ChatInput:**
- Adicionar botao de emoji (Smile icon) ao lado do textarea
- Ao clicar num emoji, inserir no cursor atual do textarea
- Nao necessita envio especial - emoji e texto normal

**Dados dos emojis:** Mapa estatic com ~500 emojis mais usados organizados por categoria (inline no componente, sem dependencia externa).

---

### 2. Menu de Acoes na Conversa (Header do Chat)

**Arquivo:** `src/modules/conversas/components/ChatHeader.tsx`

Expandir o menu dropdown (tres pontinhos) para incluir:

| Acao | Endpoint WAHA | Comportamento |
|---|---|---|
| Selecionar mensagens | N/A | Ativa modo de selecao na UI |
| Silenciar notificacoes | Sem API WAHA | Toggle local no CRM (campo `silenciada` na tabela) |
| Mensagens temporarias | Sem API WAHA | Mostrar toast "Funcionalidade nao disponivel com engine NOWEB" |
| Limpar conversa | `DELETE /api/{session}/chats/{chatId}/messages` | Apaga no WA + soft delete local |
| Apagar conversa | `DELETE /api/{session}/chats/{chatId}` | Apaga no WA + soft delete local |

**Confirmacao:** Limpar e Apagar conversa exigem dialog de confirmacao com texto explicativo.

---

### 3. Menu de Contexto na Lista de Conversas (Sidebar)

**Arquivo:** `src/modules/conversas/components/ConversaItem.tsx`

Ao clicar na seta (chevron) que aparece no hover de cada item da lista, abrir um popover/dropdown com:

| Acao | Endpoint WAHA | Comportamento |
|---|---|---|
| Arquivar conversa | `POST /api/{session}/chats/{chatId}/archive` | Arquiva no WA + soft delete local |
| Fixar conversa | Sem API WAHA | Toggle de campo `fixada` no CRM (ordena no topo) |
| Marcar como nao lido | `POST /api/{session}/chats/{chatId}/unread` | Marca no WA + incrementa badge local |
| Apagar conversa | `DELETE /api/{session}/chats/{chatId}` | Apaga no WA + soft delete local |

**Interacao:** Botao chevron-down aparece no hover sobre o item, clicando abre o popover. Nao muda o comportamento do click no item (que abre a conversa).

---

### 4. Apagar Mensagem Individual

**Arquivo:** `src/modules/conversas/components/ChatMessageBubble.tsx`

Ao hover/long-press numa bolha de mensagem enviada (from_me=true), mostrar botao com dropdown:
- "Apagar para mim" - soft delete local
- "Apagar para todos" - `DELETE /api/{session}/chats/{chatId}/messages/{messageId}` + soft delete local

Para mensagens recebidas (from_me=false):
- Apenas "Apagar para mim" (soft delete local)

---

### 5. Alteracoes no Banco de Dados

Adicionar colunas na tabela `conversas`:

```sql
ALTER TABLE conversas ADD COLUMN IF NOT EXISTS fixada boolean DEFAULT false;
ALTER TABLE conversas ADD COLUMN IF NOT EXISTS silenciada boolean DEFAULT false;
ALTER TABLE conversas ADD COLUMN IF NOT EXISTS arquivada boolean DEFAULT false;
```

---

### 6. Novas Actions no waha-proxy

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

Adicionar cases no switch de actions:

| Action | Endpoint WAHA | Metodo |
|---|---|---|
| `apagar_mensagem` | `/api/{session}/chats/{chatId}/messages/{messageId}` | DELETE |
| `limpar_conversa` | `/api/{session}/chats/{chatId}/messages` | DELETE |
| `apagar_conversa` | `/api/{session}/chats/{chatId}` | DELETE |
| `arquivar_conversa` | `/api/{session}/chats/{chatId}/archive` | POST |
| `marcar_nao_lida` | `/api/{session}/chats/{chatId}/unread` | POST |

---

### 7. Service Layer (conversas.api.ts)

Adicionar metodos:

- `apagarMensagem(conversaId, messageId, paraTodos)` - chama waha-proxy se paraTodos + soft delete
- `limparConversa(conversaId)` - chama waha-proxy + soft delete todas mensagens
- `apagarConversa(conversaId)` - chama waha-proxy + soft delete conversa
- `arquivarConversa(conversaId)` - chama waha-proxy + marca como arquivada
- `fixarConversa(conversaId)` - toggle fixada (sem WAHA)
- `marcarNaoLida(conversaId)` - chama waha-proxy + incrementa badge
- `silenciarConversa(conversaId)` - toggle silenciada (sem WAHA)

---

## Resumo de Arquivos

### Novos arquivos:
1. `src/modules/conversas/components/EmojiPicker.tsx` - Componente picker de emojis com categorias, busca e recentes

### Arquivos editados:
2. `src/modules/conversas/components/ChatInput.tsx` - Adicionar botao emoji + integracao EmojiPicker
3. `src/modules/conversas/components/ChatHeader.tsx` - Expandir menu com selecionar, silenciar, temporarias, limpar, apagar
4. `src/modules/conversas/components/ConversaItem.tsx` - Adicionar botao chevron + popover com arquivar, fixar, nao lida, apagar
5. `src/modules/conversas/components/ConversasList.tsx` - Passar callbacks de acoes para ConversaItem
6. `src/modules/conversas/components/ChatMessageBubble.tsx` - Menu de apagar mensagem no hover
7. `src/modules/conversas/components/ChatWindow.tsx` - Conectar handlers de selecao, limpar, apagar
8. `src/modules/conversas/pages/ConversasPage.tsx` - Conectar handlers de arquivar, fixar, nao lida, apagar
9. `src/modules/conversas/services/conversas.api.ts` - Novos metodos de acao
10. `src/modules/conversas/hooks/useConversas.ts` - Novos hooks de mutacao
11. `supabase/functions/waha-proxy/index.ts` - Novas actions (apagar_mensagem, limpar, arquivar, etc.)

### Migracao SQL:
12. Adicionar colunas `fixada`, `silenciada`, `arquivada` na tabela `conversas`

### Deploy:
- `waha-proxy` (novas actions)

### Dependencias:
- Nenhuma nova (emoji picker sera feito com dados inline, sem biblioteca externa)

---

## Detalhes Tecnicos

### Emoji Picker - Estrutura de dados

Os emojis serao organizados em um mapa estatico por categoria. Exemplo:

```text
const EMOJI_DATA = {
  'Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂', ...],
  'Pessoas': ['👋','🤚','🖐️','✋','🖖', ...],
  'Animais': ['🐶','🐱','🐭','🐹', ...],
  ...
}
```

Isso evita dependencias externas e mantém o bundle leve (~15KB de dados de emoji).

### Fluxo de Apagar Conversa (sincronizado)

```text
Usuario clica "Apagar conversa" no CRM
  |
  v
Dialog de confirmacao ("Apagar conversa no CRM e no WhatsApp?")
  |
  v [Confirmar]
  |
  ├── 1. waha-proxy action="apagar_conversa" 
  │   └── DELETE /api/{session}/chats/{chatId}
  │
  ├── 2. Supabase: UPDATE conversas SET deletado_em = now()
  │
  └── 3. Invalidar queries, remover da lista
```

### Fluxo de Apagar Mensagem (para todos)

```text
Usuario clica "Apagar para todos" na bolha
  |
  v
  ├── 1. waha-proxy action="apagar_mensagem"
  │   └── DELETE /api/{session}/chats/{chatId}/messages/{messageId}
  │
  ├── 2. Supabase: UPDATE mensagens SET deletado_em = now()
  │
  └── 3. Invalidar queries
```

### Ordenacao com Fixadas

Na listagem de conversas, aplicar ordenacao:
1. Fixadas primeiro (fixada = true)
2. Dentro de cada grupo, por ultima_mensagem_em DESC

