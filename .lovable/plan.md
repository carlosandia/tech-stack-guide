
## Diagnostico Completo - 3 Problemas Criticos

Apos investigacao profunda, identifiquei **3 problemas** que precisam de correcao:

### Problema 1: Envio de mensagens nao chega ao WhatsApp

O metodo `enviarTexto` em `conversas.api.ts` apenas insere a mensagem no banco de dados local. **Nao chama a API do WAHA** para efetivamente enviar a mensagem pelo WhatsApp. A mensagem aparece no CRM mas nao sai para o destinatario.

**Correcao:** Alterar `enviarTexto` e `enviarMedia` para chamar a Edge Function `waha-proxy` com uma nova action `enviar_mensagem` que faz o POST real para a API do WAHA. Apos o envio com sucesso, salvar a mensagem no banco com o `message_id` retornado pelo WAHA e `ack: 1` (PENDING).

### Problema 2: Ticks de status (ACK) nao funcionam

O webhook esta configurado para receber apenas o evento `"message"`. Nao recebe `"message.ack"` nem `"message.any"`, entao os status de entrega (enviado, entregue, lido) nunca sao atualizados.

**Correcao em 2 partes:**
1. Alterar `waha-proxy` para registrar os eventos `["message", "message.ack"]` (ou `"message.any"`) na configuracao do webhook durante o `iniciar`.
2. Alterar `waha-webhook` para processar o evento `message.ack`, atualizando os campos `ack` e `ack_name` na tabela `mensagens`.

### Problema 3: Mensagens de grupo WhatsApp nao sao suportadas

O webhook atual ignora mensagens de grupo. Quando o `from` contem `@g.us` (grupos), o sistema tenta tratar como conversa individual e falha. Alem disso:
- Nao identifica que e um grupo
- Nao salva o `participant` (quem enviou dentro do grupo)
- Nao exibe a separacao por remetente na janela de conversa
- Nao mostra badge de grupo na lista

---

## Plano de Implementacao

### Etapa 1 - Nova action `enviar_mensagem` no waha-proxy

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

Adicionar um novo `case "enviar_mensagem"` no switch de actions que:
1. Recebe `chat_id`, `text`, `reply_to` (opcional) no body
2. Faz POST para `${baseUrl}/api/sendText` da API WAHA com `chatId` e `text`
3. Retorna o `message_id` do WAHA para o frontend

### Etapa 2 - Conectar frontend ao envio real via WAHA

**Arquivo:** `src/modules/conversas/services/conversas.api.ts`

Alterar `enviarTexto`:
1. Buscar `chat_id` e `sessao_whatsapp_id` da conversa
2. Chamar `supabase.functions.invoke('waha-proxy', { body: { action: 'enviar_mensagem', chat_id, text } })`
3. Com o `message_id` retornado, salvar a mensagem no banco com `ack: 1`
4. Se a conversa nao tem sessao WhatsApp (ex: Instagram), manter comportamento atual (apenas local)

Alterar `enviarMedia` de forma similar para midia.

### Etapa 3 - Suporte a ACK (ticks de status)

**Arquivo:** `supabase/functions/waha-proxy/index.ts`
- Alterar os `events` de `["message"]` para `["message", "message.ack"]` em todos os locais do `iniciar` (3 ocorrencias)

**Arquivo:** `supabase/functions/waha-webhook/index.ts`
- Adicionar handler para `body.event === "message.ack"`:
  1. Extrair `ack` e `ackName` do payload
  2. Extrair `message_id` do payload (via `id._serialized` ou `id`)
  3. Fazer UPDATE na tabela `mensagens` setando `ack` e `ack_name`
  4. O Supabase Realtime ja propagara a mudanca para o frontend automaticamente

### Etapa 4 - Suporte a mensagens de grupo

**Arquivo:** `supabase/functions/waha-webhook/index.ts`

