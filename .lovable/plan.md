
## Correcao: Conversas Duplicadas, Midia Recebida e Enquete

---

### Diagnostico Confirmado por Dados Reais

| # | Problema | Causa Raiz (confirmada) | Evidencia |
|---|---------|--------------------------|-----------|
| 1 | Conversas duplicadas ao reconectar | WAHA envia `from: 162826672971943@lid` (Linked ID) em vez de `5513988506995@c.us`. O webhook nao reconhece `@lid`, cria contato E conversa novos. | DB: 2 conversas para "Carlos Andia" - uma com `chat_id: 5513988506995@c.us`, outra com `162826672971943@lid`. 2 contatos tambem. |
| 2 | Audio/foto/video recebidos nao aparecem | `payload.type` chega como `null` para mensagens recebidas via `message.any`. O webhook salva `tipo: "text"` mesmo com `has_media: true` e `media_url` preenchida. O frontend so renderiza midia se `tipo` for "image"/"video"/"audio". | DB: mensagens com `tipo=text`, `has_media=true`, `media_mimetype=video/mp4` |
| 3 | Enquete nao retorna votos | Engine NOWEB do WAHA nao consegue descriptografar votos (`selectedOptions: []`). O botao "Mostrar votos" nao encontra endpoint funcional. | Logs: `poll.vote.failed` com `selectedOptions: []`. Docs WAHA confirmam: "pollUpdates - encrypted votes (not decrypted yet)" para NOWEB. |

---

## Correcao 1: Resolver `@lid` para Numero Real (Dedup Conversa + Contato)

**Arquivo:** `supabase/functions/waha-webhook/index.ts`

**Descoberta chave**: O raw_data da mensagem ja contem o numero real em `_data.key.remoteJidAlt`:

```text
payload._data.key = {
  "remoteJid": "162826672971943@lid",
  "remoteJidAlt": "5513988506995@s.whatsapp.net",  ← NUMERO REAL
  "addressingMode": "lid"
}
```

### Logica de correcao:

Na secao de INDIVIDUAL MESSAGE (linhas 417-434), ANTES de definir `chatId` e `phoneNumber`:

1. Detectar se `rawFrom` contem `@lid`
2. Se sim, buscar `payload._data?.key?.remoteJidAlt` para obter o JID real
3. Converter `@s.whatsapp.net` para `@c.us` (formato padrao)
4. Usar o numero real como `chatId` e `phoneNumber`

```text
// Resolver @lid para @c.us usando remoteJidAlt
let resolvedFrom = rawFrom;
if (rawFrom.includes("@lid")) {
  const altJid = payload._data?.key?.remoteJidAlt;
  if (altJid) {
    resolvedFrom = altJid.replace("@s.whatsapp.net", "@c.us");
    console.log(`[waha-webhook] Resolved @lid: ${rawFrom} -> ${resolvedFrom}`);
  }
}
```

Tambem aplicar para `isFromMe` quando `toField` contiver `@lid`:
- Verificar `payload._data?.key?.remoteJidAlt` ou `payload.to` para o formato correto

Para mensagens `fromMe` com `@lid`, tambem verificar `payload._data?.to` e `payload.to` para resolver o destino.

Isso garante que mensagens de `@lid` usem a mesma conversa e contato que `@c.us`.

### Tambem aplicar em:
- Busca de contato por telefone (step 1): ja usa `phoneNumber` resolvido
- Busca de conversa por `chat_id` (step 2): ja usa `chatId` resolvido
- Nenhum codigo adicional necessario apos resolver no inicio

---

## Correcao 2: Detectar Tipo de Midia pelo Mimetype

**Arquivo:** `supabase/functions/waha-webhook/index.ts` (apos linha 602)

O `payload.type` chega como `undefined` para mensagens do `message.any`, entao `wahaType` fica como `"text"`. Mas o `media.mimetype` tem o tipo correto.

### Logica de correcao:

Apos definir `wahaType`, adicionar deteccao por mimetype:

