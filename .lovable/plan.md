
# Limpeza de caracteres corrompidos (U+FFFD) nas mensagens

## Problema

Mensagens vindas do WAHA GOWS (como templateMessage do Mercado Pago) chegam com caracteres `U+FFFD` (simbolo de substituicao Unicode `�`) onde deveriam estar emojis. Esses caracteres ja vem corrompidos na origem e ficam armazenados assim no banco, resultando em texto com `�` visivel no chat.

## Solucao

Limpar os caracteres `U+FFFD` em 3 camadas:

### 1. Frontend - `ChatMessageBubble.tsx`

Na funcao `sanitizeFormattedHtml`, adicionar uma etapa inicial para remover caracteres `\uFFFD` do texto antes de formatar:

```text
text.replace(/\uFFFD/g, '')
```

Isso afeta tanto `TextContent` quanto o `formattedBody` usado na renderizacao inline, cobrindo todos os casos de exibicao.

### 2. Webhook - `waha-webhook/index.ts`

Apos a extracao do `messageBody` (onde ja temos os fallbacks para `extendedTextMessage` e `templateMessage`), adicionar limpeza:

```text
messageBody = messageBody.replace(/\uFFFD/g, '');
```

Isso garante que mensagens futuras sejam salvas no banco ja sem os caracteres corrompidos.

### 3. Migration SQL retroativa

Criar migration para limpar mensagens ja existentes no banco:

```text
UPDATE mensagens
SET body = regexp_replace(body, E'\uFFFD', '', 'g'),
    atualizado_em = now()
WHERE body LIKE '%' || E'\uFFFD' || '%'
  AND deletado_em IS NULL;
```

## Arquivos alterados

- `src/modules/conversas/components/ChatMessageBubble.tsx` (1 linha na funcao `sanitizeFormattedHtml`)
- `supabase/functions/waha-webhook/index.ts` (1 linha apos extracao do messageBody)
- Nova migration SQL para limpeza retroativa
