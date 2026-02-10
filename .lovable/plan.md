
# Plano: Aplicar Regras da Pipeline na Criacao de Oportunidades

## Problemas Identificados

Ao analisar o banco de dados e o codigo, identifiquei **3 problemas concretos**:

### 1. Tarefas Automaticas NAO sao criadas via Edge Function
A funcao `processar-submissao-formulario` cria a oportunidade mas **nao executa** `criarTarefasAutomaticas`. A etapa "Novos Negocios" tem o template "Enviar Proposta Comercial" vinculado, mas as oportunidades criadas via formulario (Vanessa, Gabriel, Gisele, Henrique) nao possuem nenhuma tarefa.

Apenas o frontend (`negociosApi.criarOportunidade`) cria tarefas automaticas, o que significa que oportunidades vindas de formularios ou webhooks ficam sem tarefas.

### 2. Rodizio NAO e aplicado
A pipeline "Locacao 2026" esta configurada com `modo: rodizio` e tem o membro "Rafael" ativo. Porem, todas as oportunidades criadas via formulario possuem `usuario_responsavel_id: null`. A Edge Function nao consulta a tabela `configuracoes_distribuicao` nem `funis_membros`.

### 3. SLA Timer NAO aparece nos cards
O card do Kanban mostra "tempo na etapa" (ex: "1 minuto", "7 minutos") usando `atualizado_em`, mas nao tem nenhuma logica de SLA. O SLA esta configurado como 30 minutos, mas o card nao exibe um indicador visual de urgencia quando o tempo esta estourando.

---

## Solucao

### Parte 1: Edge Function - Rodizio + Tarefas Automaticas

**Arquivo:** `supabase/functions/processar-submissao-formulario/index.ts`

Apos criar a oportunidade, adicionar dois blocos:

**a) Aplicar Rodizio:**
1. Buscar `configuracoes_distribuicao` do funil
2. Se `modo = 'rodizio'`:
   - Buscar membros ativos em `funis_membros` (e se `pular_inativos`, filtrar `usuarios.ativo = true`)
   - Se `horario_especifico = true`, verificar se estamos dentro do horario/dias configurados
   - Determinar proximo membro baseado em `posicao_rodizio`
   - Atualizar `oportunidades.usuario_responsavel_id` com o membro selecionado
   - Incrementar `posicao_rodizio` e atualizar `ultimo_usuario_id` na config
3. Se `fallback_manual = true` e nao ha membros disponiveis, deixar sem responsavel

**b) Criar Tarefas Automaticas:**
1. Buscar `funis_etapas_tarefas` vinculadas a etapa de entrada
2. Para cada template ativo, criar uma tarefa na tabela `tarefas` com:
   - `oportunidade_id`, `contato_id`, `organizacao_id`
   - `owner_id` = responsavel atribuido (pelo rodizio ou null)
   - `data_vencimento` = agora + `dias_prazo` do template
   - `tarefa_template_id` e `etapa_origem_id` para deduplicacao

### Parte 2: Frontend - Rodizio no Modal de Criacao Manual

**Arquivo:** `src/modules/negocios/services/negocios.api.ts`

Na funcao `criarOportunidade`, quando `usuario_responsavel_id` nao e informado:
1. Buscar config de distribuicao do funil
2. Se `modo = 'rodizio'`, aplicar a mesma logica de selecao de membro
3. Atribuir automaticamente o responsavel antes de inserir

### Parte 3: SLA Timer no Card do Kanban

**Arquivo:** `src/modules/negocios/components/kanban/KanbanCard.tsx`

Alterar a exibicao do tempo na etapa para incluir logica de SLA:
1. Receber config de SLA como prop (via KanbanBoard que ja busca dados da pipeline)
2. Calcular tempo decorrido desde `atualizado_em`
3. Se SLA esta ativo:
   - Mostrar icone de alerta (amarelo) quando >= 80% do tempo SLA
   - Mostrar icone vermelho quando SLA estourado
   - Exibir formato "X/30 min" ao inves de apenas "X minutos"

**Arquivo:** `src/modules/negocios/components/kanban/KanbanBoard.tsx`
- Buscar `configuracoes_distribuicao` do funil para obter `sla_ativo` e `sla_tempo_minutos`
- Repassar para `KanbanColumn` e depois para `KanbanCard`

**Arquivo:** `src/modules/negocios/components/kanban/KanbanColumn.tsx`
- Repassar prop de SLA para os cards

---

## Detalhes Tecnicos

### Logica de Rodizio (reutilizavel)

```text
membros = funis_membros WHERE funil_id AND ativo = true
IF pular_inativos: filtrar usuarios.ativo = true
IF horario_especifico:
  - Verificar dia da semana atual IN dias_semana
  - Verificar hora atual BETWEEN horario_inicio AND horario_fim
  - Se fora do horario E fallback_manual: nao atribuir

posicao = posicao_rodizio % membros.length
responsavel = membros[posicao]
UPDATE configuracoes_distribuicao SET posicao_rodizio = posicao + 1, ultimo_usuario_id = responsavel
UPDATE oportunidades SET usuario_responsavel_id = responsavel
```

### SLA Visual no Card

```text
tempo_decorrido = now() - atualizado_em (em minutos)
porcentagem = tempo_decorrido / sla_tempo_minutos

Se porcentagem < 0.8: cor normal (cinza)
Se porcentagem >= 0.8 e < 1.0: cor amarela (aviso)
Se porcentagem >= 1.0: cor vermelha (estourado)

Formato exibido: "Xmin / 30min" quando SLA ativo
```

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/processar-submissao-formulario/index.ts` | Adicionar rodizio + tarefas automaticas |
| `src/modules/negocios/services/negocios.api.ts` | Aplicar rodizio na criacao manual |
| `src/modules/negocios/components/kanban/KanbanBoard.tsx` | Buscar e repassar config SLA |
| `src/modules/negocios/components/kanban/KanbanColumn.tsx` | Repassar SLA prop |
| `src/modules/negocios/components/kanban/KanbanCard.tsx` | Exibir timer SLA visual |

### Consideracoes

- O rodizio funciona com `posicao_rodizio` atualizado atomicamente para evitar duplicatas em concorrencia
- Tarefas automaticas usam deduplicacao por `tarefa_template_id + etapa_origem_id`
- O timer SLA no card e visual apenas (nao redistribui automaticamente - isso requer um cron/scheduled function futuro)
- A logica de rodizio sera implementada de forma identica na Edge Function e no frontend para consistencia
