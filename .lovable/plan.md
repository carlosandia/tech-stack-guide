
# Mover oportunidades para outra pipeline

## Objetivo

Permitir que ao clicar em "Mover" na barra de acoes em massa, o usuario possa escolher entre:
1. **Mover para etapa** da pipeline atual (comportamento existente)
2. **Mover para outra pipeline** - selecionar pipeline e depois a etapa de destino

## UI proposta

O dropdown do botao "Mover" sera reorganizado em duas secoes:

```text
+----------------------------------+
| Mover para:                      |
|----------------------------------|
| PIPELINE ATUAL                   |
|  * Novos Negocios                |
|  * Contatado                     |
|  * Agendado                      |
|----------------------------------|
| OUTRA PIPELINE                   |
|  > Vendas - Organica & Tr...     |
|  > Teste de Pipeline             |
+----------------------------------+
```

Ao clicar em outra pipeline, o dropdown expande para mostrar as etapas dela:

```text
+----------------------------------+
| < Voltar                         |
| Pipeline: Teste de Pipeline      |
|----------------------------------|
|  * Novos Negocios                |
|  * Qualificacao                  |
|  * Proposta                      |
+----------------------------------+
```

## Alteracoes tecnicas

### 1. `negocios.api.ts` - Nova funcao

Adicionar `moverOportunidadesParaOutraPipeline(ids, funilDestinoId, etapaDestinoId)` que faz update de `funil_id` e `etapa_id` simultaneamente.

### 2. `useKanban.ts` - Novo hook

Criar `useMoverOportunidadesParaOutraPipeline()` com mutation que invalida kanban de ambas as pipelines.

### 3. `OportunidadeBulkActions.tsx` - UI do dropdown

- Adicionar estado `selectedPipeline` para controlar navegacao no dropdown (null = lista principal, string = mostrando etapas da pipeline)
- Usar `useFunis()` para listar pipelines disponiveis (excluindo a atual)
- Usar `useFunilComEtapas()` para carregar etapas da pipeline selecionada
- Adicionar prop `funilAtualId` para saber qual pipeline excluir da lista
- Adicionar prop `onMoverParaOutraPipeline(funilId, etapaId)` 

### 4. `KanbanBoard.tsx` - Conectar novo handler

- Passar `funilAtualId` e novo handler `onMoverParaOutraPipeline` para o componente de bulk actions
- Implementar `handleMoverParaOutraPipeline` usando o novo hook
