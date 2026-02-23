

# Envio Otimista de Midia (Optimistic UI para Audio, Fotos, Videos e Documentos)

## Objetivo

Fazer com que, ao enviar qualquer midia (audio, foto, video, documento), a mensagem apareca **imediatamente** na UI do chat com um indicador de "enviando", enquanto o upload e envio acontecem em background. O usuario nao precisa esperar o upload terminar para ver a mensagem no chat.

## Situacao Atual

- **Texto**: Ja tem optimistic update (aparece instantaneamente via `useEnviarTexto.onMutate`)
- **Midia (arquivos)**: Upload ao Storage, entra na `MediaQueue`, usuario clica "Enviar tudo", espera API responder, ai sim aparece no chat via `invalidateQueries`
- **Audio**: Upload ao Storage, chama API, espera responder, ai aparece
- **Camera**: Mesma coisa que audio

## Solucao

Aplicar o mesmo padrao de **optimistic update** do `useEnviarTexto` para o hook `useEnviarMedia` e eliminar a fila intermediaria (`MediaQueue`) como gargalo -- ao inves de acumular na fila, enviar direto com preview otimista.

---

## Mudancas Tecnicas

### 1. Hook `useEnviarMedia` com Optimistic Update

**Arquivo**: `src/modules/conversas/hooks/useMensagens.ts`

Adicionar `onMutate` ao `useEnviarMedia` que injeta uma mensagem temporaria no cache do React Query, similar ao `useEnviarTexto`:

- Criar mensagem otimista com `id: temp_xxx`, `from_me: true`, tipo correspondente (image/video/audio/document)
- Incluir `media_url` para que a preview da midia ja apareca (thumbnail de imagem, icone de audio, etc.)
- Adicionar campo `ack: -1` (ou `ack: 0`) para indicar visualmente "enviando" (spinner ou relogio)
- No `onError`, rollback ao snapshot anterior
- No `onSettled`, invalidar queries normalmente

### 2. Envio Direto sem MediaQueue para Cada Arquivo

**Arquivo**: `src/modules/conversas/components/ChatWindow.tsx`

Alterar `handleFileSelected` para que, apos o upload ao Storage ser concluido, chame `enviarMedia.mutate()` diretamente (com optimistic update), em vez de acumular na `MediaQueue`.

Fluxo novo:
```text
Arquivo selecionado
  -> Comprimir (client-side)
  -> Upload ao Storage (com barra de progresso)
  -> enviarMedia.mutate() com optimistic update
     -> Mensagem aparece IMEDIATAMENTE no chat
     -> Backend processa em background
     -> onSettled sincroniza com dados reais
```

A `MediaQueue` sera mantida como fallback opcional, mas o comportamento padrao sera envio direto.

### 3. Audio e Camera com Optimistic Update

**Arquivo**: `src/modules/conversas/components/ChatWindow.tsx`

- `handleAudioSend`: Apos upload ao Storage, chamar `enviarMedia.mutate()` (que agora tem optimistic update) em vez de `conversasApi.enviarMedia()` diretamente
- `handleCameraCapture`: Mesma mudanca -- usar o hook mutation com optimistic update

### 4. Indicador Visual de "Enviando" no Bubble

**Arquivo**: `src/modules/conversas/components/ChatMessageBubble.tsx`

Adicionar um indicador visual para mensagens com `id` que comeca com `temp_`:
- Mostrar um spinner pequeno ou icone de relogio ao lado do timestamp
- Opacidade levemente reduzida (ex: `opacity-70`) para diferenciar do estado "enviado"
- Quando a mensagem real chegar (via `onSettled`/`invalidateQueries`), o `temp_` e substituido pela mensagem real com `ack` correto

---

## Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/conversas/hooks/useMensagens.ts` | Adicionar `onMutate` optimistic no `useEnviarMedia` |
| `src/modules/conversas/components/ChatWindow.tsx` | Envio direto apos upload (sem acumular na fila); audio e camera usando mutation com optimistic |
| `src/modules/conversas/components/ChatMessageBubble.tsx` | Indicador visual de "enviando" para mensagens temporarias |

## Impacto na UX

- Midia aparece no chat **imediatamente** apos upload ao Storage (0-3 segundos dependendo do arquivo)
- O usuario ve um indicador de "enviando" ate a confirmacao do backend
- Se houver erro, a mensagem desaparece automaticamente (rollback) e um toast informa o erro
- Comportamento identico ao WhatsApp Web nativo

