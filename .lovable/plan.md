
# Plano de Unificacao: Remover `origem` e usar `utm_source` como campo unico

## Problema Atual

Existem dois campos na tabela `oportunidades` que servem o mesmo proposito:
- `origem` — preenchido manualmente pelo usuario no modal
- `utm_source` — preenchido automaticamente por formularios e integracoes (Meta Ads, etc.)

A funcao SQL `fn_canal_match` usa `COALESCE(NULLIF(TRIM(utm_source), ''), origem, 'direto')` para tentar unificar, mas isso gera confusao: o usuario preenche "Panfleto" no campo `origem`, mas o relatorio filtra por `utm_source` primeiro.

## Estrategia

Unificar tudo em `utm_source`. O label na UI continua sendo "Origem". A coluna `origem` da tabela `oportunidades` sera removida.

**Nota:** a coluna `origem` da tabela `contatos` NAO sera alterada — ela tem outro proposito (rastrear de onde o contato veio: whatsapp, instagram, formulario, manual). Contatos e oportunidades sao contextos diferentes.

---

## Alteracoes

### 1. Migration SQL

- **Backfill**: copiar `origem` para `utm_source` onde `utm_source IS NULL` e `origem IS NOT NULL`
- **Drop column**: remover `oportunidades.origem`
- **Atualizar trigger**: `herdar_origem_contato_oportunidade` passa a escrever em `utm_source` (herdando de `contatos.origem`)
- **Simplificar RPCs**: `fn_metricas_funil` e `fn_breakdown_canal_funil` usam `COALESCE(NULLIF(TRIM(utm_source), ''), 'direto')` sem mencionar `origem`

### 2. Frontend — Criar oportunidade (`NovaOportunidadeModal.tsx`)

- O campo `OrigemCombobox` continua igual (label "Origem")
- No submit, salvar o valor selecionado em `utm_source` em vez de `origem`

### 3. Frontend — API (`negocios.api.ts`)

- `criarOportunidade`: payload usa `utm_source` em vez de `origem`
- Interface `Oportunidade`: remover campo `origem`

### 4. Frontend — Modal detalhes (`DetalhesCampos.tsx`)

- Exibir `oportunidade.utm_source` como "Origem" (campo principal)
- Exibir `utm_medium` e `utm_campaign` como subtexto quando presentes
- Remover referencia a `oportunidade.origem`

### 5. Frontend — Filtros Kanban (`FiltrosPopover.tsx` + `NegociosPage.tsx`)

- O filtro de "Origem" no Kanban atualmente filtra por `contato.origem` — manter assim (faz sentido para o Kanban)
- Nenhuma alteracao necessaria aqui

### 6. Frontend — Tooltip do Funil (`FunilConversao.tsx`)

- Atualizar texto do popover informativo: onde diz "selecione a Origem correta no card do negocio", manter igual (o label continua "Origem")
- O alerta de canal sem leads ja esta correto

### 7. Backend — Services que criam oportunidades

- `submissoes-formularios.service.ts`: ja seta `utm_source` + `origem: 'formulario'` — remover o `origem`
- `pre-oportunidades.api.ts` (frontend): seta `origem: 'whatsapp'` — mudar para `utm_source: 'whatsapp'`

## Detalhes Tecnicos

### Migration SQL (resumo)

```text
1. UPDATE oportunidades SET utm_source = origem WHERE utm_source IS NULL AND origem IS NOT NULL AND origem != 'manual'
2. ALTER TABLE oportunidades DROP COLUMN origem
3. CREATE OR REPLACE FUNCTION herdar_origem_contato_oportunidade() — escreve em utm_source
4. CREATE OR REPLACE FUNCTION fn_metricas_funil() — COALESCE(NULLIF(TRIM(utm_source), ''), 'direto')
5. CREATE OR REPLACE FUNCTION fn_breakdown_canal_funil() — idem
```

### Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/migrations/new.sql` | Backfill + drop column + RPCs |
| `src/modules/negocios/services/negocios.api.ts` | `criarOportunidade` usa `utm_source`; remove `origem` da interface |
| `src/modules/negocios/components/modals/NovaOportunidadeModal.tsx` | Submit salva em `utm_source` |
| `src/modules/negocios/components/detalhes/DetalhesCampos.tsx` | Exibe `utm_source` como "Origem" |
| `src/modules/negocios/services/pre-oportunidades.api.ts` | `origem` -> `utm_source` |
| `backend/src/services/submissoes-formularios.service.ts` | Remove `origem` do insert de oportunidades |
| `backend/src/services/relatorio.service.ts` | Nenhuma alteracao (usa RPCs) |
