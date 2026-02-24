

# Correcao: Midias nao aparecem no chat + Timer do audio

## Diagnostico

Analisei o fluxo completo de envio de midias e identifiquei **2 causas raiz**:

### Problema 1: Midias nao aparecem no chat apos envio

O hook `useEnviarMedia` **nao tem optimistic update** (ao contrario do `useEnviarTexto`, que tem). Ele depende exclusivamente do `invalidateQueries` no callback `onSuccess`, que so dispara APOS a API retornar. O fluxo atual:

1. Usuario envia audio/foto/video/documento
2. Upload ao Storage (1-5 segundos)
3. Chamada a `conversasApi.enviarMedia()` via WAHA (1-3 segundos)
4. Insert no banco
5. `onSuccess` dispara `invalidateQueries`
6. React Query refaz o fetch da lista de mensagens
7. **So agora** a mensagem aparece

Total: 3-10 segundos sem nenhum feedback visual no chat. A lista lateral atualiza (via `invalidateQueries(['conversas'])`), mas o painel de mensagens nao mostra nada ate o refetch completar. Alem disso, se houver qualquer falha silenciosa entre os passos 5-6, a mensagem nunca aparece.

**Solucao**: Adicionar `onMutate` com optimistic update no `useEnviarMedia`, injetando a mensagem no cache imediatamente (mesmo padrao ja funcionando para texto). Tambem mover a invalidacao para `onSettled` (executa sempre, independente de sucesso ou erro).

### Problema 2: Camera ainda usa MediaQueue

O `handleCameraCapture` adiciona a foto na fila (`setMediaQueue`) em vez de chamar `enviarMedia.mutateAsync()` diretamente. Isso exige que o usuario clique no botao "Enviar" da fila manualmente.

**Solucao**: Enviar diretamente via `enviarMedia.mutateAsync()` apos upload.

### Problema 3: Timer do audio (ja parcialmente corrigido)

O guard `startedRef` foi adicionado, mas a funcao `cleanup()` nao reseta `startedRef`, entao se o componente for remontado (ex: usuario cancela e grava novamente), o guard impede a nova gravacao.

---

## Alteracoes

### Arquivo 1: `src/modules/conversas/hooks/useMensagens.ts`

Adicionar `onMutate` ao `useEnviarMedia` com optimistic update:

- Criar mensagem temporaria com `id: temp_media_xxx`, `from_me: true`, tipo e `media_url` correspondentes
- Injetar na primeira pagina do cache (mesma logica do `useEnviarTexto`)
- Salvar snapshot para rollback no `onError`
- Mover `invalidateQueries` de `onSuccess` para `onSettled` (mais robusto)

### Arquivo 2: `src/modules/conversas/components/ChatWindow.tsx`

Alterar `handleCameraCapture` para enviar diretamente via `enviarMedia.mutateAsync()` em vez de acumular na `MediaQueue`.

### Arquivo 3: `src/modules/conversas/components/AudioRecorder.tsx`

Resetar `startedRef.current = false` dentro do `cleanup()` para permitir regravacao apos cancelamento.

---

## Resumo

| Arquivo | Alteracao |
|---------|-----------|
| `useMensagens.ts` | Optimistic update no `useEnviarMedia` (onMutate + rollback + onSettled) |
| `ChatWindow.tsx` | `handleCameraCapture` envia direto via hook em vez de usar fila |
| `AudioRecorder.tsx` | Reset do guard `startedRef` no cleanup |

## Resultado esperado

- Audio, foto, video e documento aparecem **instantaneamente** no chat ao enviar (com `ack: 0` mostrando status pendente)
- Apos confirmacao do backend, a mensagem real substitui a otimista via `invalidateQueries`
- Se houver erro, rollback automatico remove a mensagem temporaria e exibe toast de erro
- Camera envia direto sem passar pela fila

