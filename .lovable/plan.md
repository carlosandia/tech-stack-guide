

# Correção: Reações do WhatsApp não chegam ao webhook

## Causa raiz

O array `webhookEvents` no `waha-proxy/index.ts` (linha 144) define quais eventos o WAHA envia para o webhook. O evento `message.reaction` **não está incluído** nessa lista:

```text
Atual:  ["message.any", "message.ack", "poll.vote", "poll.vote.failed", "label.upsert", "label.chat.added", "label.chat.deleted"]

Faltando: "message.reaction"
```

Por isso o WAHA nunca notifica o webhook sobre reações, mesmo o handler estando implementado corretamente no `waha-webhook/index.ts`.

## Correção

Adicionar `"message.reaction"` ao array `webhookEvents` no arquivo `supabase/functions/waha-proxy/index.ts`.

## Ação pós-deploy necessária

Como as sessões já existentes foram criadas **sem** esse evento, será necessário **reiniciar/reconectar a sessão WhatsApp** no painel do CRM para que a nova configuração de webhook (com `message.reaction`) seja aplicada pelo WAHA. Apenas desconectar e reconectar a sessão já basta.

## Detalhes Técnicos

### Arquivo: `supabase/functions/waha-proxy/index.ts`

Linha 144 - adicionar `"message.reaction"` ao array:

```text
ANTES:
const webhookEvents = ["message.any", "message.ack", "poll.vote", "poll.vote.failed", "label.upsert", "label.chat.added", "label.chat.deleted"];

DEPOIS:
const webhookEvents = ["message.any", "message.ack", "message.reaction", "poll.vote", "poll.vote.failed", "label.upsert", "label.chat.added", "label.chat.deleted"];
```

Nenhuma outra alteração é necessária - o handler no `waha-webhook/index.ts` já está completo e funcional.

