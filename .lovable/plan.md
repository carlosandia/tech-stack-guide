

# Correção: Mídias Enviadas Não Aparecem na UI

## Problema

Áudio, imagens, vídeos e documentos enviados pelo CRM são persistidos no banco e chegam ao WhatsApp, mas **não aparecem na interface do chat**. Apenas mensagens de texto aparecem.

## Causa Raiz

As funções de envio de mídia no `ChatWindow.tsx` chamam `conversasApi.enviarMedia()` diretamente, **sem passar pelo hook `useEnviarMedia`** do React Query. Como resultado:

- O cache do React Query **nunca é invalidado** após o envio
- Não existe subscription Realtime para eventos INSERT (só UPDATE para ACKs)
- A UI fica "presa" no estado anterior, sem saber que há mensagens novas

```text
Fluxo atual (QUEBRADO):
  handleSendQueue / handleAudioSend
    -> conversasApi.enviarMedia() (direto)
    -> toast.success()
    -> (nenhuma invalidação de cache)
    -> UI não atualiza

Fluxo correto:
  handleSendQueue / handleAudioSend
    -> useEnviarMedia.mutate() (via hook)
    -> onSuccess: invalidateQueries(['mensagens'])
    -> UI refaz fetch e mostra a mensagem
```

## Correção

### Arquivo: `src/modules/conversas/components/ChatWindow.tsx`

**1. Importar o hook `useEnviarMedia`**

Adicionar `useEnviarMedia` na importação existente do `useMensagens.ts` (linha 26).

**2. Instanciar o hook no componente**

Criar `const enviarMedia = useEnviarMedia()` junto com os outros hooks (após linha 144).

**3. Alterar `handleSendQueue` (linha 346-373)**

Substituir a chamada direta `conversasApi.enviarMedia()` por `enviarMedia.mutateAsync()`:

```typescript
// ANTES:
await conversasApi.enviarMedia(conversa.id, { ... })

// DEPOIS:
await enviarMedia.mutateAsync({
  conversaId: conversa.id,
  dados: { tipo: item.tipo, media_url: item.media_url, filename: item.filename, mimetype: item.mimetype }
})
```

**4. Alterar `handleAudioSend` (linha 400-404)**

Substituir a chamada direta por `enviarMedia.mutateAsync()`:

```typescript
// ANTES:
await conversasApi.enviarMedia(conversa.id, { tipo: 'audio', media_url: urlData.publicUrl, mimetype: contentType })

// DEPOIS:
await enviarMedia.mutateAsync({
  conversaId: conversa.id,
  dados: { tipo: 'audio', media_url: urlData.publicUrl, mimetype: contentType }
})
```

## Resumo

| Local | Problema | Correção |
|-------|----------|----------|
| `handleSendQueue` | Chama API direto, sem invalidar cache | Usar `enviarMedia.mutateAsync()` |
| `handleAudioSend` | Chama API direto, sem invalidar cache | Usar `enviarMedia.mutateAsync()` |
| Import + instância | Hook não estava sendo usado | Importar e instanciar `useEnviarMedia` |

## Impacto

- Todas as mídias enviadas (áudio, foto, vídeo, documento) aparecerão na UI imediatamente após o backend confirmar
- O hook `useEnviarMedia` já tem `onSuccess` com `invalidateQueries`, garantindo o refetch automático
- Nenhuma alteração no backend necessária
