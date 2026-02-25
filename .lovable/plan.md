
# Correção: Menções em grupos não resolvendo nomes (WAHA GOWS)

## Problema

Em mensagens de grupo, menções como `@162826672971943` aparecem como números brutos ao invés de mostrar o nome do contato/participante. Isso ocorre por duas falhas:

1. **Caminhos de extração incompletos no componente `TextContent`**: O componente só busca `mentionedJid` dentro de `extendedTextMessage.contextInfo`, mas mensagens GOWS podem ter os JIDs mencionados em `_data.MentionedJID` (top-level) ou `rawData.mentionedIds`. Esses caminhos já são cobertos no hook `useMentionResolver`, mas NÃO no componente de renderização.

2. **Sem fallback para detecção no texto**: Quando o `mentionedJid` não é encontrado em nenhum caminho do raw_data, o código desiste imediatamente (linha 118). Deveria tentar detectar padrões `@numero` diretamente no body e cruzar com o `contactMap`.

## Solução

### Alteração: `src/modules/conversas/components/ChatMessageBubble.tsx`

Na função `TextContent` (linhas 103-154), corrigir a extração de `mentionedJid` para cobrir todos os caminhos do GOWS, e adicionar fallback por regex no body:

```text
function TextContent({ body, rawData, contactMap }) {
  const resolvedBody = useMemo(() => {
    if (!contactMap || contactMap.size === 0) return body

    let mentionedJid: string[] = []

    if (rawData) {
      const _data = rawData._data
      const message = _data?.message || _data?.Message
      const extText = message?.extendedTextMessage
      const contextInfo = extText?.contextInfo

      // Coletar de TODOS os caminhos (igual ao useMentionResolver)
      mentionedJid = [
        ...(contextInfo?.mentionedJid || contextInfo?.mentionedJID || []),
        ...(_data?.MentionedJID || []),
        ...(rawData.mentionedIds || []),
      ]
    }

    // FALLBACK: se nao encontrou mentionedJid no raw_data,
    // detectar padroes @numero diretamente no body
    if (mentionedJid.length === 0 && contactMap.size > 0) {
      const bodyMatches = body.match(/@(\d{8,})/g)
      if (bodyMatches) {
        mentionedJid = bodyMatches.map(m => m.slice(1)) // remove o @
      }
    }

    if (mentionedJid.length === 0) return body

    let resolved = body
    for (const jid of mentionedJid) {
      const number = jid
        .replace('@s.whatsapp.net', '')
        .replace('@c.us', '')
        .replace('@lid', '')
      const name = contactMap.get(number)
      if (name) {
        resolved = resolved.replace(`@${number}`, `@@mention:${name}@@`)
      } else if (/^\d{8,}$/.test(number)) {
        const formatted = number.length > 10
          ? `+${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4)}`
          : `+${number}`
        resolved = resolved.replace(`@${number}`, `@@mention:${formatted}@@`)
      }
    }
    return resolved
  }, [body, rawData, contactMap])

  // ... resto igual
}
```

### Resumo das mudanças

- **1 arquivo alterado**: `src/modules/conversas/components/ChatMessageBubble.tsx`
- Expandir os caminhos de extração de `mentionedJid` no `TextContent` para cobrir `_data.MentionedJID` e `rawData.mentionedIds` (alinhando com o hook)
- Adicionar fallback por regex: se nenhum `mentionedJid` for encontrado no raw_data, detectar `@numero` no body e cruzar com o `contactMap`
- Remover a condição `if (!rawData) return body` para permitir o fallback funcionar mesmo sem raw_data
