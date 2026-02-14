
# Correção: Etiquetas dessincronizadas entre sidebar, header e dispositivo

## Diagnóstico (3 problemas encontrados)

### Problema 1: Cache não invalida após sync
O hook `useSincronizarLabels` no `onSuccess` só invalida a query `['whatsapp-labels']`. Ele NAO invalida `['conversas']` nem `['labels-conversa']`. Resultado: o banco atualiza corretamente mas o frontend continua mostrando dados antigos até o próximo refresh manual.

### Problema 2: Labels órfãs em conversa soft-deleted
Existe uma conversa duplicada com `chat_id = '162826672971943@lid'` que está soft-deleted (`deletado_em` preenchido). O sync só limpa labels de conversas ativas (filtra `deletado_em IS NULL`), então as labels dessa conversa fantasma nunca são removidas. Dependendo de cache, o frontend pode exibir dados dessa conversa morta.

### Problema 3: Sidebar e Header usam fontes de dados diferentes
- **Sidebar (ConversaItem)**: usa `conversa.labels` que vem do JOIN na query paginada (cache do React Query)
- **Header (ChatHeader)**: usa `useLabelsConversa(conversa.id)` que é uma query separada direto na tabela

Quando o cache está desatualizado, os dois mostram dados diferentes.

---

## Plano de Correção

### 1. Corrigir invalidação de cache no `useSincronizarLabels`
**Arquivo:** `src/modules/conversas/hooks/useWhatsAppLabels.ts`

No `onSuccess` da mutation, adicionar invalidação de `['conversas']` e `['labels-conversa']` para que tanto a sidebar quanto o header atualizem após o sync.

### 2. Limpar labels de conversas soft-deleted no sync
**Arquivo:** `supabase/functions/waha-proxy/index.ts`

No bloco `labels_list`, ao fazer o DELETE das associações, incluir TODAS as conversas da organização (não apenas as ativas). Isso garante que conversas com `deletado_em` preenchido também tenham suas labels limpas.

### 3. Limpar dados órfãos imediatos
Executar uma migration SQL para remover labels associadas a conversas soft-deleted, limpando os dados sujos que existem agora.

---

## Detalhes Técnicos

### Mudança 1 - useWhatsAppLabels.ts
```typescript
// ANTES
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['whatsapp-labels'] })
}

// DEPOIS
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['whatsapp-labels'] })
  queryClient.invalidateQueries({ queryKey: ['conversas'] })
  queryClient.invalidateQueries({ queryKey: ['labels-conversa'] })
}
```

### Mudança 2 - waha-proxy/index.ts (labels_list)
No bloco de DELETE, trocar o filtro de conversas ativas para incluir todas as conversas da org:

```typescript
// ANTES: só deleta labels de conversas ativas
const conversaIds = conversasAtivas.map(c => c.id);
await supabaseAdmin.from("conversas_labels")
  .delete()
  .eq("organizacao_id", organizacaoId)
  .in("conversa_id", conversaIds);

// DEPOIS: deleta TODAS labels da org (inclui soft-deleted)
await supabaseAdmin.from("conversas_labels")
  .delete()
  .eq("organizacao_id", organizacaoId);
```

### Mudança 3 - Migration SQL
```sql
DELETE FROM conversas_labels
WHERE conversa_id IN (
  SELECT id FROM conversas WHERE deletado_em IS NOT NULL
);
```

### Ordem de implementação
1. Migration para limpar dados órfãos
2. Corrigir waha-proxy (delete abrangente)
3. Corrigir cache invalidation no hook
4. Deploy e teste
