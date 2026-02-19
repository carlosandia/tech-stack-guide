

## Correcao: Viewer de Status igual ao WhatsApp Web

### Problema Atual
1. **Imagem pixelada/estourada**: O `minWidth: 60vw` / `minHeight: 60vh` forca thumbnails base64 (resolucao ~150px) a ocupar 60% da tela, causando pixelizacao extrema
2. **Layout diferente do WhatsApp**: O viewer atual e generico (toolbar + imagem centralizada). O WhatsApp Web mostra Status com layout proprio: imagem em fullscreen com caption sobreposto na parte inferior

### Solucao

**1. `MediaViewer.tsx` - Remover stretching forcado e adicionar modo Status**

Aceitar props opcionais `caption` e `senderName` para renderizar no estilo WhatsApp Status:
- Remover `minWidth`/`minHeight` que causam pixelizacao
- Quando `caption` ou `senderName` estiverem presentes, renderizar layout de Status:
  - Fundo preto total (100%)
  - Nome do contato + horario no topo (sobre a imagem)
  - Imagem centralizada com `object-contain` respeitando resolucao nativa (sem stretching)
  - Caption na parte inferior sobre fundo gradiente semitransparente
- Para thumbnails base64, usar `max-width: 80vw` e `max-height: 70vh` sem forcar tamanho minimo -- a imagem fica no melhor tamanho possivel sem pixelar

**2. `ChatMessageBubble.tsx` - Passar caption e senderName ao MediaViewer**

Quando `QuotedMessagePreview` abre o viewer para um Status reply:
- Passar `caption` (do `quoted.caption` ou `quoted.body`)
- Passar `senderName` (ja resolvido no componente)
- O `handleViewMedia` sera atualizado para aceitar esses dados extras

**3. Ajuste no `handleClick` do `QuotedMessagePreview`**

Atualizar a chamada de `onViewMedia` para incluir caption e senderName como parametros adicionais, permitindo que o MediaViewer renderize o layout de Status.

### Resultado Visual Esperado
- Imagem centralizada em fundo preto, sem pixelizacao
- Nome do contato no topo
- Caption "Bora fazer acontecer!" na parte inferior com gradiente
- Botao de fechar e download no canto superior direito
- Layout identico ao WhatsApp Web (segunda imagem de referencia)

### Detalhes Tecnicos

**Interface atualizada do MediaViewer:**
```text
MediaViewerProps {
  url: string
  tipo: 'image' | 'video'
  onClose: () => void
  caption?: string        // novo
  senderName?: string     // novo
}
```

**Callback atualizado do onViewMedia:**
```text
onViewMedia(url, tipo, { caption, senderName })
```

**Arquivos alterados:**
- `src/modules/conversas/components/MediaViewer.tsx`
- `src/modules/conversas/components/ChatMessageBubble.tsx`

