

## Corrigir KPI "Histórico de Oportunidades" para contar Eventos/Atividades

### Problema

O KPI atualmente conta **oportunidades (cards)** no banco, mostrando "9". O usuário quer que conte **eventos de atividade** (audit_log) -- movimentações, tarefas criadas, reuniões, anotações, etc. Apenas 2 oportunidades já somam 41 eventos no timeline.

### Solução

Trocar a métrica para contar registros na tabela `audit_log` no período selecionado, vinculados a oportunidades não-deletadas do tenant/funil.

### Alterações

**1. Migration SQL -- Atualizar `fn_dashboard_metricas_gerais`**

Substituir a query de `v_total_historico` (que conta oportunidades) por uma contagem de `audit_log`:

```sql
-- ANTES: conta oportunidades
SELECT COUNT(*) INTO v_total_historico
FROM oportunidades WHERE ...

-- DEPOIS: conta eventos de atividade no período
SELECT COUNT(*) INTO v_total_historico
FROM audit_log al
WHERE al.organizacao_id = p_organizacao_id
  AND al.criado_em >= p_periodo_inicio
  AND al.criado_em <= p_periodo_fim
  AND al.entidade = 'oportunidades'
  AND EXISTS (
    SELECT 1 FROM oportunidades o
    WHERE o.id = al.entidade_id
      AND o.deletado_em IS NULL
      AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
  );
```

Fazer o mesmo para `v_total_periodo` (período anterior para variação) -- na verdade `v_total_historico` passa a ser o total do período atual, e `v_total_periodo` pode manter a mesma lógica ou ser removido (pois agora são a mesma coisa).

Simplificação: como agora ambos medem o mesmo conceito (atividades no período), unificar:
- `total_oportunidades_historico` = contagem de audit_log no período atual
- `total_oportunidades_periodo` = mesma contagem (manter para compatibilidade com variação)

**2. Frontend -- `KPIsSecundarios.tsx`**

- Renomear label: "Histórico de Oportunidades" → "Atividades no Período"
- Trocar ícone para `History` (mais semântico)
- Atualizar tooltip: "Total de eventos registrados nas oportunidades no período selecionado (movimentações, tarefas, reuniões, anotações, etc.). A variação compara com o período anterior."

**3. Tipo frontend -- `relatorio.types.ts`**

Nenhuma alteração necessária no tipo -- os campos `total_oportunidades_historico` e `total_oportunidades_periodo` continuam existindo, apenas mudam o que representam.

### Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Nova migration atualizando `fn_dashboard_metricas_gerais` |
| `src/modules/app/components/dashboard/KPIsSecundarios.tsx` | Label, ícone e tooltip |

### Observação sobre audit_log

A tabela `audit_log` registra eventos de diversas entidades (oportunidades, anotações, tarefas, reuniões, documentos, emails, contatos). A coluna `entidade_id` para registros de anotações, tarefas, reuniões e documentos aponta para o `oportunidade_id` (não para o ID da própria entidade). Isso significa que a query `WHERE entidade_id IN (oportunidades não-deletadas)` captura corretamente todos os eventos vinculados a oportunidades ativas, incluindo sub-entidades.

