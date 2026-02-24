

# Correção: Exportação incluindo contatos `pre_lead`

## Problema

A listagem de contatos no frontend corretamente exclui contatos com status `pre_lead` (linha 151 do `contatos.api.ts`):
```
.neq('status', 'pre_lead')
```

Porém, a função `exportarComColunas` (linha 894-898) **não aplica esse filtro**, resultando na exportação de todos os 177 contatos (incluindo pre_leads do WhatsApp) em vez dos 5 contatos visíveis na tabela.

## Correção

**Arquivo**: `src/modules/contatos/services/contatos.api.ts`

Na função `exportarComColunas`, adicionar `.neq('status', 'pre_lead')` na query base, logo após `.is('deletado_em', null)` (linha 897):

```
let query = supabase
  .from('contatos')
  .select('*')
  .is('deletado_em', null)
  .neq('status', 'pre_lead')   // <-- ADICIONAR ESTA LINHA
  .order('criado_em', { ascending: false })
  .range(offset, offset + batchSize - 1)
```

Isso alinha o comportamento da exportação com o da listagem, garantindo que apenas contatos ativos (não pre_leads) sejam exportados.

## Impacto

- **1 linha adicionada** em 1 arquivo
- Nenhuma alteração no backend ou no modal de exportação
- Corrige imediatamente o problema dos 177 registros exportados

