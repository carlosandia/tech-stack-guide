

# Configuracao de Etapas Visiveis no Funil de Conversao

## Conceito

Adicionar um botao sutil (icone de engrenagem/filtro) no header do bloco "Funil de Conversao" que abre um Popover com switches para cada etapa intermediaria. **Leads e Ganhos ficam sempre visiveis** (sao as ancoras do funil). As etapas configuraveis sao: MQLs, SQLs, R. Agendadas e R. Realizadas.

## Recalculo Inteligente de Conversoes

Quando o usuario oculta etapas intermediarias, as taxas de conversao sao recalculadas automaticamente entre as etapas **adjacentes visiveis**:

```text
Exemplo: Usuario oculta MQLs e SQLs

Antes:  Leads → MQLs → SQLs → R.Agendadas → R.Realizadas → Ganhos
         7      1       0       3              1              1
        100%   14.3%    0%      —             33.3%          100%

Depois: Leads → R.Agendadas → R.Realizadas → Ganhos
         7       3              1              1
        100%    42.9%          33.3%          100%

Taxa recalculada: 3/7 = 42.9% (Leads direto para R.Agendadas)
```

**Regra:** A taxa de cada etapa visivel e calculada como `valor_atual / valor_etapa_visivel_anterior * 100`. A conversao geral (Leads para Ganhos) permanece inalterada.

Os custos de investimento tambem se recalculam: se o usuario oculta MQLs, o custo/MQL simplesmente nao aparece, mas CPL e CAC continuam corretos pois dependem de Leads e Ganhos.

## Interface

- Icone `SlidersHorizontal` discreto ao lado do titulo "Funil de Conversao"
- Popover com 4 switches (MQLs, SQLs, R. Agendadas, R. Realizadas)
- Badge indicando quantas etapas estao ocultas (ex: "2 ocultas")
- Animacao suave ao ocultar/exibir cards

## Persistencia

Utilizar o mesmo padrao do `useDashboardDisplay` — salvar no `localStorage` com chave dedicada e persistir no Supabase (tabela `preferencias_dashboard`, campo `config_exibicao`) para sincronizar entre dispositivos.

## Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `src/modules/app/components/dashboard/FunilConversao.tsx` | Adicionar popover de config, logica de filtragem e recalculo de taxas |
| `src/modules/app/hooks/useFunilEtapasConfig.ts` | **Novo** — Hook dedicado para persistir quais etapas estao visiveis |

## Detalhes Tecnicos

### Hook `useFunilEtapasConfig`
- Estado: `Record<string, boolean>` com keys `mqls`, `sqls`, `reunioes_agendadas`, `reunioes_realizadas`
- Default: todas `true`
- Persiste em `localStorage` key `funil_etapas_config`
- Persiste no Supabase via `preferencias_dashboard.config_exibicao` (campo aninhado `funil_etapas`)

### Logica de recalculo no `FunilConversao.tsx`
- Filtrar `etapas[]` pelas visiveis
- Para cada etapa visivel (exceto a primeira), calcular `taxa = (valor / valorEtapaAnteriorVisivel) * 100`
- Conversao geral permanece `lead_para_fechado` (inalterada)

