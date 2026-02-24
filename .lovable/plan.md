
## Plano: Sincronizar alterações da configuração com o Kanban

### Problema
Quando o usuário edita a pipeline (etapas, campos, etc.) e volta ao Kanban, as mudanças não são refletidas automaticamente porque os dados do Kanban estão em cache (staleTime de 1 minuto).

### Recomendação de abordagem

**Invalidar cache ao sair da configuração** — esta é a melhor estratégia por 3 motivos:

1. **Performance**: Nenhuma requisição extra durante a edição. Apenas 1 refetch ao voltar
2. **UX**: O Kanban carrega já atualizado quando o usuário chega, sem delay perceptível
3. **Simplicidade**: Não precisa de polling, WebSocket ou invalidações parciais em cada mutation

### Implementação

**Arquivo**: `src/modules/negocios/pages/PipelineConfigPage.tsx`

- Criar uma função `handleVoltar` que:
  1. Invalida as queries `['kanban']`, `['funis']` e `['funil', funilId]` via `useQueryClient()`
  2. Navega para `/negocios`
- Substituir os dois `navigate('/negocios')` existentes (botão voltar no header e link de fallback) por essa função

### Detalhe técnico

```text
Fluxo:
  Usuário clica "Voltar" 
    -> queryClient.invalidateQueries(['kanban'])
    -> queryClient.invalidateQueries(['funis'])  
    -> navigate('/negocios')
    -> Kanban remonta e busca dados frescos automaticamente
```

Isso garante que qualquer alteração feita em etapas, campos, distribuição, etc. seja refletida no Kanban com apenas 1 refetch, sem requisições desnecessárias durante a edição.
