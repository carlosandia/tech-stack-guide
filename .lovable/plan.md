

## Correcao Completa: Documento, Audio, Enquete, ACK e Sync de Mensagens

---

### Diagnostico (baseado em logs e banco de dados)

| # | Problema | Causa Raiz Confirmada |
|---|---------|----------------------|
| 1 | Documento nao abre no navegador | ERR_BLOCKED_BY_CLIENT - adblocker bloqueia URLs de storage do Supabase. Precisa de download via JavaScript |
| 2 | Audio 0:00 no WhatsApp | Chrome grava em WebM/Opus, mas o upload forca `contentType: 'audio/ogg'`. O WAHA tenta transcodificar mas a metadata de duracao se perde. Tambem no CRM: Chrome nao reproduz OGG nativo, causando 0:00 no player |
| 3 | Enquete nao atualiza votos | Nenhum evento `poll.vote` nos logs - a sessao WAHA existente foi criada ANTES de adicionarmos `poll.vote` na lista de eventos. O webhook da sessao ativa nao esta subscrito a esse evento |
| 4 | ACK (ticks) nao atualizam | **Confirmado via banco**: mensagens enviadas salvam `message_id` curto (ex: `3EB04067E27C93ECDE4987`), mas os eventos ACK usam formato serializado (ex: `true_162826672971943@lid_3EB04067E27C93ECDE4987`). O `.eq("message_id", messageId)` nunca encontra a mensagem - logs mostram `rows=null` |
| 5 | Mensagens do celular nao sincronizam | Linha 195 do webhook: `if (payload.fromMe === true) return` - ignora TODAS as mensagens enviadas pelo celular |

---

## Correcao 1: Download de Documentos via JavaScript

**Arquivo:** `src/modules/conversas/components/ChatMessageBubble.tsx` (componente `DocumentContent`)

O link atual usa `<a href={url} target="_blank">` que e bloqueado por adblockers. Implementar download via fetch + blob:

- Substituir o `<a>` por um `<button>` com handler `onClick`
- No handler: `fetch(url) -> blob -> URL.createObjectURL -> link.click()`
- Isso contorna o bloqueio do adblocker pois o download e feito via JS, nao via navegacao direta
- Manter fallback: se o fetch falhar, abrir URL diretamente como link

---

## Correcao 2: Audio - Manter Formato Real do Blob

**Arquivo:** `src/modules/conversas/components/ChatWindow.tsx` (handleAudioSend)

**Problema**: O blob e gravado em WebM (unico formato suportado pelo Chrome) mas uploadado com `contentType: 'audio/ogg'`. Isso causa:
- No CRM: Chrome nao reproduz OGG, mostra 0:00
- No WhatsApp: metadata de duracao perdida na transcodificacao

**Correcao**: Usar o `blob.type` real para upload e extensao:

```text
De:
  const path = `...audio_${Date.now()}.ogg`
  upload(path, blob, { contentType: 'audio/ogg' })

Para:
  const isOgg = blob.type.includes('ogg')
  const ext = isOgg ? 'ogg' : 'webm'
  const contentType = isOgg ? 'audio/ogg' : 'audio/webm'
  const path = `...audio_${Date.now()}.${ext}`
  upload(path, blob, { contentType })
```

O WAHA `sendVoice` aceita ambos os formatos e faz a transcodificacao automaticamente para o formato nativo do WhatsApp (OGG/Opus). Dessa forma:
- No CRM: Chrome reproduz WebM nativamente (player funciona)
- No WhatsApp: WAHA transcodifica corretamente com metadata de duracao

---

## Correcao 3: Re-configurar Webhook para Sessoes Existentes

**Arquivo:** `supabase/functions/waha-proxy/index.ts` (case `status`)

O problema e que a sessao foi criada antes de adicionarmos `poll.vote` aos eventos do webhook. Sessoes ja ativas nao recebem a configuracao atualizada automaticamente.

**Correcao**: No case `status`, quando a sessao estiver WORKING, alem de atualizar o banco, tambem reconfigura o webhook com os eventos atualizados via PATCH:

```text
// Dentro do case "status", quando isConnected:
// Re-configurar webhook para garantir eventos atualizados
await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
  body: JSON.stringify({
    config: {
      webhooks: [{ url: webhookUrl, events: webhookEvents }]
    }
  })
});
```

Isso garante que toda vez que o status for verificado (polling do frontend), o webhook e automaticamente atualizado com a lista de eventos mais recente.

---

## Correcao 4: ACK - Corrigir Formato do message_id

**Arquivo:** `supabase/functions/waha-proxy/index.ts` (retorno dos cases `enviar_mensagem`, `enviar_media`, `enviar_contato`)

