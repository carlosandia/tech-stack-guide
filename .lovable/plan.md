
# Correcao: Midias nao aparecem na UI + Timer do audio acelerado

## Problema 1: Midias nao aparecem na UI

O `handleSendQueue` e `handleAudioSend` usam `useCallback` com dependencias incompletas. O `enviarMedia` nao esta listado nas dependencias, fazendo com que o callback capture uma referencia **stale** (antiga) do hook. Isso pode causar comportamento inesperado onde a mutacao nao executa corretamente ou nao invalida o cache.

**Correcao**: Adicionar `enviarMedia` nas dependencias dos `useCallback`:

| Funcao | Linha | Dependencias atuais | Adicionar |
|--------|-------|---------------------|-----------|
| `handleSendQueue` | 377 | `[mediaQueue, sendingQueue, conversa.id]` | `enviarMedia` |
| `handleAudioSend` | 419 | `[conversa.id]` | `enviarMedia, conversa.organizacao_id` |

## Problema 2: Timer do audio contando rapido demais

O `AudioRecorder` usa `useEffect` com array de dependencias vazio (`[]`) para auto-iniciar a gravacao. No entanto, com **React StrictMode** (ativo em `src/main.tsx`), o componente monta, desmonta e remonta -- executando `startRecording()` **duas vezes**. Isso cria **dois `setInterval` simultaneos**, fazendo o timer incrementar 2x por segundo.

**Correcao**: Adicionar um guard (`ref`) para evitar dupla execucao no StrictMode:

```typescript
const startedRef = useRef(false)

useEffect(() => {
  if (startedRef.current) return
  startedRef.current = true
  startRecording()
  return () => {
    // cleanup existente
  }
}, [])
```

## Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/conversas/components/ChatWindow.tsx` | Adicionar `enviarMedia` e `conversa.organizacao_id` nas dependencias dos useCallback |
| `src/modules/conversas/components/AudioRecorder.tsx` | Guard com ref para evitar dupla execucao no StrictMode |

## Impacto

- Midias enviadas aparecerao na UI apos confirmacao do backend (cache invalidado corretamente)
- Timer do audio contara 1 segundo por segundo, como esperado
