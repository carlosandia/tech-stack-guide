
# Tooltips informativos nas Métricas + Remover cor do cifrão no card

## Resumo

Duas alterações:
1. **Métricas do Kanban**: Adicionar ícone `(i)` ao lado de cada label com tooltip explicando o cálculo de cada métrica de forma clara
2. **Card do Kanban**: Remover a cor verde do ícone `$` de valor, deixando igual aos demais ícones (`text-muted-foreground`)

## Alterações

### Arquivo 1: `src/modules/negocios/components/toolbar/MetricasPanel.tsx`

**Adicionar campo `tooltip` na interface `Metrica`** com textos explicativos para cada métrica:

| Métrica | Tooltip |
|---------|---------|
| Total | Número total de oportunidades em todas as etapas do funil, incluindo ganhas e perdidas |
| Abertas | Oportunidades que ainda estão em andamento no funil (não ganhas nem perdidas) |
| Ganhas | Oportunidades que foram movidas para a etapa de ganho (fechadas com sucesso) |
| Perdidas | Oportunidades que foram movidas para a etapa de perda (não convertidas) |
| Valor Pipeline | Soma dos valores de todas as oportunidades abertas (em andamento no funil) |
| Valor Ganho | Soma dos valores de todas as oportunidades ganhas (receita confirmada) |
| Ticket Médio | Valor médio por oportunidade ganha. Cálculo: Valor Ganho / Número de Ganhas |
| Conversão | Percentual de oportunidades ganhas sobre o total. Cálculo: (Ganhas / Total) x 100 |
| Forecast | Previsão de receita ponderada pela probabilidade de cada etapa. Considera apenas oportunidades abertas |
| Tempo Médio | Ciclo médio de venda das oportunidades ganhas, da criação até o fechamento |
| Estagnadas | Oportunidades abertas sem nenhuma atualização há mais de 7 dias |
| Vencendo 7d | Oportunidades abertas com previsão de fechamento nos próximos 7 dias |
| Atrasadas | Oportunidades abertas cuja previsão de fechamento já passou |

**Implementação**:
- Adicionar ícone `Info` do lucide-react (tamanho `w-3 h-3`, cor `text-muted-foreground`)
- Criar um componente `Tooltip` simples inline usando CSS (`group` + `group-hover:visible`) — sem dependência externa
- O ícone `(i)` fica ao lado do label, e ao passar o mouse (desktop) ou clicar (mobile) aparece o tooltip com fundo escuro e texto claro
- No desktop: tooltip aparece ao lado do label com `position: absolute`
- No mobile: funciona via `title` nativo como fallback

**Visual (desktop)**:
```text
[icon] Total (i)
       13
               ┌──────────────────────────────┐
               │ Número total de oportunidades │
               │ em todas as etapas do funil,  │
               │ incluindo ganhas e perdidas.  │
               └──────────────────────────────┘
```

### Arquivo 2: `src/modules/negocios/components/kanban/KanbanCard.tsx`

**Linha 186**: Remover `style={{ color: 'hsl(var(--success))' }}` do ícone `DollarSign`, substituindo por `className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground"` para ficar consistente com os demais ícones do card (contato, responsável, etc.).

## Detalhes Técnicos

- Nenhuma dependência nova será adicionada
- O tooltip será implementado via CSS puro usando classes Tailwind (`group`, `invisible`, `group-hover:visible`, `absolute`)
- Componente `MetricTooltip` interno ao arquivo, recebendo `text: string` como prop
- Z-index do tooltip: `z-50` para ficar acima de outros elementos
- Estilo do tooltip: `bg-popover text-popover-foreground text-xs rounded-md shadow-md border px-3 py-2 max-w-[220px]`
