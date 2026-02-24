

## Plano: Corrigir Scroll Forçado ao Abrir Conversa

### Diagnóstico

A correção anterior (resetar `prevLengthRef` ao mudar `conversaId`) está parcialmente correta, mas falha por uma **race condition**:

1. O `useEffect([conversaId])` reseta `prevLengthRef = 0`
2. O `useEffect([mensagens.length])` deveria fazer scroll, mas **só re-executa quando `mensagens.length` muda**
3. Se as mensagens da nova conversa já estão em cache (React Query), `mensagens.length` pode não mudar entre renders, e o efeito de scroll **nunca dispara**
4. Mesmo quando dispara, o `scrollIntoView` pode executar antes do DOM renderizar as mensagens novas

### Solução

Unificar a lógica em um único `useEffect` que depende de **ambos** `conversaId` e `mensagens.length`. Usar `setTimeout(0)` para garantir que o DOM já foi atualizado antes de fazer o scroll.

### Alteração

**Arquivo**: `src/modules/conversas/components/ChatMessages.tsx`

Substituir os dois efeitos separados (reset + scroll) por um único efeito:

```text
// Remover o useEffect([conversaId]) separado (linhas 203-206)
// Remover o useEffect([mensagens.length]) atual (linhas 209-224)

// Substituir por um único efeito:
const prevConversaRef = useRef<string | undefined>(undefined)

useEffect(() => {
  const conversaMudou = prevConversaRef.current !== conversaId
  prevConversaRef.current = conversaId

  if (conversaMudou) {
    // Conversa trocou: forçar scroll ao final com delay para DOM atualizar
    prevLengthRef.current = 0
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }, 50)
  } else if (mensagens.length > prevLengthRef.current) {
    // Mesma conversa, novas mensagens chegaram
    if (prevLengthRef.current === 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      }, 50)
    } else {
      const container = containerRef.current
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
        if (isNearBottom) {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  prevLengthRef.current = mensagens.length
}, [conversaId, mensagens.length])
```

### Como funciona

1. **Troca de conversa**: `conversaMudou` detecta a mudança e força scroll instantâneo com `setTimeout(50ms)` para garantir que o DOM já renderizou
2. **Novas mensagens na mesma conversa**: mantém a lógica original (scroll suave se perto do final)
3. **Primeira carga**: `prevLengthRef === 0` garante scroll instantâneo

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/modules/conversas/components/ChatMessages.tsx` | **Editar** -- unificar os 2 useEffects em 1 |

Nenhum outro arquivo precisa ser alterado.

