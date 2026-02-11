
## Drag and Drop Fluido no Kanban - Optimistic Update

### Problema
Ao arrastar um card entre etapas, a UI so atualiza apos a resposta do backend (~1s de delay), causando uma experiencia travada.

### Solucao
Implementar **optimistic update** no hook `useMoverEtapa` usando o recurso nativo do TanStack Query (`onMutate` / `onError` / `onSettled`). O card sera movido instantaneamente na UI e, caso o backend falhe, a mudanca sera revertida automaticamente.

### Arquivo alterado
- `src/modules/negocios/hooks/useKanban.ts`

### Detalhes tecnicos

Na funcao `useMoverEtapa`, adicionar:

1. **`onMutate`** (antes da chamada API):
   - Cancelar queries pendentes do kanban (`queryClient.cancelQueries`)
   - Capturar snapshot dos dados atuais (para rollback)
   - Atualizar o cache do TanStack Query imediatamente: remover a oportunidade da etapa de origem e inseri-la na etapa de destino (atualizando `etapa_id`, contadores `total_oportunidades` e `valor_total`)
   - Retornar o snapshot como contexto

2. **`onError`** (se a API falhar):
   - Restaurar os dados anteriores usando o snapshot salvo no contexto
   - Manter o `toast.error` existente no `KanbanBoard`

3. **`onSettled`** (sempre, apos sucesso ou erro):
   - Invalidar as queries do kanban para sincronizar com o estado real do banco

4. Manter as invalidacoes de `oportunidade` e `historico` no `onSettled`.

Essa abordagem e pontual (apenas o hook muda) e nao afeta nenhuma outra funcionalidade como fechamento de oportunidade, bulk actions, selecao multipla ou realtime.
