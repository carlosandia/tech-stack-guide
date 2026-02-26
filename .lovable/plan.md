
# Plano: Corrigir Canal de Origem para refletir todas as fontes de leads

## Problema Identificado

O gráfico "Por Canal de Origem" usa `utm_source` da tabela `oportunidades` para determinar o canal. Porém, **a maioria dos fluxos de criação de oportunidade NÃO popula `utm_source`**, resultando em tudo aparecendo como "Direto":

| Fonte de criação | Popula utm_source? | O que deveria ser |
|---|---|---|
| Modal manual (com UTM preenchido) | Sim | Valor do UTM |
| Modal manual (sem UTM) | Nao (NULL) | `manual` |
| Formulário/Widget (com UTM na URL) | Sim | Valor do UTM |
| WhatsApp (pré-oportunidade aceita) | Nao (NULL) | `whatsapp` |
| Instagram (pré-oportunidade aceita) | Nao (NULL) | `instagram` |
| Webhook de entrada | Nao (NULL) | `webhook` ou valor do body |
| Meta Lead Ads | Nao (NULL) | `meta_ads` |
| Email (se existir) | Nao (NULL) | `email` |

A tabela `oportunidades` **não possui coluna `origem`** — apenas `utm_source`. E o contato tem `origem`, mas o RPC do breakdown olha apenas `utm_source` da oportunidade.

## Solucao

Criar uma coluna `origem` na tabela `oportunidades` que é **sempre preenchida** em todos os fluxos de criação. O RPC `fn_breakdown_canal_funil` passará a usar `COALESCE(utm_source, origem, 'direto')` para determinar o canal, priorizando UTM quando existir mas usando a origem como fallback.

## Etapas de Implementacao

### 1. Migration: Adicionar coluna `origem` em oportunidades
- Adicionar coluna `origem VARCHAR(50) DEFAULT 'manual'`
- Backfill: popular oportunidades existentes com base no `contato.origem` vinculado (JOIN)
- Atualizar `fn_breakdown_canal_funil` para usar `COALESCE(NULLIF(TRIM(utm_source), ''), origem, 'direto')` como chave de canal

### 2. Atualizar todos os fluxos de criacao de oportunidade

**Frontend — Modal manual** (`negocios.api.ts`):
- Adicionar `origem: 'manual'` no insertData (sempre)

**Frontend — Pre-oportunidade aceita** (`pre-oportunidades.api.ts`):
- Adicionar `origem: 'whatsapp'` no insert (já se sabe que vem do WhatsApp pelo fluxo)

**Edge Function — `webhook-entrada`**:
- Ao criar oportunidade (se aplicável via trigger), garantir que `origem` seja populado. Atualmente o webhook só cria contato, e a oportunidade é criada via trigger/automação. Precisamos validar o fluxo.
- Se o webhook cria contato com `origem: 'webhook'`, a coluna da oportunidade deve herdar isso.

**Edge Function — `meta-leadgen-webhook`**:
- Adicionar `utm_source: 'meta_ads'` no INSERT da oportunidade (linha 170-180)

**Edge Function — `processar-submissao-formulario`**:
- Adicionar `origem: 'formulario'` no INSERT da oportunidade (linha 619-631). O utm_source já é populado quando presente na submissão.

### 3. Atualizar trigger `aplicar_config_pipeline_oportunidade`
O trigger não precisa de alteração pois ele apenas modifica responsável e tarefas, não cria a oportunidade.

### 4. Atualizar o RPC `fn_breakdown_canal_funil`
Trocar a lógica de agrupamento:

De:
```sql
COALESCE(NULLIF(TRIM(utm_source), ''), 'direto') AS canal
```

Para:
```sql
COALESCE(NULLIF(TRIM(utm_source), ''), origem, 'direto') AS canal
```

Isso garante: UTM tem prioridade, depois origem, depois fallback "direto".

## Secao Tecnica

**Arquivos a editar:**
- `supabase/migrations/xxx_add_origem_oportunidades.sql` — nova coluna + backfill + RPC atualizado
- `src/modules/negocios/services/negocios.api.ts` — adicionar `origem: 'manual'`
- `src/modules/negocios/services/pre-oportunidades.api.ts` — adicionar `origem: 'whatsapp'`
- `supabase/functions/meta-leadgen-webhook/index.ts` — adicionar `utm_source: 'meta_ads'`
- `supabase/functions/processar-submissao-formulario/index.ts` — adicionar `origem: 'formulario'`
- `supabase/functions/webhook-entrada/index.ts` — verificar se cria oportunidade, se sim adicionar `origem: 'webhook'`

**Valores possiveis de `origem`:**
`manual`, `whatsapp`, `instagram`, `formulario`, `webhook`, `meta_ads`, `importacao`, `email`, `indicacao`

**Backfill SQL:**
```sql
UPDATE oportunidades o
SET origem = COALESCE(c.origem, 'manual')
FROM contatos c
WHERE o.contato_id = c.id
  AND o.origem IS NULL;
```