**Problema confirmado por dados**:
- Mensagens de texto/media/contato salvam `message_id = "3EB04067E27C93ECDE4987"` (key.id curto)
- Enquetes salvam `message_id = "true_5513988506995@c.us_3EB0CE2D5D8EC24CF851DE"` (id._serialized completo)
- Eventos ACK usam formato serializado: `"true_162826672971943@lid_3EB04067E27C93ECDE4987"`
- `.eq("message_id", serialized)` nunca encontra o ID curto -> `rows=null`

**Correcao em 2 partes**:

### 4a. No waha-proxy, construir message_id serializado no retorno

Para cada action de envio (`enviar_mensagem`, `enviar_media`, `enviar_contato`), construir o formato `_serialized` a partir da resposta WAHA:

```text
const key = sendData.key || {};
const messageId = sendData.id?._serialized
  || (key.id && key.remoteJid
    ? `${key.fromMe ? 'true' : 'false'}_${key.remoteJid.replace('@s.whatsapp.net', '@c.us')}_${key.id}`
    : key.id || null);
```

### 4b. No webhook ACK handler, fallback para ID curto

Se a busca exata por `message_id` nao encontrar resultado, extrair o ID curto (ultima parte apos `_`) e tentar novamente:

```text
// Se nao achou com o ID completo, tenta com o ID curto
if (count === 0 && messageId.includes('_')) {
  const shortId = messageId.split('_').pop();
  await supabaseAdmin.from("mensagens")
    .update({ ack, ack_name, atualizado_em })
    .eq("message_id", shortId)
    .eq("organizacao_id", sessao.organizacao_id);
}
```

Isso garante compatibilidade retroativa com mensagens ja salvas no formato curto E corrige novas mensagens para usar o formato completo.

---

## Correcao 5: Sincronizar Mensagens Enviadas pelo Celular

**Arquivo:** `supabase/functions/waha-webhook/index.ts` (linhas 192-201)

**Problema**: Linha 195 faz `if (payload.fromMe === true) return` - ignora completamente mensagens enviadas pelo celular.

**Correcao**: Permitir mensagens `fromMe` mas evitar duplicatas:

```text
// ANTES: ignorava todas fromMe
if (!payload || payload.fromMe === true) {
  return ... "Outgoing ignored"
}

// DEPOIS: permitir fromMe, verificar duplicata antes de inserir
if (!payload) {
  return ... "No payload"
}

const isFromMe = payload.fromMe === true;
```

Antes de inserir a mensagem (STEP 3), verificar se ja existe no banco:

```text
// Verificar duplicata pelo message_id
const { data: existingMsg } = await supabaseAdmin
  .from("mensagens")
  .select("id")
  .eq("message_id", messageId)
  .eq("organizacao_id", sessao.organizacao_id)
  .maybeSingle();

// Tambem verificar pelo ID curto (mensagens enviadas pelo CRM usam formato curto)
let isDuplicate = !!existingMsg;
if (!isDuplicate && messageId.includes('_')) {
  const shortId = messageId.split('_').pop();
  const { data: existingShort } = await supabaseAdmin
    .from("mensagens")
    .select("id")
    .eq("message_id", shortId)
    .eq("organizacao_id", sessao.organizacao_id)
    .maybeSingle();
  isDuplicate = !!existingShort;
}

if (isDuplicate) {
  console.log("[waha-webhook] Duplicate message, skipping insert");
  return ... "Duplicate"
}
```

Para mensagens `fromMe`, ajustar o `messageInsert`:
- `from_me: isFromMe`
- Nao incrementar `mensagens_nao_lidas` (sao mensagens do proprio usuario)
- Extrair midia/caption da mesma forma que mensagens recebidas

Esse fluxo permite:
1. Mensagens enviadas pelo celular aparecem no CRM
2. Mensagens enviadas pelo CRM nao sao duplicadas
3. Contadores de nao-lidas so incrementam para mensagens recebidas

---

## Resumo de Arquivos

### Arquivos editados:
1. `src/modules/conversas/components/ChatMessageBubble.tsx` - Download de documento via JS
2. `src/modules/conversas/components/ChatWindow.tsx` - Upload de audio com MIME type correto
3. `supabase/functions/waha-proxy/index.ts` - message_id serializado nos envios + reconfig webhook no status
4. `supabase/functions/waha-webhook/index.ts` - Permitir fromMe + ACK com fallback ID curto

### Deploy necessario:
- `waha-proxy`
- `waha-webhook`

### Sequencia de implementacao:
1. Webhook (fromMe sync + ACK fix + poll.vote retroativo)
2. Proxy (message_id serializado + webhook reconfig no status)
3. ChatMessageBubble (download documento)
4. ChatWindow (audio MIME correto)
5. Deploy edge functions

### Apos deploy:
- Abrir uma conversa existente para que o polling de `status` reconfigure o webhook com `poll.vote`
- Enviar uma mensagem pelo celular para testar a sincronizacao
- Enviar enquete e votar para testar atualizacao em tempo real
- Enviar audio e verificar reproducao no WhatsApp e no CRM
- Enviar documento e testar download

