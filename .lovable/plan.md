

## Plano: Corrigir scroll inconsistente ao abrir conversas

### Causa raiz

No efeito unificado atual, quando a conversa muda:
1. `prevLengthRef = 0` (correto)
2. `setTimeout(scroll, 50)` (correto)
3. `prevLengthRef = mensagens.length` -- roda **imediatamente**, antes do scroll

Se React re-renderizar o componente antes dos 50ms (o que depende do cache do React Query e da quantidade de dados), o scroll agendado pode falhar ou o segundo disparo do efeito nao reconhece que precisa scrollar.

### Solucao

Mover a logica de scroll e atualizacao do `prevLengthRef` para **dentro** do `setTimeout`, garantindo que:
1. O DOM ja esteja atualizado
2. O `prevLengthRef` so seja atualizado **apos** o scroll executar
3. Quando `conversaMudou`, o scroll e **incondicional** (nao depende de comparacao de length)

### Alteracao

**Arquivo**: `src/modules/conversas/components/ChatMessages.tsx`

Substituir o efeito atual (linhas 206-233) por:

```typescript
// AIDEV-NOTE: Efeito unificado para scroll - resolve race condition entre troca de conversa e cache
useEffect(() => {
  const conversaMudou = prevConversaRef.current !== conversaId
  prevConversaRef.current = conversaId

  if (conversaMudou) {
    prevLengthRef.current = 0
  }

  // Colocar scroll + atualizacao do ref dentro do setTimeout
  // para garantir que o DOM ja renderizou as mensagens
  setTimeout(() => {
    if (conversaMudou || prevLengthRef.current === 0) {
      // Conversa trocou ou primeira carga: scroll incondicional
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    } else if (mensagens.length > prevLengthRef.current) {
      // Novas mensagens na mesma conversa
      const container = containerRef.current
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
        if (isNearBottom) {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
    prevLengthRef.current = mensagens.length
  }, 80)
}, [conversaId, mensagens.length])
```

### O que muda

1. `prevLengthRef.current = mensagens.length` agora roda **dentro** do timeout, apos o scroll
2. Quando `conversaMudou`, o scroll e **incondicional** (sem `if mensagens.length > ...`)
3. Timeout aumentado para 80ms para cobrir conversas com mais conteudo/midia
4. Condicao `prevLengthRef.current === 0` tambem forca scroll (cobre a primeira carga)

### Nenhum outro arquivo precisa mudar

| Arquivo | Acao |
|---------|------|
| `src/modules/conversas/components/ChatMessages.tsx` | Editar linhas 206-233 |

