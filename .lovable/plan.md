

## Correcao Pontual: Ticks de Visualizado (ACK) e Enquete (Votos)

---

### Diagnostico Confirmado

| Problema | Causa Raiz (confirmada por dados) |
|---------|----------------------------------|
| Ticks azuis nao aparecem | **Frontend**: O componente `AckIndicator` mapeia `ack=3` como cinza (DELIVERED), mas no WAHA `ack=3` significa READ. O banco ja tem `ack=3, ack_name=READ` correto - o problema e exclusivamente no mapeamento visual do componente. |
| Enquete nao retorna votos | **Dois problemas**: (1) O WAHA envia `poll.vote.failed` em vez de `poll.vote` (confirmado nos logs). O webhook ignora esse evento. (2) O webhook reconfig falha com 404 em PUT/PATCH - o endpoint correto do WAHA e `PUT /api/sessions/{session}/` (com trailing slash) ou `POST /api/sessions/{name}` para update. |

---

### Evidencias dos Logs

**ACK - Backend funciona, frontend nao reflete:**
```text
Banco de dados:
  ack=3, ack_name=READ  (para varias mensagens recentes)

AckIndicator atual:
  ack 2 ou 3 -> CheckCheck CINZA (muted-foreground)  ← ERRADO para ack=3
  ack 4     -> CheckCheck AZUL                       ← nunca atingido pelo WAHA
```

**Enquete - poll.vote.failed chega mas e ignorado:**
```text
[waha-webhook] Ignoring event: poll.vote.failed
[waha-webhook] Event received: {"event":"poll.vote.failed","session":"crm_893fb161"}
```

**Webhook reconfig - 404 em todos os metodos:**
```text
[waha-proxy] Webhook reconfig result: 404 {"message":"Cannot PATCH /api/sessions/crm_893fb161"}
```

---

## Correcao 1: AckIndicator - Mapeamento WAHA Correto

**Arquivo:** `src/modules/conversas/components/ChatMessageBubble.tsx` (linhas 36-57)

O mapeamento WAHA e diferente do que foi assumido:

| ACK | WAHA Significado | Visual Correto |
|-----|-----------------|----------------|
| 0 | ERROR | nenhum icone |
| 1 | PENDING | check simples cinza |
| 2 | DEVICE (entregue ao servidor) | check duplo cinza |
| 3 | READ | check duplo AZUL |
| 4 | READ (alternativo) | check duplo AZUL |
| 5 | PLAYED | check duplo AZUL + play |

Corrigir para:
- `ack === 1` -> Check cinza (pendente)
- `ack === 2` -> CheckCheck cinza (enviado)
- `ack >= 3 && ack <= 4` -> CheckCheck AZUL (lido)
- `ack === 5` -> CheckCheck AZUL + Play (reproduzido)

---

## Correcao 2: Processar `poll.vote.failed` no Webhook

**Arquivo:** `supabase/functions/waha-webhook/index.ts`

O evento `poll.vote.failed` contem dados do voto mesmo quando "falha" (a "falha" geralmente e na descriptografia do poll, mas os dados parciais ainda vem). Adicionar handler:

```text
if (body.event === "poll.vote" || body.event === "poll.vote.failed") {
  // Log completo do payload para debug
  console.log(`[waha-webhook] ${body.event}:`, JSON.stringify(body.payload).substring(0, 1000));
  // Processar votos (mesmo codigo existente)
}
```

Isso permite capturar votos mesmo quando o WAHA reporta como "failed".

---

## Correcao 3: Webhook Reconfig - Endpoint Correto

**Arquivo:** `supabase/functions/waha-proxy/index.ts` (case `status`, linhas 359-390)

O endpoint `PUT /api/sessions/{session}` com corpo `{config: {webhooks: [...]}}` retorna 404. Conforme a documentacao do WAHA, o endpoint correto para atualizar uma sessao e:

```text
PUT /api/sessions/{session}/
```

Com o corpo completo (incluindo `name`):
```json
{
  "name": "crm_893fb161",
  "config": {
    "webhooks": [{ "url": "...", "events": [...] }]
  }
}
```

Se o PUT continuar falhando, usar a alternativa: deletar e recriar a sessao para atualizar os webhooks (so em ultimo caso, pois desconecta temporariamente).

---

## Resumo de Arquivos

### Arquivos editados:
1. `src/modules/conversas/components/ChatMessageBubble.tsx` - AckIndicator: ack=3 -> azul
2. `supabase/functions/waha-webhook/index.ts` - Processar poll.vote.failed
3. `supabase/functions/waha-proxy/index.ts` - Fix endpoint de reconfig webhook

### Deploy necessario:
- `waha-proxy`
- `waha-webhook`

### Sequencia:
1. ChatMessageBubble (fix visual imediato dos ticks)
2. waha-webhook (processar poll.vote.failed)
3. waha-proxy (fix endpoint reconfig)
4. Deploy edge functions

