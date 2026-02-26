

## Correção do Funil de Conversão + Tooltips Explicativos

### 1. Corrigir contagem de reuniões (SQL)

**Arquivo:** Nova migration SQL para `fn_metricas_funil`

- `reunioes_agendadas`: trocar `COUNT(DISTINCT r.id)` por `COUNT(DISTINCT r.oportunidade_id)` -- 1 por oportunidade
- `reunioes_realizadas`: idem

### 2. Corrigir cadeia de conversão no backend

**Arquivo:** `backend/src/services/relatorio.service.ts`

- Renomear `sql_para_reuniao_agendada` para `lead_para_reuniao_agendada`
- Calcular como: `reunioes_agendadas / total_leads`

**Arquivo:** `backend/src/schemas/relatorio.ts`

- Renomear campo no schema Zod

### 3. Atualizar tipo no frontend

**Arquivo:** `src/modules/app/types/relatorio.types.ts`

- `sql_para_reuniao_agendada` vira `lead_para_reuniao_agendada` na interface `Conversoes`

### 4. Atualizar FunilConversao.tsx -- referências + tooltips

**Arquivo:** `src/modules/app/components/dashboard/FunilConversao.tsx`

Alterações na etapa R. Agendadas (linha ~127):
- `taxa: dadosEfetivos.conversoes.lead_para_reuniao_agendada` (era `sql_para_reuniao_agendada`)

Tooltips atualizados com explicação do cálculo:

| Etapa | Tooltip atual | Tooltip novo |
|-------|--------------|--------------|
| **Leads** | "Total de oportunidades criadas..." | "Total de oportunidades criadas no período e funil selecionado. Base de cálculo (100%) para todas as taxas de conversão do funil." |
| **MQLs** | "Marketing Qualified Leads..." | "Marketing Qualified Leads -- leads que atenderam critérios de qualificação de marketing. Cálculo: MQLs / Leads x 100." |
| **SQLs** | "Sales Qualified Leads..." | "Sales Qualified Leads -- leads validados pela equipe comercial para abordagem de vendas. Cálculo: SQLs / Leads x 100." |
| **R. Agendadas** | "Reuniões agendadas com leads qualificados..." | "Oportunidades distintas com pelo menos 1 reunião agendada (múltiplas reuniões no mesmo card contam como 1). Cálculo: Oportunidades com reunião agendada / Leads x 100." |
| **R. Realizadas** | "Reuniões que foram efetivamente realizadas..." | "Oportunidades distintas com pelo menos 1 reunião realizada (múltiplas reuniões no mesmo card contam como 1). Cálculo: Oportunidades com reunião realizada / Leads x 100." |
| **Ganhos** | "Negócios fechados com sucesso..." (mantém CAC/ROMI) | "Negócios fechados com sucesso. Cálculo: Ganhos / Leads x 100. CAC: Investido / Ganhos. ROMI: (Receita - Investido) / Investido x 100." |

### 5. Setas entre etapas

As setas já mostram a taxa etapa-a-etapa (ex: MQLs->SQLs). Será adicionado no tooltip da seta (se existir) ou mantido como está, pois o recálculo dinâmico já cuida disso.

### Resultado esperado

Com 9 leads, 1 MQL, 1 oportunidade com 3 reuniões agendadas e 1 realizada:
- **Leads**: 9 (100%)
- **MQLs**: 1 (11.1%)
- **R. Agendadas**: 1 (11.1%) -- antes mostrava 3
- **R. Realizadas**: 1 (11.1%) -- antes mostrava inconsistente
- **Ganhos**: depende dos fechamentos

Cada tooltip com `(?)` explica exatamente como o número é calculado.

### Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Nova migration: fn_metricas_funil com COUNT(DISTINCT oportunidade_id) |
| `backend/src/services/relatorio.service.ts` | lead_para_reuniao_agendada |
| `backend/src/schemas/relatorio.ts` | Renomear campo no schema |
| `src/modules/app/types/relatorio.types.ts` | Renomear no tipo Conversoes |
| `src/modules/app/components/dashboard/FunilConversao.tsx` | Referência + tooltips explicativos |

