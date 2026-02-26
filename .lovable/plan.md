

# Plano: Adicionar card "Agendadas" nos Indicadores de Reuniões

## O que falta

O componente `IndicadoresReunioes.tsx` já recebe `funil.reunioes_agendadas` nos dados, mas não exibe um card com essa quantidade. Precisa adicionar como primeiro card da seção para contextualizar todos os demais indicadores.

## Alteração

**Arquivo:** `src/modules/app/components/dashboard/IndicadoresReunioes.tsx`

- Adicionar um card "Agendadas" como primeiro item do array `cards`, com:
  - Icone: `CalendarCheck` (lucide)
  - Cor: azul (`text-primary` / `bg-primary/10`)
  - Valor: `funil.reunioes_agendadas`
  - Tooltip: "Total de reuniões agendadas no período selecionado."
- Ajustar o grid para 6 colunas em telas grandes (`lg:grid-cols-6`) para acomodar o novo card

Nenhuma alteração em banco, types ou services — o dado já está disponível.
