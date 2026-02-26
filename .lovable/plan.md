
# Correção: LEADS deve contar Oportunidades, não Contatos

## Problema identificado

A função `fn_metricas_funil` no Supabase conta **contatos criados** como "Leads". Isso e incorreto para um funil de vendas porque:

- Contatos existem independentemente de pipelines
- Um contato pode nunca ter entrado em nenhum funil
- Infla o numero real do topo do funil (ex: 251 leads vs 1 ganho = taxa irreal)

## Como CRMs profissionais funcionam

| CRM | "Lead" no funil = |
|---|---|
| HubSpot | Deals created in pipeline |
| Pipedrive | Deals added in period |
| RD Station CRM | Oportunidades criadas no funil |
| Salesforce | Opportunities entering stage |

**Consenso**: Lead no funil de vendas = **oportunidade criada no periodo, dentro da pipeline filtrada**.

## Solucao

### 1. Alterar a funcao `fn_metricas_funil` no Supabase

Substituir a subquery de `total_leads` para contar **oportunidades** em vez de contatos:

```sql
'total_leads', (
  SELECT COUNT(DISTINCT o.id)
  FROM oportunidades o
  WHERE o.organizacao_id = p_organizacao_id
    AND o.criado_em >= p_periodo_inicio
    AND o.criado_em <= p_periodo_fim
    AND o.deletado_em IS NULL
    AND (p_funil_id IS NULL OR o.funil_id = p_funil_id)
    AND (p_canal IS NULL OR o.utm_source = p_canal)
)
```

Isso garante:
- Filtra pela pipeline selecionada (p_funil_id)
- Filtra pelo canal se aplicavel
- Respeita soft delete
- Conta oportunidades unicas criadas no periodo

### 2. Verificar o erro visivel na screenshot

A screenshot mostra um erro de runtime ("The app encountered an error"). Sera investigado nos logs do console para identificar se esta relacionado ao componente de breakdown canal ou outro componente.

## Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| Supabase function `fn_metricas_funil` | Alterar subquery `total_leads` de contatos para oportunidades |

## Impacto

- Os numeros de "Leads" passarao a refletir oportunidades reais no funil
- As taxas de conversao (Lead para MQL, Lead para Fechado) ficarao mais realistas
- Compativel com a logica ja usada em MQL, SQL, Reunioes e Fechados (todos baseados em oportunidades)
