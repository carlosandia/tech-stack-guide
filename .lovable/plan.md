

# Correcao dos Ticks de Status (ACK) - Mensagens Enviadas pelo Dispositivo

## Problema Identificado

Quando o usuario envia varias mensagens rapidas pelo dispositivo (WhatsApp no celular), os ticks de status (enviado/entregue/lido) nao atualizam corretamente no CRM, apesar de aparecerem corretos no WhatsApp Web.

## Causa Raiz (Race Condition)

Dois problemas foram identificados no webhook `waha-webhook`:

### Problema 1: ACK nao e extraido do payload `message.any`

Quando uma mensagem chega via evento `message.any`, o WAHA envia o `ack` atual no payload (ex: `ack=1` para PENDING). Porem, o `messageInsert` **nunca inclui o campo `ack`**, fazendo a mensagem ser salva com `ack=0` (default da coluna). Isso significa que mesmo mensagens ja entregues comecam com tick zerado.

### Problema 2: Race condition entre `message.any` e `message.ack`

Quando varias mensagens sao enviadas em sequencia rapida:

```text
Tempo  -->
msg1: message.any -----> message.ack(2) --> message.ack(3) --> message.ack(4)
msg2: message.any -----> message.ack(2) -----> message.ack(3)
msg3:                    message.ack(2) --> message.any --> message.ack(3)
                         ^^ ACK chega ANTES da mensagem existir no banco!
```

- O `message.ack` tenta atualizar uma mensagem que **ainda nao existe** no banco
- O fallback por `ilike` tambem falha pois a mensagem nao foi inserida
- Quando o `message.any` finalmente insere a mensagem, ela fica com `ack=0`
- O `message.ack` ja foi processado (e descartado) -- o ACK e **perdido permanentemente**

## Solucao

### Arquivo 1: `supabase/functions/waha-webhook/index.ts`

**Mudanca A** - Extrair `ack` do payload no `message.any` (ao montar `messageInsert`):

Apos montar o `messageInsert` (linha ~2401), adicionar a extracao do ACK que vem no proprio payload da mensagem:

```typescript
// Extrair ACK do payload da mensagem (WAHA envia ack atual junto com message.any)
const payloadAck = payload.ack ?? payload._data?.ack;
if (payloadAck !== undefined && payloadAck !== null && typeof payloadAck === 'number') {
  messageInsert.ack = payloadAck;
  const ackNameMap: Record<number, string> = { 0: 'ERROR', 1: 'PENDING', 2: 'SENT', 3: 'DELIVERED', 4: 'READ', 5: 'PLAYED' };
  messageInsert.ack_name = ackNameMap[payloadAck] || null;
}
```

**Mudanca B** - Implementar retry no `message.ack` quando mensagem nao existe:

No bloco de processamento do `message.ack` (linhas ~165-248), quando nenhum match e encontrado (nem exato, nem fallback), adicionar uma espera curta e retentar **uma vez**. Isso cobre a race condition sem sobrecarregar:

```typescript
// Apos ambas as buscas (exata + ilike) falharem:
if (!matched && !ilikeMatched) {
  // Retry apos 2 segundos (race condition: message.any pode estar sendo processado)
  console.log(`[waha-webhook] ACK: no match yet for ${messageId}, retrying in 2s...`);
  await new Promise(r => setTimeout(r, 2000));
  
  // Re-tentar busca exata
  const { data: retryMatch } = await supabaseAdmin
    .from("mensagens")
    .select("id, ack")
    .eq("message_id", messageId)
    .eq("organizacao_id", sessao.organizacao_id);
  
  if (retryMatch && retryMatch.length > 0) {
    const currentAck = retryMatch[0].ack ?? 0;
    if (ack > currentAck) {
      await supabaseAdmin
        .from("mensagens")
        .update(ackUpdate)
        .eq("id", retryMatch[0].id);
      console.log(`[waha-webhook] ACK retry success: ${messageId}, ack=${currentAck}->${ack}`);
    }
  } else {
    // Retry fallback ilike
    const shortId = messageId.includes('_') ? messageId.split('_').pop() : null;
    if (shortId) {
      const { data: retryIlike } = await supabaseAdmin
        .from("mensagens")
        .select("id, ack")
        .ilike("message_id", `%_${shortId}`)
        .eq("organizacao_id", sessao.organizacao_id);
      
      if (retryIlike && retryIlike.length > 0) {
        const currentAck = retryIlike[0].ack ?? 0;
        if (ack > currentAck) {
          await supabaseAdmin
            .from("mensagens")
            .update(ackUpdate)
            .eq("id", retryIlike[0].id);
          console.log(`[waha-webhook] ACK retry fallback success: ${shortId}, ack=${currentAck}->${ack}`);
        }
      } else {
        console.warn(`[waha-webhook] ACK lost after retry: ${messageId}`);
      }
    }
  }
}
```

### Arquivo 2: Sem alteracao necessaria no frontend

O `useAckRealtime` ja escuta `UPDATE` na tabela mensagens filtrado por `conversa_id`. Uma vez que o ACK e salvo corretamente no banco (via as correcoes acima), o Realtime do Supabase vai propagar o update para o cache do React Query e os ticks atualizarao automaticamente.

## Resumo das Mudancas

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `supabase/functions/waha-webhook/index.ts` | Modificar | Extrair `ack` do payload no insert + retry no message.ack |

## Impacto

- Mensagens inseridas ja terao o ACK correto desde o inicio (ack=1 ao inves de ack=0)
- ACKs que chegam antes da mensagem existir serao recuperados com retry de 2s
- Nenhuma mudanca no frontend necessaria -- Realtime ja propaga os updates

