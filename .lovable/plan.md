

# Correção: Debug e fix das menções em grupo

## Diagnóstico

Após análise exaustiva, a lógica de extração e resolução está teoricamente correta. Os dados no banco confirmam:
- `raw_data._data.Message.extendedTextMessage.contextInfo.mentionedJID` contém `["162826672971943@lid"]`
- Existem mensagens com `participant: 162826672971943@lid` e `PushName: Carlos Andia`
- O hook `useMentionResolver` deveria resolver via LID fallback

Para identificar o ponto exato de falha em runtime, a estratégia é:

## Plano

### 1. Adicionar console.log temporário de debug no `TextContent`

Adicionar logs no componente `TextContent` em `ChatMessageBubble.tsx` para rastrear:
- O conteúdo do `contactMap` (tamanho e entries relevantes)
- Os `mentionedJid` extraídos do raw_data
- Se o replace está ocorrendo

```typescript
// Temporário - remover após debug
if (body.includes('@162826672971943')) {
  console.log('[MENTION-DEBUG] body:', body)
  console.log('[MENTION-DEBUG] contactMap size:', contactMap?.size, 'entries:', contactMap ? Array.from(contactMap.entries()) : 'null')
  console.log('[MENTION-DEBUG] mentionedJid:', mentionedJid)
  console.log('[MENTION-DEBUG] rawData keys:', rawData ? Object.keys(rawData) : 'null')
}
```

### 2. Adicionar console.log no `useMentionResolver`

Logs no hook para verificar:
- `mentionedNumbers` extraídos
- `participantNames` extraídos
- `unresolvedLids` detectados
- Resultado do `lidResolvedMap`
- `contactMap` final

### 3. Simplificar fallback - SEMPRE aplicar regex no body

Independente do debug, garantir que o fallback regex SEMPRE rode, mesmo quando `mentionedJid` foi extraído do raw_data. Isso cobre casos onde a extração funciona mas o número no body é ligeiramente diferente do JID extraído:

```typescript
// Além dos JIDs do raw_data, TAMBÉM detectar @numero no body
const bodyMatches = body.match(/@(\d{8,})/g)
if (bodyMatches) {
  for (const match of bodyMatches) {
    const num = match.slice(1)
    if (!mentionedJid.some(j => j.includes(num))) {
      mentionedJid.push(num)
    }
  }
}
```

### Arquivos alterados
- `src/modules/conversas/components/ChatMessageBubble.tsx` - debug logs + fallback regex aprimorado
- `src/modules/conversas/hooks/useMentionResolver.ts` - debug logs

### Resultado esperado
Com os logs, conseguiremos ver no console do browser exatamente onde o fluxo falha (se o contactMap está vazio, se os JIDs não são extraídos, ou se o replace não acontece). E o fallback regex aprimorado garante cobertura mesmo em edge cases.

