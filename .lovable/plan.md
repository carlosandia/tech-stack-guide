
# Correção de Texto e Migração de Oportunidades na Exclusão de Pipeline

## Problema Identificado
1. **Bug de texto**: O código atual concatena `será` + `ão` resultando em "seráão" (incorreto). Deve ser "serão".
2. **UX incompleta**: Ao excluir uma pipeline com oportunidades, o sistema apenas avisa e exclui tudo. Grandes SaaS oferecem a opção de migrar as oportunidades para outra pipeline.

## Solução Proposta

### 1. Corrigir o texto (PipelineSelector.tsx, linha 151)
Alterar de:
```
que será{count > 1 ? 'ão' : ''} excluída{count > 1 ? 's' : ''}
```
Para:
```
que {count > 1 ? 'serão' : 'será'} excluída{count > 1 ? 's' : ''}
```

### 2. Novo modal de exclusão com opção de migração

Quando a pipeline contém oportunidades, o modal de confirmação passa a oferecer **duas opções**:

```text
+------------------------------------------+
|  [!] Excluir pipeline                    |
|                                          |
|  Tem certeza que deseja excluir          |
|  "TesteMilion2"?                         |
|                                          |
|  Esta pipeline contém 2 oportunidades.   |
|                                          |
|  O que fazer com as oportunidades?       |
|                                          |
|  (o) Migrar para outra pipeline          |
|      [ Selecione uma pipeline   v ]      |
|                                          |
|  ( ) Excluir todas as oportunidades      |
|      Esta ação não pode ser desfeita.    |
|                                          |
|  [Cancelar]  [Confirmar]                 |
+------------------------------------------+
```

- **Migrar**: Dropdown lista as demais pipelines ativas. Ao confirmar, move as oportunidades para a etapa de entrada da pipeline destino e depois exclui a pipeline original.
- **Excluir tudo**: Comportamento atual (exclusão destrutiva).
- Se a pipeline **não tem oportunidades**, mantém o modal simples atual (apenas corrigido).

### Detalhes Tecnicoss

**Arquivo**: `src/modules/negocios/components/toolbar/PipelineSelector.tsx`
- Expandir o state `confirmDelete` para incluir `acao: 'migrar' | 'excluir'` e `pipelineDestinoId`
- Adicionar radio buttons e dropdown de pipeline destino no modal
- Usar a lista de `funis` (prop existente) para popular o dropdown, filtrando a pipeline sendo excluída

**Arquivo**: `src/modules/negocios/services/negocios.api.ts`
- Criar função `migrarOportunidadesParaPipeline(funilOrigemId, funilDestinoId)` que:
  1. Busca a etapa de entrada do funil destino
  2. Move todas as oportunidades do funil origem para essa etapa
  3. Exclui o funil origem

**Arquivo**: `src/modules/negocios/hooks/useFunis.ts`
- Criar hook `useMigrarEExcluirFunil()` que chama a nova API e invalida as queries

**Arquivo**: `src/modules/negocios/pages/NegociosPage.tsx`
- Atualizar o handler `onExcluir` para aceitar opcionalmente o `pipelineDestinoId`
- Se informado, chamar migração antes da exclusão

### Fluxo de Migração
1. Usuario clica em excluir pipeline com oportunidades
2. Modal exibe as duas opções (migrar ou excluir)
3. Se "Migrar" selecionado, mostra dropdown com pipelines ativas
4. Ao confirmar, sistema reutiliza a lógica existente de `moverOportunidadesParaOutraPipeline` (que já faz reset de campos, criação de tarefas automáticas e re-qualificação MQL)
5. Após migração bem-sucedida, exclui a pipeline original
6. Toast de sucesso: "Pipeline excluída. X oportunidades migradas para [nome]."
