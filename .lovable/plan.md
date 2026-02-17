
# Correcao de Duplicatas Falsas - Race Condition no Webhook WhatsApp

## Problema Identificado

A investigacao revelou que as duplicatas **sao reais**: existem 2 contatos com telefone `5513981996865` na base, criados com apenas 12 milissegundos de diferenca. Isso acontece porque o webhook do WhatsApp (`waha-webhook`) recebe duas mensagens simultaneas do mesmo contato e, como nao ha protecao contra concorrencia, ambos os processos:

1. Buscam contato por telefone -- nao encontram
2. Criam um novo contato -- resultando em duplicata

## Solucao em 2 Partes

### Parte 1: Prevenir novas duplicatas (causa raiz)

**Arquivo:** `supabase/functions/waha-webhook/index.ts`

Adicionar um **UNIQUE INDEX condicional** na tabela `contatos` para a combinacao `(organizacao_id, telefone)` onde `deletado_em IS NULL`. Isso impede que dois inserts concorrentes criem contatos com o mesmo telefone na mesma organizacao.

Alem disso, ajustar a logica de insercao no webhook para tratar o erro de constraint violation fazendo um `SELECT` de retry ao inves de falhar.

**Migracao SQL:**
```text
CREATE UNIQUE INDEX IF NOT EXISTS idx_contatos_org_telefone_unique
ON contatos (organizacao_id, telefone)
WHERE deletado_em IS NULL AND telefone IS NOT NULL AND telefone != '';
```

**Logica no webhook (linhas ~1691-1718):**
- Envolver o INSERT em try/catch
- Se falhar com erro de constraint (23505), fazer SELECT para buscar o contato que ja foi criado pela outra request concorrente
- Usar o contato encontrado normalmente

### Parte 2: Melhorar deteccao de duplicatas no frontend

**Arquivo:** `src/modules/contatos/services/contatos.api.ts` (linhas 552-577)

A logica atual de agrupamento tem um problema menor: a limpeza de telefone com `replace(/\D/g, '')` pode agrupar telefones que sao visualmente diferentes mas numericamente iguais (ex: `(13) 98850-4422` e `13988504422`). Isso e desejavel. Porem, nao ha deduplicacao de contatos entre grupos — se um contato tem email E telefone duplicados, ele aparece em 2 grupos separados.

Ajuste: apos agrupar, deduplicar para que cada contato apareca em no maximo 1 grupo de duplicatas (priorizando email sobre telefone).

## Resumo Tecnico

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| Nova migracao SQL | `supabase/migrations/...unique_telefone.sql` | UNIQUE INDEX parcial em `(organizacao_id, telefone)` |
| Ajustar webhook | `supabase/functions/waha-webhook/index.ts` | Retry com SELECT se INSERT falhar por constraint |
| Melhorar deteccao | `src/modules/contatos/services/contatos.api.ts` | Deduplicar contatos entre grupos de duplicatas |

## Impacto

- **Zero downtime**: o index unico nao afeta registros existentes com telefones diferentes
- **Duplicatas existentes**: continuarao aparecendo ate serem mescladas manualmente (comportamento correto)
- **Novas duplicatas**: serao impossibilitadas pelo constraint no banco de dados
