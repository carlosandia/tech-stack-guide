
# Corrigir Renderização de Mensagens Encaminhadas (Forwarded)

## Problemas Identificados

### 1. Imagem não carrega ("Imagem indisponível")
O webhook (`waha-webhook/index.ts`) só faz download da mídia quando `payload.hasMedia && payload.media?.url` (linha 2713). Em mensagens **encaminhadas** (forwarded), o WAHA GOWS pode enviar a estrutura de mídia de forma diferente:
- `hasMedia` pode estar como `false` mesmo tendo imagem
- A URL da mídia pode estar em `_data.Message.imageMessage.url` ou `_data.Message.imageMessage.directPath` em vez de `payload.media.url`
- O tipo da mensagem pode vir como `"chat"` em vez de `"image"`

**Solução**: Adicionar fallback no webhook para detectar mídia em mensagens encaminhadas verificando `_data.Message.imageMessage`, `_data.message.imageMessage`, etc. quando `payload.hasMedia` é false ou `payload.media?.url` está ausente.

### 2. Falta indicador "Encaminhada"
O frontend (`ChatMessageBubble.tsx`) não verifica o campo `isForwarded` ou `forwardingScore` no `raw_data` da mensagem. O WhatsApp exibe "Encaminhada" no topo de mensagens forwarded.

**Solução**: Extrair o status de encaminhamento do `raw_data` e exibir um badge discreto.

## Alteracoes

### Arquivo 1: `supabase/functions/waha-webhook/index.ts`

**Onde**: Apos a detecao de tipo de mensagem (apos linha ~2618) e antes do insert (linha ~2621)

1. **Detectar mensagem encaminhada e inferir tipo de midia**:
   - Verificar se `_data.Message` ou `_data.message` contém `imageMessage`, `videoMessage`, `audioMessage`, `documentMessage`
   - Se o tipo atual for "text"/"chat" mas houver um `imageMessage` dentro, corrigir `wahaType` para "image"
   - Isso cobre o caso onde GOWS envia forwarded messages com tipo "chat" mas payload contém a estrutura de imagem

2. **Fallback para download de midia** (apos linha ~2713):
   - Se `payload.hasMedia` é false OU `payload.media?.url` está ausente, mas o `_data.Message` contém uma mensagem de midia com `directPath` ou `url`:
     - Tentar construir a URL de download via API WAHA (`/api/files/{session}/{messageId}`)
     - Ou extrair `payload.mediaUrl` / `payload._data.MediaURL` que o GOWS pode usar
   - Definir `media_mimetype` a partir do `imageMessage.mimetype` se disponivel

3. **Extrair caption de mensagens encaminhadas**:
   - Para imagens forwarded, o caption pode estar em `_data.Message.imageMessage.caption` em vez de `payload.caption`
   - Adicionar fallback: `payload.caption || msgData.imageMessage?.caption || msgData.videoMessage?.caption`

### Arquivo 2: `src/modules/conversas/components/ChatMessageBubble.tsx`

**Adicionar indicador visual "Encaminhada"**:

1. Criar funcao `isForwardedMessage(rawData)` que verifica:
   - `rawData.isForwarded === true`
   - `rawData._data?.isForwarded === true`
   - `rawData._data?.Message?.*.contextInfo?.isForwarded === true`
   - `rawData._data?.message?.*.contextInfo?.isForwarded === true`
   - `forwardingScore > 0` em qualquer contextInfo

2. Dentro da bolha principal (apos linha ~1153, antes do quotedMessage), renderizar:
```text
+----------------------------------+
| > Encaminhada                    |  <-- novo badge
| [imagem]                         |
| Texto da mensagem...             |
|                          12:26 ✓ |
+----------------------------------+
```
   - Estilo: icone `Forward` (ou seta) + texto "Encaminhada" em `text-[11px] text-muted-foreground italic` com padding inferior de 1px
   - Seguir o mesmo padrao visual do WhatsApp (discreto, acima do conteudo)

### Arquivo 3: `src/modules/conversas/services/conversas.api.ts`
- Nenhuma alteracao na interface `Mensagem` necessaria - o `raw_data` ja contem toda a informacao

## Resumo do Fluxo Corrigido

1. Mensagem encaminhada chega no webhook WAHA
2. Webhook detecta que e uma imagem forwarded (via `_data.Message.imageMessage`) mesmo com `type: "chat"`
3. Webhook corrige o tipo para "image" e faz download da midia
4. Caption e extraido do `imageMessage.caption`
5. Frontend detecta `isForwarded` no `raw_data` e exibe badge "Encaminhada"
6. Imagem + texto + badge renderizam corretamente como no WhatsApp

## Detalhes Tecnicos - Estrutura GOWS para Forwarded

O WAHA GOWS envia mensagens encaminhadas com esta estrutura tipica:

```text
payload = {
  type: "chat",          // <-- incorreto, deveria ser "image"
  hasMedia: true/false,  // <-- pode ser false para forwards
  body: "texto...",
  isForwarded: true,
  _data: {
    Message: {
      imageMessage: {
        url: "...",
        directPath: "...",
        mimetype: "image/jpeg",
        caption: "texto junto da imagem",
        contextInfo: {
          isForwarded: true,
          forwardingScore: 1
        }
      }
    }
  }
}
```

A correcao no webhook deve lidar com todas as variantes de casing (camelCase do NOWEB e PascalCase do GOWS).
