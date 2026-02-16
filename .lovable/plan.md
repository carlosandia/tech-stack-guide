
# Correcao: Figurinhas exibidas como imagem

## Problema

O WAHA GOWS envia figurinhas com `type: "sticker"` no payload do webhook, mas o codigo atual nao trata esse tipo diretamente. O fluxo atual:

1. `messageType = payload.type` recebe `"sticker"`
2. Na linha 1870: `wahaType = messageType === "chat" ? "text" : (messageType || "text")` -- aqui `wahaType` ja fica como `"sticker"` corretamente
3. POREM, o bloco de inferencia por mimetype (linhas 1904-1918) SOBRESCREVE o tipo para `"image"` porque figurinhas tem `hasMedia=true` e mimetype `image/webp`

Ou seja, o tipo `sticker` e detectado mas depois sobrescrito para `image` pelo bloco de media.

## Solucao

Adicionar uma condicao de guarda no bloco de inferencia por mimetype para NAO sobrescrever quando o tipo ja e `sticker`.

### Mudanca no arquivo `supabase/functions/waha-webhook/index.ts`

**Linha ~1904**: Alterar a condicao do bloco de inferencia por mimetype para excluir stickers:

```
// Antes:
if ((wahaType === "text" || wahaType === "chat") && payload.hasMedia && payload.media?.mimetype) {

// Depois:
if ((wahaType === "text" || wahaType === "chat") && payload.hasMedia && payload.media?.mimetype) {
```

Na verdade o problema e que `"sticker"` nao e `"text"` nem `"chat"`, entao esse bloco nao deveria entrar. Preciso confirmar se ha outro ponto que sobrescreve.

Apos analise mais cuidadosa, a correcao real e:

1. Adicionar deteccao explícita de sticker via `_data.Info.Type === "sticker"` ou `_data.Message.stickerMessage` como fallback (similar ao que ja e feito para polls)
2. Garantir que o bloco de preview na lista de conversas mostre "Figurinha" ao inves de "Foto"

### Mudancas

**Arquivo: `supabase/functions/waha-webhook/index.ts`**
- Apos o bloco de deteccao de poll (linha ~1902), adicionar deteccao de sticker via `_data.Info.Type` e `_data.Message.stickerMessage`
- Isso cobre o cenario onde GOWS envia sticker com type generico

**Arquivo: `src/modules/conversas/components/ConversaItem.tsx`**
- Alterar o label de "Sticker" para "Figurinha" para ficar em portugues

### Detalhes tecnicos

No webhook, adicionar apos linha 1902:

```typescript
// Detect sticker messages from GOWS
if ((wahaType === "text" || wahaType === "chat" || wahaType === "image") && 
    (payload._data?.Info?.Type === "sticker" || 
     payload._data?.Message?.stickerMessage ||
     payload._data?.message?.stickerMessage)) {
  wahaType = "sticker";
  console.log(`[waha-webhook] Sticker detected from payload structure (was type: ${messageType})`);
}

// Also handle when WAHA correctly sends type="sticker" but media inference would override
if (messageType === "sticker") {
  wahaType = "sticker";
}
```

Isso garante que figurinhas sejam salvas como `tipo: "sticker"` e renderizadas sem bolha, como o frontend ja suporta.
