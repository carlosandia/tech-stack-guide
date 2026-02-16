
# Correcao: Respostas em Grupos GOWS Nao Exibidas

## Problema

O webhook **ja esta salvando** `reply_to_message_id` corretamente (confirmado: 11 mensagens com reply nas ultimas 2 horas). O problema esta na **UI** -- a lookup para encontrar a mensagem citada falha.

### Causa Raiz

O formato de `message_id` em grupos GOWS tem 4 segmentos:

```text
false_120363045526325783@g.us_3B47283A826F265B10FA_222286367961324@lid
[0]    [1]                      [2] = stanzaID           [3] = senderLid
```

O codigo atual em `ChatMessages.tsx` indexa pelo **ultimo** segmento (`.split('_').pop()`), que retorna o `senderLid` (`222286367961324@lid`). Porem, o `reply_to_message_id` armazena o **stanzaID** (segmento [2], ex: `A520943141A016E3F4460E46E708DBC1`).

Para mensagens **individuais** (3 segmentos), o ultimo segmento E o stanzaID, entao funciona. Para **grupos** (4 segmentos), nao funciona.

## Solucao

### Arquivo: `src/modules/conversas/components/ChatMessages.tsx`

Alterar o mapeamento `messageByWahaId` para indexar tambem pelo **penultimo** segmento (stanzaID) quando o `message_id` tiver 4+ segmentos:

```typescript
const messageByWahaId = useMemo(() => {
  const map = new Map<string, Mensagem>()
  for (const msg of sortedMessages) {
    if (msg.message_id) {
      // Index by full serialized ID
      map.set(msg.message_id, msg)
      
      if (msg.message_id.includes('_')) {
        const parts = msg.message_id.split('_')
        // Last segment (works for individual messages where last = stanzaID)
        const lastPart = parts[parts.length - 1]
        if (lastPart) map.set(lastPart, msg)
        
        // For GOWS group messages (4 segments): stanzaID is at index 2
        // Format: {bool}_{groupId}_{stanzaID}_{senderLid}
        if (parts.length >= 4) {
          const stanzaPart = parts[2]
          if (stanzaPart && !stanzaPart.includes('@')) {
            map.set(stanzaPart, msg)
          }
        }
      }
    }
  }
  return map
}, [sortedMessages])
```

A condicao `!stanzaPart.includes('@')` garante que so indexa valores que parecem stanzaIDs (hexadecimais), evitando conflitos com IDs como `groupId@g.us`.

## Resultado Esperado

- Mensagens de resposta em grupos GOWS serao corretamente vinculadas e exibidas com o bloco de citacao visual
- Mensagens individuais continuam funcionando (sem regressao)
- A mensagem "Carnaval, aconteceu ano passado..." do Eduardo Dietrich exibira o quote de "Bom dia pessoal!" do Gabriel Candido
