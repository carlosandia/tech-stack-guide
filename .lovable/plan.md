

# Linha Visual de Horario Comercial no Heatmap

## Objetivo

Adicionar uma indicacao visual sutil no heatmap de Pico de Atendimento que diferencie **horario comercial** de **fora do expediente**, com base nas configuracoes do tenant (`horario_comercial_inicio`, `horario_comercial_fim` e `dias_uteis`).

## Abordagem Visual

- **Celulas fora do horario comercial**: recebem `opacity-40` (reduzidas visualmente) e um fundo levemente diferente quando vazias (`bg-muted/10` ao inves de `bg-muted/30`)
- **Celulas dentro do horario comercial**: permanecem como estao (100% opacidade)
- **Linha divisoria vertical sutil**: bordas `border-l` com cor `border-border` nas colunas correspondentes ao inicio e fim do horario comercial, criando uma "faixa" visual
- **Dias nao uteis** (ex: Sab/Dom se nao configurados): linha inteira com opacidade reduzida
- **Legenda no footer**: pequeno indicador "Horario comercial: 08h-18h" ao lado da legenda de cores existente

## Dados Utilizados

O hook `useConfigTenant` (ja existente) retorna `horario_comercial_inicio` (ex: "08:00"), `horario_comercial_fim` (ex: "18:00") e `dias_uteis` (ex: `[1,2,3,4,5]`). Defaults: 08:00-18:00, Seg-Sex.

## Arquivo Modificado

**`src/modules/app/components/dashboard/HeatmapAtendimento.tsx`**

Alteracoes:
1. Importar `useConfigTenant` do modulo de configuracoes
2. Extrair `horaInicio` e `horaFim` (parse do "HH:MM" para numero inteiro da hora)
3. Extrair `diasUteis` (array de numeros 0-6)
4. Na renderizacao de cada celula, verificar se `hora >= horaInicio && hora < horaFim && diasUteis.includes(dia)` — se **fora**, aplicar `opacity-40`
5. Nas colunas de hora do header, adicionar `border-l-2 border-primary/20` na hora de inicio e `border-r-2 border-primary/20` na hora de fim para criar a faixa visual
6. No footer, adicionar texto indicativo: "Horario comercial: 08h–18h · Seg a Sex"

## Resultado Esperado

O usuario visualiza claramente que as conversas fora do expediente aparecem "esmaecidas", enquanto o horario comercial fica em destaque natural — sem poluir a interface, apenas reduzindo a enfase visual do que esta fora do horario configurado.

