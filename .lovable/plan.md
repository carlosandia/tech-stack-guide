
# Correcao: Mensagens com Link Preview sem Body (WAHA GOWS)

## Problema Identificado

Mensagens recebidas com link preview (como a do Mercado Pago) chegam com `body` vazio no CRM, embora o texto esteja visivel no WhatsApp do dispositivo. Isso causa:
- **No chat**: "Mensagem indisponivel" (ChatMessageBubble.tsx exibe fallback quando body e null)
- **Na lista**: "Nenhuma mensagem" (ConversaItem.tsx mostra fallback quando ultima_mensagem e null, e o filtro de busca exclui mensagens text com body null)

## Causa Raiz

No webhook (`waha-webhook/index.ts`, linha 1327), o body da mensagem e extraido com:

```text
messageBody = payload.body || payload.text || ""
```

Para mensagens com link preview, o WAHA GOWS envia o tipo como `chat` mas o texto real esta dentro de `_data.Message.extendedTextMessage.text` (ou `_data.message.extendedTextMessage.text`). Como `payload.body` vem vazio, o webhook salva `body: null` no banco.

## Solucao

### Alteracao 1: `supabase/functions/waha-webhook/index.ts`

Adicionar fallback para extrair o body de `extendedTextMessage.text` quando `payload.body` e `payload.text` estao vazios.

**Apos a linha 1327** (`const messageBody = payload.body || payload.text || ""`), adicionar logica de fallback:

```text
// Fallback: extendedTextMessage (link previews)
let messageBody = payload.body || payload.text || "";
if (!messageBody) {
  const msgObj = payload._data?.Message || payload._data?.message;
  if (msgObj) {
    messageBody = msgObj.extendedTextMessage?.text
      || msgObj.ExtendedTextMessage?.Text
      || "";
  }
}
```

Isso cobre tanto o formato camelCase (WAHA padrao) quanto PascalCase (GOWS).

### Alteracao 2 (opcional): Script de correcao retroativa

Como a mensagem do Mercado Pago ja esta no banco com body null, ela nao sera corrigida automaticamente. Sera necessario:
- Ou reprocessar manualmente via SQL olhando o `raw_data` das mensagens com `body IS NULL AND tipo = 'text'`
- Ou simplesmente aceitar que mensagens passadas continuarao como "indisponivel"

## Detalhes Tecnicos

- Apenas 1 arquivo alterado: `supabase/functions/waha-webhook/index.ts`
- A mudanca e na extracao do `messageBody` (linha 1327), transformando de `const` para `let` e adicionando o fallback
- Nenhuma dependencia nova
- Nenhuma alteracao no frontend (o frontend ja renderiza corretamente quando body esta preenchido)