```text
// Se tipo e "text" mas tem midia, inferir tipo pelo mimetype
if (wahaType === "text" && payload.hasMedia && payload.media?.mimetype) {
  const mime = payload.media.mimetype.toLowerCase();
  if (mime.startsWith("image/")) wahaType = "image";
  else if (mime.startsWith("video/")) wahaType = "video";
  else if (mime.startsWith("audio/")) {
    // Verificar se e PTT (voice note)
    wahaType = payload.media?.ptt ? "ptt" : "audio";
  }
  else wahaType = "document";
  console.log(`[waha-webhook] Media type inferred from mimetype: ${wahaType}`);
}
```

Isso garante que audio, foto e video recebidos sejam salvos com o tipo correto e renderizados adequadamente no frontend.

### Tambem corrigir mensagens historicas:

Executar um UPDATE no banco para corrigir mensagens ja salvas incorretamente:
```sql
-- Corrigir mensagens com tipo errado
UPDATE mensagens SET tipo = 'image' WHERE tipo = 'text' AND has_media = true AND media_mimetype LIKE 'image/%';
UPDATE mensagens SET tipo = 'video' WHERE tipo = 'text' AND has_media = true AND media_mimetype LIKE 'video/%';
UPDATE mensagens SET tipo = 'audio' WHERE tipo = 'text' AND has_media = true AND media_mimetype LIKE 'audio/%';
```

---

## Correcao 3: Enquete - Usar WAHA Lids API + Mensagem Informativa

**Arquivos:** `supabase/functions/waha-proxy/index.ts` + `src/modules/conversas/components/ChatMessageBubble.tsx`

### Problema fundamental:
O engine NOWEB nao descriptografa votos de enquetes. Isso e uma limitacao documentada do WAHA. O evento `poll.vote.failed` chega com `selectedOptions: []`.

### Acoes:

**3a. Melhorar o endpoint `consultar_votos_enquete`** no waha-proxy:
- Tentar `GET /api/{session}/chats/{chatId}/messages/{messageId}` para buscar a mensagem atualizada
- Se o WAHA retornar `_data.pollUpdates`, tentar extrair dados (mesmo que criptografados)
- Retornar um campo `engine_limitation: true` quando os votos nao puderem ser obtidos

**3b. Atualizar o botao "Mostrar votos"** no ChatMessageBubble:
- Quando receber `engine_limitation: true`, mostrar toast informativo: "Votos de enquete nao disponiveis com engine NOWEB. Verifique diretamente no WhatsApp."
- Manter o botao funcional para tentativas futuras (caso o WAHA atualize)

---

## Resumo de Arquivos

### Arquivos editados:
1. `supabase/functions/waha-webhook/index.ts` - Resolver @lid para @c.us usando remoteJidAlt + inferir tipo de midia pelo mimetype
2. `supabase/functions/waha-proxy/index.ts` - Melhorar endpoint de consulta de votos com mensagem de limitacao
3. `src/modules/conversas/components/ChatMessageBubble.tsx` - Mostrar mensagem informativa sobre limitacao de votos

### SQL a executar:
- UPDATE para corrigir mensagens historicas com tipo errado

### Deploy necessario:
- `waha-webhook`
- `waha-proxy`

### Detalhes Tecnicos

**Fluxo @lid corrigido:**

```text
Mensagem chega: from="162826672971943@lid"
  |
  v
Detecta @lid → busca _data.key.remoteJidAlt
  |
  v
Encontra: "5513988506995@s.whatsapp.net"
  |
  v
Converte para: "5513988506995@c.us"
  |
  v
chatId = "5513988506995@c.us" → ENCONTRA conversa existente
phoneNumber = "5513988506995" → ENCONTRA contato existente
  |
  v
Usa mesma conversa e contato (sem duplicacao)
```

**Fluxo midia corrigido:**

```text
Mensagem chega: type=undefined, hasMedia=true, media.mimetype="video/mp4"
  |
  v
wahaType = "text" (default) → detecta hasMedia + mimetype
  |
  v
wahaType = "video" (inferido de "video/mp4")
  |
  v
Salva com tipo="video" → Frontend renderiza VideoContent corretamente
```
