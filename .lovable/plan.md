

# Plano de Correcao: Foco ao Responder + Copiar Midia Real

## Problema 1: Foco automatico ao clicar em "Responder"

Quando o usuario clica em "Responder" no menu de acoes, o estado `replyingTo` e atualizado no `ChatWindow`, mas o campo de texto nao recebe foco automaticamente -- o usuario precisa clicar manualmente no textarea.

**Solucao**: Expor o `textareaRef` do `ChatInput` via `useImperativeHandle` e, no `ChatWindow`, chamar `.focus()` ao definir `replyingTo`.

### Alteracoes

**Arquivo**: `src/modules/conversas/components/ChatInput.tsx`
- Alterar o `forwardRef` para expor um metodo `focusTextarea()` via `useImperativeHandle`
- O ref externo passara a ter a interface `{ focusTextarea: () => void }`

**Arquivo**: `src/modules/conversas/components/ChatWindow.tsx`
- Criar um `chatInputRef` com `useRef`
- Passar o ref ao componente `ChatInput`
- No callback `onReplyMessage`, alem de `setReplyingTo(msg)`, chamar `chatInputRef.current?.focusTextarea()` com um pequeno `setTimeout` para garantir que o estado ja atualizou

---

## Problema 2: Copiar midia real (imagem, video, documento) em vez da URL

Atualmente o `handleCopy` no `ChatMessageBubble.tsx` copia a URL da midia como texto plano. O comportamento esperado e:

- **Imagens**: Copiar o blob da imagem para a area de transferencia (usando `navigator.clipboard.write` com `ClipboardItem`)
- **Videos/Documentos/Audio**: Nao e possivel copiar binarios complexos para a area de transferencia na maioria dos navegadores. Para esses tipos, o comportamento mais correto e **baixar o arquivo** em vez de copiar a URL. Porem, como copiar video/doc nao e padrao, a abordagem recomendada e:
  - Imagem: copiar o blob real da imagem
  - Video/Audio/Documento: copiar a URL mas informar ao usuario com toast "Link copiado" (ou oferecer download)

**Solucao para imagens**: Fazer `fetch` da `media_url`, converter para `Blob`, e usar `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`.

### Alteracoes

**Arquivo**: `src/modules/conversas/components/ChatMessageBubble.tsx`
- Refatorar `handleCopy` (linhas 921-950):
  - Para `tipo === 'image'`: buscar a imagem via `fetch`, converter para blob PNG, e usar a Clipboard API binaria
  - Para `tipo === 'video' | 'audio' | 'document'`: manter a copia da URL mas alterar o toast para "Link do arquivo copiado"
  - Para `tipo === 'text'` e outros: manter comportamento atual (copiar texto)
  - Tratar erros de CORS ou falha no fetch com fallback para copiar a URL

---

## Secao Tecnica

### Focus via ImperativeHandle

```typescript
// ChatInput.tsx
export interface ChatInputHandle {
  focusTextarea: () => void
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(...)

useImperativeHandle(ref, () => ({
  focusTextarea: () => textareaRef.current?.focus()
}))
```

```typescript
// ChatWindow.tsx
const chatInputRef = useRef<ChatInputHandle>(null)

onReplyMessage={(msg) => {
  setReplyingTo(msg)
  setTimeout(() => chatInputRef.current?.focusTextarea(), 50)
}}
```

### Clipboard API para imagens

```typescript
// handleCopy para imagens
if (mensagem.tipo === 'image' && mensagem.media_url) {
  try {
    const resp = await fetch(mensagem.media_url)
    const blob = await resp.blob()
    // Converter para PNG se necessario (clipboard so aceita PNG)
    const pngBlob = await convertToPng(blob)
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob })
    ])
    toast.success('Imagem copiada')
  } catch {
    // Fallback: copiar URL
    navigator.clipboard.writeText(mensagem.media_url)
    toast.success('Link da imagem copiado')
  }
  return
}
```

A funcao `convertToPng` carrega o blob num `Image` via canvas e exporta como PNG, necessario porque a Clipboard API so aceita `image/png`.

