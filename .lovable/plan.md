

# Sistema de Etiquetas WhatsApp (Labels) - Sincronizacao Bidirecional

## Resumo

Implementar sincronizacao em tempo real das etiquetas (labels) do WhatsApp com o CRM, permitindo visualizar e gerenciar etiquetas diretamente na interface de conversas. Qualquer alteracao feita no WhatsApp reflete automaticamente no CRM via webhooks.

## Arquitetura

O sistema sera composto por:
1. **Tabelas no Supabase** para armazenar etiquetas e vinculos com conversas
2. **Webhook handler** no `waha-webhook` para processar eventos `label.*`
3. **Proxy actions** no `waha-proxy` para operacoes CRUD via API WAHA
4. **Frontend** com exibicao sutil de etiquetas na lista e no header do chat
5. **Realtime** via Supabase Realtime (ja configurado no `useConversasRealtime`)

---

## 1. Schema do Banco de Dados

### Tabela `whatsapp_labels`
Armazena as etiquetas sincronizadas do WhatsApp por organizacao.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | ID interno |
| organizacao_id | uuid (FK) | Tenant |
| waha_label_id | text | ID da etiqueta no WAHA (ex: "1", "10") |
| nome | text | Nome da etiqueta |
| cor_hex | text | Cor em hex (ex: "#64c4ff") |
| cor_codigo | integer | Codigo interno da cor (0-19) |
| criado_em | timestamptz | |
| atualizado_em | timestamptz | |

- Unique constraint: `(organizacao_id, waha_label_id)`
- RLS: tenant isolation via `get_user_tenant_id()`

### Tabela `conversas_labels`
Tabela de vinculacao N:N entre conversas e etiquetas.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | ID interno |
| organizacao_id | uuid (FK) | Tenant |
| conversa_id | uuid (FK) | Conversa vinculada |
| label_id | uuid (FK) | Referencia a whatsapp_labels.id |
| criado_em | timestamptz | |

- Unique constraint: `(conversa_id, label_id)`
- RLS: tenant isolation via `get_user_tenant_id()`
- ON DELETE CASCADE para ambas FKs

---

## 2. Edge Function: waha-webhook (modificacao)

Adicionar handlers para 3 novos eventos ANTES do filtro `body.event !== "message"`:

### `label.upsert`
- Recebe `payload.id`, `payload.name`, `payload.color`, `payload.colorHex`
- Busca `sessoes_whatsapp` pelo `sessionName` para obter `organizacao_id`
- Faz UPSERT em `whatsapp_labels` usando `(organizacao_id, waha_label_id)`

### `label.chat.added`
- Recebe `payload.labelId` e `payload.chatId`
- Busca a conversa pelo `chat_id` e `organizacao_id`
- Busca a label pelo `waha_label_id` e `organizacao_id`
- Insere em `conversas_labels` (ignora conflito se ja existe)

### `label.chat.deleted`
- Recebe `payload.labelId` e `payload.chatId`
- Remove o registro de `conversas_labels` correspondente

---

## 3. Edge Function: waha-proxy (modificacao)

Adicionar novas actions para gerenciar etiquetas via API WAHA:

### `labels_list`
- GET `/api/{session}/labels` - Lista todas etiquetas
- Sincroniza automaticamente com tabela `whatsapp_labels` (upsert em lote)

### `labels_get_chat`
- GET `/api/{session}/labels/chats/{chatId}/` - Etiquetas de um chat
- Retorna array de labels vinculadas

### `labels_set_chat`
- PUT `/api/{session}/labels/chats/{chatId}/` - Aplica etiquetas ao chat
- Recebe array de `labelIds` no body
- Atualiza `conversas_labels` no banco apos sucesso

---

## 4. Edge Function: waha-proxy - Webhook Events

Atualizar o array `webhookEvents` para incluir os novos eventos de label:
```
const webhookEvents = ["message.any", "message.ack", "poll.vote", "poll.vote.failed", "label.upsert", "label.chat.added", "label.chat.deleted"];
```

---

## 5. Frontend - Service Layer

### `conversas.api.ts`
- Novo tipo `WhatsAppLabel`: `{ id, waha_label_id, nome, cor_hex }`
- Novo tipo `ConversaLabel`: `{ id, label: WhatsAppLabel }`
- Funcao `listarLabels()`: query `whatsapp_labels` da organizacao
- Funcao `listarLabelsConversa(conversaId)`: query `conversas_labels` com join em `whatsapp_labels`
- Funcao `sincronizarLabels()`: chama waha-proxy action `labels_list`
- Funcao `aplicarLabelsConversa(conversaId, labelIds)`: chama waha-proxy action `labels_set_chat`

---

## 6. Frontend - Hooks

### `useWhatsAppLabels.ts`
- `useLabels()` - React Query para listar todas labels da org
- `useLabelsConversa(conversaId)` - Labels de uma conversa especifica
- `useSincronizarLabels()` - Mutation para sincronizar labels via WAHA
- `useAplicarLabels()` - Mutation para aplicar labels a um chat

---

## 7. Frontend - Componentes UI

### `LabelBadge.tsx`
Componente minimalista para exibir uma etiqueta:
- Pill com borda colorida (cor_hex) e texto pequeno (text-[10px])
- Fundo sutil usando a cor com opacidade baixa
- Conforme design system: `rounded-full`, `px-1.5 py-0.5`

### Modificacao: `ConversaItem.tsx`
- Buscar labels da conversa via join (incluir no select da query de listagem)
- Exibir ate 2-3 labels logo apos o nome, na mesma linha dos badges de tipo/status
- Se houver mais, mostrar "+N"

### Modificacao: `ChatHeader.tsx`
- Exibir labels abaixo do nome no header (ao lado de "Clique para info do contato")
- Cada label como `LabelBadge` pequeno e clicavel
- Ao clicar, abrir popover para gerenciar labels (adicionar/remover)

### `LabelsPopover.tsx` (novo)
- Popover com lista de todas labels disponiveis
- Checkbox para cada label (marcado = vinculado ao chat)
- Ao alterar, chama `aplicarLabelsConversa` que sincroniza com WAHA
- Botao "Sincronizar" para forcar re-fetch das labels do WhatsApp

---

## 8. Realtime

O hook `useConversasRealtime` ja escuta INSERT/UPDATE em `conversas`. Para as labels:
- Adicionar listener para INSERT/DELETE em `conversas_labels` (filtrado por `organizacao_id`)
- Ao receber evento, invalida queries `['labels-conversa', conversaId]` e `['conversas']`
- Adicionar listener para INSERT/UPDATE em `whatsapp_labels` para invalidar `['whatsapp-labels']`

---

## 9. Query de Listagem de Conversas (otimizacao)

Para evitar N+1 queries, incluir labels diretamente na query de listagem de conversas:
- Na funcao `listarConversas` do `conversas.api.ts`, adicionar select aninhado:
  `conversas_labels(id, whatsapp_labels(id, nome, cor_hex))`
- Adicionar `labels` ao tipo `Conversa`

---

## Ordem de Implementacao

1. Criar tabelas `whatsapp_labels` e `conversas_labels` com RLS
2. Atualizar `waha-webhook` para processar eventos `label.*`
3. Atualizar `waha-proxy` com actions de labels e novos webhook events
4. Criar service functions e hooks no frontend
5. Criar `LabelBadge` e `LabelsPopover`
6. Integrar labels no `ConversaItem` e `ChatHeader`
7. Atualizar `useConversasRealtime` para escutar tabelas de labels

