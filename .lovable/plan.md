
# Correções no Módulo de Conversas: Auto-focus e Optimistic Send

## 1. Auto-focus no textarea ao selecionar conversa

**Problema:** Ao clicar em uma conversa na lista, o campo de texto não recebe foco automaticamente, obrigando o usuário a clicar manualmente no input antes de digitar.

**Solução:** No `ChatWindow`, adicionar um `useEffect` que detecta mudança de `conversa.id` e chama `chatInputRef.current?.focusTextarea()` automaticamente. Isso fará o cursor já estar posicionado no campo de texto assim que a conversa abrir.

**Arquivo:** `src/modules/conversas/components/ChatWindow.tsx`
- Adicionar `useEffect` no bloco que já reseta busca ao trocar conversa (linha ~167), incluindo chamada de focus com pequeno delay para garantir que o DOM já renderizou.

## 2. Optimistic Update ao enviar mensagem

**Problema:** Ao enviar uma mensagem, ela só aparece na UI depois que o backend confirma o envio. Isso causa uma sensação de lentidão.

**Solução:** Implementar Optimistic Update no hook `useEnviarTexto` do TanStack Query. Ao chamar `mutate`, inserimos imediatamente uma mensagem temporária no cache local com status visual de "enviando" (ack = 0). Quando o backend confirma, o cache é invalidado e a mensagem real substitui a otimista.

**Arquivo:** `src/modules/conversas/hooks/useMensagens.ts`
- No `useEnviarTexto`, adicionar callbacks `onMutate`, `onError` e `onSettled`:
  - `onMutate`: salvar snapshot do cache, inserir mensagem otimista na primeira página com `id` temporário, `from_me: true`, `tipo: 'text'`, `body: texto`, `ack: 0`, `criado_em: new Date().toISOString()`
  - `onError`: restaurar snapshot (rollback)
  - `onSettled`: invalidar queries para sincronizar com dados reais

**Arquivo:** `src/modules/conversas/components/ChatMessages.tsx` (se necessário)
- Verificar se mensagens com `ack: 0` já possuem indicação visual (check cinza). Caso contrário, garantir que o status "enviando" seja visualmente distinto.

## Detalhes Técnicos

### Auto-focus (ChatWindow.tsx)
```typescript
// Dentro do useEffect que reseta busca (conversa.id change)
useEffect(() => {
  setBuscaAberta(false)
  setTermoBusca('')
  setBuscaIndex(0)
  setMediaQueue(prev => { /* cleanup */ })
  // Auto-focus no input
  setTimeout(() => chatInputRef.current?.focusTextarea(), 100)
}, [conversa.id])
```

### Optimistic Update (useMensagens.ts)
```typescript
export function useEnviarTexto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, texto, replyTo, isTemplate }) =>
      conversasApi.enviarTexto(conversaId, texto, replyTo, isTemplate),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['mensagens', variables.conversaId] })
      const snapshot = queryClient.getQueryData(['mensagens', variables.conversaId])
      
      // Inserir mensagem otimista
      const optimisticMsg = {
        id: `temp_${Date.now()}`,
        conversa_id: variables.conversaId,
        from_me: true,
        tipo: 'text',
        body: variables.texto,
        ack: 0,  // status "enviando"
        criado_em: new Date().toISOString(),
        // ... campos mínimos
      }
      
      queryClient.setQueryData(['mensagens', variables.conversaId], (old) => {
        // Inserir na primeira página (mais recente)
        // ...
      })
      
      return { snapshot }
    },
    onError: (_err, variables, context) => {
      // Rollback
      queryClient.setQueryData(['mensagens', variables.conversaId], context?.snapshot)
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
  })
}
```

### Arquivos a editar

1. `src/modules/conversas/components/ChatWindow.tsx` - Adicionar auto-focus no useEffect de mudança de conversa
2. `src/modules/conversas/hooks/useMensagens.ts` - Implementar optimistic update no `useEnviarTexto`
