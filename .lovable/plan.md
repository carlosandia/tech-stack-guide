

## Correção: Presença (online/digitando) não aparece no chat

### Diagnóstico confirmado pelos logs

A reconfiguração de webhooks que implementamos **funcionou** — os logs mostram:
- `presence.update` com status `typing`, `offline`, `paused` chegando ao `waha-webhook`
- Broadcast sendo enviado com sucesso via Supabase Realtime

Porém o frontend **nunca processa** esses eventos. Identifiquei **2 problemas**:

### Problema 1: Mismatch de chatId (@lid vs @c.us)

O WAHA envia o `chatId` no formato `@lid` (ex: `265412537221351@lid`), mas o frontend armazena e compara com o formato `@c.us` (ex: `5541999999999@c.us`).

Na linha 63 do `usePresence.ts`:
```
if (payload?.chatId === chatId)  // NUNCA é true
```

Isso acontece porque o `presence.update` no `waha-webhook` envia o `chatId` diretamente como vem do WAHA, sem fazer a resolução `@lid → @c.us` que é feita para mensagens e labels.

### Problema 2: Mismatch de status (typing vs composing)

O WAHA GOWS envia status como `typing`, `offline`, `paused`. Mas o frontend espera os valores do tipo `PresenceStatus`: `composing`, `unavailable`, `available`, `recording`.

Os logs confirmam:
```
lastKnownPresence: "typing"   → frontend espera "composing"
lastKnownPresence: "offline"  → frontend espera "unavailable"
```

### Sobre a pergunta do status online

No WhatsApp, o status "online" (`available`) só aparece se o contato tiver habilitado a visibilidade do "visto por último/online" nas configurações de privacidade dele. Se o contato desativou, o WAHA retorna `offline` sempre. Porém, o indicador de "digitando" funciona independente dessas configurações — é assim no WhatsApp nativo também.

### Solução

#### 1. `waha-webhook/index.ts` — Resolver @lid no presence.update

No handler de `presence.update`, antes de fazer o broadcast, resolver o `chatId` de `@lid` para o `chat_id` (@c.us) armazenado na conversa. Usar a mesma estratégia já existente no webhook: buscar na tabela `conversas` por `chat_id` exato e, se for @lid, fazer fallback via RPC `resolve_lid_conversa`.

Além disso, incluir o `chat_id` resolvido (@c.us) no payload do broadcast para que o frontend possa fazer a comparação corretamente.

#### 2. `usePresence.ts` — Mapear status do WAHA para PresenceStatus

Adicionar uma função de mapeamento no hook:
```
typing → composing
offline → unavailable
available → available
recording → recording
paused → paused
```

E aplicar esse mapeamento tanto no `presence_get` (linha 53) quanto no listener de broadcast (linha 67).

Também ajustar a comparação de `chatId` no broadcast listener para aceitar tanto o `chatId` original quanto o resolvido.

### Arquivos modificados

- `supabase/functions/waha-webhook/index.ts` — Resolver @lid para @c.us no handler de presence.update antes de broadcastar
- `src/modules/conversas/hooks/usePresence.ts` — Mapear status WAHA para PresenceStatus e aceitar chatId resolvido no broadcast