Adicionar deteccao de grupo:
1. Se `rawFrom` contem `@g.us`, tratar como grupo:
   - `chat_id` = `rawFrom` (ID do grupo, ex: `120363xxx@g.us`)
   - `participant` = `payload.participant` (quem enviou, ex: `5511999@c.us`)
   - `tipo` da conversa = `"grupo"`
   - `nome` = nome do grupo (via `payload._data.subject` ou fallback para chat_id)
   - Buscar foto do grupo via WAHA API
   - Contato vinculado: usar o participant (quem enviou), nao o grupo
2. Salvar `participant` na mensagem para identificar quem enviou dentro do grupo

**Arquivo:** `src/modules/conversas/components/ChatMessages.tsx`

Para conversas de grupo, exibir o nome/foto do remetente acima de cada mensagem quando o remetente muda:
1. Receber `tipo` da conversa como prop
2. Se `tipo === 'grupo'` e `!msg.from_me`, mostrar o nome do participant acima da bolha
3. Usar cores diferentes por participant

**Arquivo:** `src/modules/conversas/components/ChatMessageBubble.tsx`

Adicionar props opcionais para nome e foto do participant em grupo:
1. `participantName?: string`
2. `participantColor?: string`
3. Renderizar nome do remetente acima do conteudo da mensagem (apenas em grupos, mensagens recebidas)

**Arquivo:** `src/modules/conversas/components/ConversaItem.tsx`

Ja tem suporte ao badge de grupo via `getTipoBadge()`. Nenhuma mudanca necessaria.

### Etapa 5 - Reconectar sessao para aplicar novos eventos

Apos o deploy, sera necessario reconectar a sessao WhatsApp (desconectar e conectar novamente) para que os novos eventos (`message.ack`) sejam registrados no webhook do WAHA.

---

## Detalhes Tecnicos

### Fluxo de envio corrigido:

```text
Usuario clica "Enviar"
    |
    v
conversas.api.ts (enviarTexto)
    |
    +---> Chama waha-proxy (action: enviar_mensagem)
    |         |
    |         +---> POST /api/sendText no WAHA
    |         +---> Retorna message_id
    |
    +---> Salva mensagem no banco (ack=1, message_id do WAHA)
    |
    v
Realtime atualiza o frontend
```

### Fluxo de ACK corrigido:

```text
WhatsApp entrega/le mensagem
    |
    v
WAHA envia evento "message.ack"
    |
    v
waha-webhook processa ACK
    |
    +---> UPDATE mensagens SET ack=X WHERE message_id=Y
    |
    v
Realtime propaga -> ticks atualizam no frontend
```

### Fluxo de grupo:

```text
Mensagem em grupo WhatsApp
    |
    v
waha-webhook detecta @g.us
    |
    +---> Tipo = "grupo"
    +---> Busca/cria contato pelo PARTICIPANT (nao pelo grupo)
    +---> Busca/cria conversa com chat_id do grupo
    +---> Salva mensagem com campo "participant" preenchido
    |
    v
Frontend exibe com nome do remetente (em grupos)
```

### Arquivos a serem alterados:

1. `supabase/functions/waha-proxy/index.ts` - Nova action `enviar_mensagem` + eventos ACK
2. `supabase/functions/waha-webhook/index.ts` - Handler ACK + suporte a grupos
3. `src/modules/conversas/services/conversas.api.ts` - `enviarTexto` e `enviarMedia` via WAHA
4. `src/modules/conversas/components/ChatMessages.tsx` - Exibir nome do remetente em grupos
5. `src/modules/conversas/components/ChatMessageBubble.tsx` - Nome do participant em grupos
6. `src/modules/conversas/components/ChatWindow.tsx` - Passar tipo da conversa para ChatMessages

### Observacoes importantes:

- A tabela `contatos` NAO tem coluna `foto_url`. A foto fica armazenada apenas na coluna `foto_url` da tabela `conversas`. Isso ja funciona corretamente.
- A tabela `mensagens` ja tem o campo `participant` (varchar), pronto para uso com grupos.
- A tabela `conversas` ja tem o campo `tipo` com suporte a `'grupo'`.
- O `ConversaItem` ja tem o badge de grupo implementado.
- O `useConversasRealtime` ja escuta INSERT em mensagens e UPDATE em conversas, entao os ticks de ACK serao propagados automaticamente se fizermos UPDATE na mensagem.
