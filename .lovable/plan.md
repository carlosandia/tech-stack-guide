

# Protecao contra exclusao de itens globais vinculados a pipelines + Correcao do Select

## Contexto

Atualmente, ao excluir um Campo, Etapa, Tarefa, Motivo ou Regra de Qualificacao nas configuracoes globais, nao ha verificacao se o item esta vinculado a alguma pipeline. Isso pode causar dados orfaos e inconsistencias. Alem disso, o dropdown `<select>` para campos do tipo "select" nao abre corretamente dentro do modal de criacao de oportunidade.

## Tabelas de vinculo por entidade

| Entidade Global | Tabela de Vinculo | Chave |
|---|---|---|
| Campo customizado | `funis_campos` | `campo_id` |
| Etapa template | `etapas_funil` | `etapa_template_id` (via campo `etapa_template_id` na etapa) |
| Tarefa template | `funis_etapas_tarefas` | `tarefa_template_id` |
| Motivo | `funis_motivos` | `motivo_id` |
| Regra qualificacao | `funis_regras_qualificacao` | `regra_id` |

## Solucao

### 1. Funcoes de verificacao de vinculos (configuracoes.api.ts)

Criar funcoes que consultam as tabelas de vinculo e retornam os nomes das pipelines onde cada item esta vinculado:

- `buscarVinculosCampo(campoId)` - consulta `funis_campos` join `funis`
- `buscarVinculosEtapa(etapaTemplateId)` - consulta `etapas_funil` onde `etapa_template_id` = id, join `funis`
- `buscarVinculosTarefa(tarefaTemplateId)` - consulta `funis_etapas_tarefas` join etapa join `funis`
- `buscarVinculosMotivo(motivoId)` - consulta `funis_motivos` join `funis`
- `buscarVinculosRegra(regraId)` - consulta `funis_regras_qualificacao` join `funis`

Cada funcao retorna `{ funil_id: string, funil_nome: string }[]`.

### 2. Hook generico (useVinculosPipelines.ts)

Criar um hook `useVinculosPipelines(tipo, itemId)` que chama a funcao correta baseado no tipo e retorna os vinculos. Ativado apenas quando `itemId` existe (modo edicao).

### 3. Protecao nos modais de edicao

Em cada modal, quando houver vinculos ativos:

- **Botao "Excluir" fica desabilitado**
- **Mensagem informativa** aparece no lugar da confirmacao: "Este item esta vinculado a X pipeline(s): [nomes]. Desvincule-o de todas as pipelines antes de excluir."
- **Badge visual** discreto no topo do modal indicando "Vinculado a N pipeline(s)"

Modais afetados:
- `CampoFormModal.tsx` - verifica `funis_campos`
- `EtapaTemplateFormModal.tsx` - verifica `etapas_funil`
- `TarefaTemplateFormModal.tsx` - verifica `funis_etapas_tarefas`
- `MotivoFormModal.tsx` - verifica `funis_motivos`
- `RegraFormModal.tsx` - verifica `funis_regras_qualificacao`

### 4. Badge na listagem de campos (CamposList.tsx)

Para campos customizados, buscar vinculos e exibir um badge pequeno ao lado do tipo (ex: "2 pipelines") com tooltip listando os nomes.

### 5. Correcao do Select dropdown (ContatoInlineForm.tsx)

Substituir o `<select>` nativo com `appearance-none` (que nao abre dentro de modais com z-index alto) por um componente `Popover` + lista clicavel, identico ao padrao ja usado para `multi_select` no mesmo arquivo. O `PopoverContent` do Radix usa portal por padrao, resolvendo o problema de z-index.

## Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/modules/configuracoes/services/configuracoes.api.ts` | 5 funcoes de busca de vinculos |
| `src/modules/configuracoes/hooks/useVinculosPipelines.ts` | Novo hook generico |
| `src/modules/configuracoes/components/campos/CampoFormModal.tsx` | Bloquear exclusao se vinculado + badge |
| `src/modules/configuracoes/components/campos/CamposList.tsx` | Badge de pipelines vinculadas |
| `src/modules/configuracoes/components/etapas/EtapaTemplateFormModal.tsx` | Bloquear exclusao se vinculado |
| `src/modules/configuracoes/components/tarefas/TarefaTemplateFormModal.tsx` | Bloquear exclusao se vinculado |
| `src/modules/configuracoes/components/motivos/MotivoFormModal.tsx` | Bloquear exclusao se vinculado |
| `src/modules/configuracoes/components/regras/RegraFormModal.tsx` | Bloquear exclusao se vinculado |
| `src/modules/negocios/components/modals/ContatoInlineForm.tsx` | Substituir `<select>` por Popover |

## Comportamento esperado

- Ao abrir qualquer modal de edicao, o sistema consulta automaticamente os vinculos
- Se existirem vinculos, exibe badge informativo e bloqueia exclusao com mensagem clara
- Se nao existirem vinculos, comportamento normal de exclusao com confirmacao
- O dropdown de campos select no modal de oportunidade abre corretamente via Popover/Portal

