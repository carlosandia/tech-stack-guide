
# Correção: Menções não resolvidas em mensagens de grupo

## Causa Raiz

O `ChatMessageBubble` tem DOIS caminhos de renderização para mensagens de texto:

1. **Linha 1211** (caminho REAL usado): `formattedBody` via `sanitizeFormattedHtml(mensagem.body)` -- NAO usa contactMap
2. **Linha 647** via `renderContent` -> `TextContent`: USA contactMap, mas so e chamado para tipos nao-texto (stickers, reactions, etc.)

O bloco condicional na linha 1211 (`isTextType`) renderiza mensagens de texto com `formattedBody`, que e um `useMemo` que depende APENAS de `mensagem.body` e nunca consulta o `contactMap`. Por isso a resolucao de mencoes nunca acontece.

## Plano de Correção

### 1. Substituir `formattedBody` por lógica com menções (ChatMessageBubble.tsx)

Alterar o `useMemo` de `formattedBody` (linhas 1010-1013) para incluir a lógica de resolução de menções que hoje existe no `TextContent`:

```text
Antes:
  const formattedBody = useMemo(() => {
    if (!mensagem.body) return '...'
    return sanitizeFormattedHtml(mensagem.body)
  }, [mensagem.body])

Depois:
  const formattedBody = useMemo(() => {
    if (!mensagem.body) return '...'

    // Resolver mencoes antes de formatar
    let bodyWithMentions = mensagem.body

    // Extrair mentionedJid do raw_data
    let mentionedJid: string[] = []
    if (mensagem.raw_data) {
      const rawData = mensagem.raw_data as Record<string, unknown>
      const _data = rawData._data as Record<string, unknown> | undefined
      const message = (_data?.message || _data?.Message) as Record<string, unknown> | undefined
      const extText = message?.extendedTextMessage as Record<string, unknown> | undefined
      const contextInfo = extText?.contextInfo as Record<string, unknown> | undefined
      mentionedJid = [
        ...((contextInfo?.mentionedJid || contextInfo?.mentionedJID || []) as string[]),
        ...((_data?.MentionedJID || []) as string[]),
        ...((rawData.mentionedIds || []) as string[]),
      ]
    }

    // Fallback: detectar @numero no body
    const bodyMatches = bodyWithMentions.match(/@(\d{8,})/g)
    if (bodyMatches) {
      for (const match of bodyMatches) {
        const num = match.slice(1)
        if (!mentionedJid.some(j => j.includes(num))) {
          mentionedJid.push(num)
        }
      }
    }

    // Substituir @numero por nome ou telefone formatado
    for (const jid of mentionedJid) {
      const number = jid.replace('@s.whatsapp.net','').replace('@c.us','').replace('@lid','')
      const name = contactMap?.get(number)
      if (name) {
        bodyWithMentions = bodyWithMentions.replace(`@${number}`, `@@mention:${name}@@`)
      } else if (/^\d{8,}$/.test(number)) {
        const fmt = number.length > 10
          ? `+${number.slice(0,2)} ${number.slice(2,4)} ${number.slice(4)}`
          : `+${number}`
        bodyWithMentions = bodyWithMentions.replace(`@${number}`, `@@mention:${fmt}@@`)
      }
    }

    return sanitizeFormattedHtml(bodyWithMentions)
  }, [mensagem.body, mensagem.raw_data, contactMap])
```

### 2. Atualizar o HTML na linha 1213

Adicionar substituicao de marcadores `@@mention:...@@` por spans estilizados, similar ao que o `TextContent` faz:

```text
const formattedBodyHtml = formattedBody.replace(
  /@@mention:(.*?)@@/g,
  '<span class="mention-highlight">@$1</span>'
)
```

Usar `formattedBodyHtml` no `dangerouslySetInnerHTML`.

### 3. Limpar código de debug

Remover todos os `console.log` temporários de `[MENTION-DEBUG]` e `[MENTION-RESOLVER]` de ambos os arquivos.

### Arquivos alterados
- `src/modules/conversas/components/ChatMessageBubble.tsx` - integrar resolucao de mencoes no `formattedBody` + limpar logs

### Resultado esperado
Mencoes como `@162826672971943` serao substituidas por nomes (ex: "Carlos Andia") ou telefones formatados (ex: "+16 28...") no caminho de renderizacao real das mensagens de texto.
