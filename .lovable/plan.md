

# Correcao: Filtrar Duplicatas Apenas para Contatos Reais

## Problema

A funcao `duplicatas` em `src/modules/contatos/services/contatos.api.ts` (linha 542) busca **todos** os contatos da tabela, incluindo os com status `pre_lead`. Contatos `pre_lead` sao criados automaticamente por conversas e widgets, e nao sao contatos reais do modulo `/contatos/pessoas`. Isso gera deteccao de duplicatas entre um contato real e uma conversa, que e incorreto.

## Correcao

### Arquivo: `src/modules/contatos/services/contatos.api.ts`

Na funcao `duplicatas` (linha 544-548), adicionar filtro para excluir contatos com status `pre_lead`:

**Antes:**
```typescript
const { data, error } = await supabase
  .from('contatos')
  .select('id, nome, sobrenome, email, telefone, tipo, status, criado_em')
  .is('deletado_em', null)
  .order('email')
```

**Depois:**
```typescript
const { data, error } = await supabase
  .from('contatos')
  .select('id, nome, sobrenome, email, telefone, tipo, status, criado_em')
  .is('deletado_em', null)
  .neq('status', 'pre_lead')
  .order('email')
```

## Impacto

- Duplicatas serao detectadas apenas entre contatos reais (status: novo, lead, mql, sql, cliente, perdido)
- Conversas que ainda nao viraram contatos (pre_lead) serao ignoradas
- Uma unica linha adicionada, sem risco de regressao
