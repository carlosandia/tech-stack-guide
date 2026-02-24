
# Filtrar Tarefas por Pipeline Atual

## Contexto

Cada tarefa automatica tem `etapa_origem_id` que pertence a uma pipeline especifica. Quando uma oportunidade muda de pipeline, as tarefas da pipeline anterior devem ser **mantidas no banco** (auditoria) mas **ocultadas na interface**. Apenas tarefas da pipeline atual (ou tarefas manuais sem etapa) devem aparecer.

## Locais Afetados

### 1. API de listagem de tarefas (detalhes.api.ts)

- `listarTarefas(oportunidadeId, funilId)` recebera o `funilId` como parametro
- Antes de retornar, buscar as etapas do funil atual e filtrar: so retornar tarefas onde `etapa_origem_id` pertence ao funil atual OU `etapa_origem_id` e null (tarefas manuais)

### 2. Hook useDetalhes.ts

- `useTarefasOportunidade(oportunidadeId, funilId)` recebera funilId
- Query key incluira funilId para invalidacao correta

### 3. DetalhesAbas.tsx

- Recebera nova prop `funilId` e repassara para AbaTarefas

### 4. AbaTarefas.tsx

- Recebera `funilId` e passara para o hook `useTarefasOportunidade`

### 5. DetalhesOportunidadeModal.tsx

- Ja tem `funilId` via props -- passara para DetalhesAbas

### 6. TarefasPopover.tsx (card do Kanban)

- Recebera `funilId` como prop
- Ao carregar tarefas, primeiro buscar etapas do funil, depois filtrar tarefas por essas etapas
- Contagem ja sera correta pois vem do Kanban que e por funil

### 7. Contagem de tarefas no Kanban (negocios.api.ts)

- Na query de tarefas para contagem (linhas 370-390), adicionar join/filtro por `etapa_origem_id` pertencente as etapas do funil atual, ou `etapa_origem_id` nulo
- Isso garante que o badge "2/5" no card reflita apenas tarefas da pipeline visivel

## Logica de Filtro

```text
Exibir tarefa SE:
  - etapa_origem_id IS NULL (tarefa manual, sem vinculo a etapa)
  - OU etapa_origem_id pertence a uma etapa do funil_id atual
```

## Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/negocios/services/detalhes.api.ts` | `listarTarefas` recebe `funilId`, filtra por etapas do funil |
| `src/modules/negocios/hooks/useDetalhes.ts` | Hook recebe e propaga `funilId` |
| `src/modules/negocios/components/detalhes/DetalhesAbas.tsx` | Nova prop `funilId`, repassa a AbaTarefas |
| `src/modules/negocios/components/detalhes/AbaTarefas.tsx` | Recebe `funilId`, passa ao hook |
| `src/modules/negocios/components/detalhes/DetalhesOportunidadeModal.tsx` | Passa `funilId` para DetalhesAbas |
| `src/modules/negocios/components/kanban/TarefasPopover.tsx` | Recebe `funilId`, filtra tarefas ao carregar |
| `src/modules/negocios/components/kanban/KanbanCard.tsx` | Passa `funilId` para TarefasPopover |
| `src/modules/negocios/services/negocios.api.ts` | Contagem de tarefas filtra por etapas do funil |

## Resultado

- Tarefas de pipelines anteriores ficam preservadas no banco (auditoria completa)
- Interface mostra apenas tarefas relevantes ao contexto atual
- Sem poluicao visual ao transitar entre pipelines
- Contagem no card do Kanban reflete corretamente
