
## Correcao: Ticks Azuis (ACK READ), Enquete e Audio

---

### Diagnostico Confirmado por Logs

| # | Problema | Causa Raiz (confirmada nos logs) |
|---|---------|----------------------------------|
| 1 | Ticks azuis (READ) nao funcionam | Eventos READ (ack=3/4) chegam com formato `@lid` (ex: `true_162826672971943@lid_3EB0CAB17B0E252BCF5C85`). O fallback tenta `.eq("message_id", shortId)` mas o banco agora armazena IDs serializados completos (`true_5513988506995@c.us_3EB0CAB17B0E252BCF5C85`). O `.eq` exato nao encontra. |
| 2 | Enquete nao retorna votos | Zero eventos `poll.vote` nos logs. Apesar da reconfiguracao do webhook (`Webhook re-configured`), o WAHA nao esta disparando esse evento. Necessario usar evento `poll.vote` com formato correto ou usar metodo alternativo. |
| 3 | Audio 0:00 no WhatsApp | `audioBitsPerSecond: 32000` (muito baixo) e `recorder.start(100)` (timeslice de 100ms gera centenas de micro-chunks). O blob resultante perde metadata de duracao do container WebM, WAHA nao consegue transcodificar corretamente. |

---

## Correcao 1: ACK com `@lid` - Usar `.ilike` no Fallback

**Arquivo:** `supabase/functions/waha-webhook/index.ts` (linhas 109-124)

**Problema exato (confirmado nos logs):**

```text
Fluxo atual:
1. Mensagem enviada, salva com: message_id = "true_5513988506995@c.us_3EB0CAB"
2. ACK DEVICE chega com from="5513988506995@c.us" -> messageId="true_5513988506995@c.us_3EB0CAB" -> MATCH (ok)
3. ACK READ chega com from="162826672971943@lid" -> messageId="true_162826672971943@lid_3EB0CAB" -> NO MATCH
4. Fallback tenta: .eq("message_id", "3EB0CAB") -> NO MATCH (banco tem valor serializado completo)
```

**Correcao:** No fallback, usar `.ilike("message_id", `%_${shortId}`)` para encontrar qualquer message_id que TERMINE com o key.id curto:

```text
De:
  .eq("message_id", shortId!)

Para:
  .ilike("message_id", `%_${shortId}`)
```

Isso vai encontrar `true_5513988506995@c.us_3EB0CAB` quando procurar por `%_3EB0CAB`.

Tambem precisamos garantir que o ACK mais alto prevaleca (nao sobrescrever READ com DEVICE que chega depois). Adicionar condicao: so atualizar se `ack` for maior que o atual.

---

## Correcao 2: Enquete - Evento `poll.vote` e Formato de Webhook

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

O problema e que mesmo com a reconfiguracao, nenhum `poll.vote` chega. Duas acoes:

### 2a. Atualizar formato do webhook no PATCH

O formato de PATCH na API WAHA pode exigir formato diferente. Vamos garantir que o update leia a resposta e log:

```text
const patchResp = await fetch(...)
const patchData = await patchResp.json().catch(() => null);
console.log(`[waha-proxy] Webhook reconfig result: ${patchResp.status}`, JSON.stringify(patchData));
```

### 2b. Adicionar evento `poll.vote.failed` tambem

Incluir `poll.vote.failed` na lista de eventos para cobrir mais cenarios.

### 2c. Alternativa: Consultar votos via API WAHA

Se o webhook `poll.vote` nao funcionar (limitacao do WAHA Plus ou da versao), adicionar um action `consultar_votos_enquete` no proxy que consulta a API WAHA `GET /api/{session}/polls/{messageId}` e atualiza o banco diretamente. O frontend pode chamar isso periodicamente ou ao visualizar uma enquete.

**Arquivos:** `supabase/functions/waha-proxy/index.ts` + `src/modules/conversas/components/ChatMessageBubble.tsx`

---

## Correcao 3: Audio - Gravacao de Alta Qualidade

**Arquivo:** `src/modules/conversas/components/AudioRecorder.tsx`

### 3a. Remover timeslice do `recorder.start()`

```text
De:
  recorder.start(100)    // 100ms timeslice = centenas de micro-chunks

Para:
  recorder.start()       // Sem timeslice = um unico chunk com metadata completa
```

Isso garante que o blob final tenha o container WebM/OGG completo com metadata de duracao correta.

### 3b. Aumentar bitrate

```text
De:
  audioBitsPerSecond: 32000   // 32kbps - muito baixo

Para:
  audioBitsPerSecond: 128000  // 128kbps - qualidade boa para voz
```

### 3c. Corrigir closure stale de `duration`

O `recorder.onstop` captura `duration` por closure no momento da criacao (sempre 0). Usar `useRef` para a duracao:

```text
const durationRef = useRef(0)

// No timer:
setDuration(prev => {
  const next = prev + 1
  durationRef.current = next
  return next
})

// No onstop:
onSend(blob, durationRef.current)
```

---

## Resumo de Arquivos

### Arquivos editados:
1. `supabase/functions/waha-webhook/index.ts` - ACK fallback com `.ilike` + protecao contra downgrade de ack
2. `supabase/functions/waha-proxy/index.ts` - Log detalhado do webhook reconfig + eventos adicionais + action para consultar votos de enquete
3. `src/modules/conversas/components/AudioRecorder.tsx` - Remover timeslice, aumentar bitrate, corrigir closure de duration
4. `src/modules/conversas/components/ChatMessageBubble.tsx` - Adicionar botao para consultar votos de enquete (se poll.vote webhook nao funcionar)

### Deploy necessario:
- `waha-proxy`
- `waha-webhook`

### Sequencia:
1. waha-webhook (ACK ilike fix)
2. waha-proxy (webhook reconfig melhorado + action consultar votos)
3. AudioRecorder (gravacao corrigida)
4. ChatMessageBubble (enquete votos alternativo)
5. Deploy edge functions

### Detalhes Tecnicos

**ACK corrigido:**

```text
ACK READ chega: messageId="true_162826672971943@lid_3EB0CAB"
  |
  v
Busca exata: .eq("message_id", "true_162826672971943@lid_3EB0CAB") -> nao encontra
  |
  v
Fallback: shortId = "3EB0CAB"
  |
  v
Busca ILIKE: .ilike("message_id", "%_3EB0CAB") -> ENCONTRA "true_5513988506995@c.us_3EB0CAB"
  |
  v
Verifica se ack novo > ack atual (evita downgrade)
  |
  v
UPDATE ack=3 (READ) -> Realtime notifica frontend -> Ticks azuis
```

**Audio corrigido:**

```text
ANTES:
  start(100) -> centenas de micro-chunks -> Blob sem duration metadata -> WAHA nao transcodifica -> 0:00

DEPOIS:
  start() -> chunk unico ao parar -> Blob com metadata completa -> WAHA transcodifica com duracao -> audio funcional
```
