

## Plano de Otimizacao para Escala — Modulo /negocios

Correcoes pontuais e seguras para preparar o modulo para 500+ usuarios, sem alterar comportamento funcional existente.

---

### Fase 1 — Correcoes Criticas

#### 1.1 Debounce no Realtime (useKanban.ts)

**Problema**: Cada evento Realtime dispara `invalidateQueries` imediatamente, causando "refetch storms" quando multiplos usuarios movem cards.

**Correcao**: Adicionar debounce de 2 segundos no callback do Realtime. Usar `setTimeout` + `clearTimeout` com ref.

**Arquivo**: `src/modules/negocios/hooks/useKanban.ts`
- Adicionar `useRef` para armazenar timer
- No callback do `postgres_changes`, limpar timer anterior e agendar invalidacao com 2s de delay
- Limpar timer no cleanup do useEffect

**Risco**: Zero. Apenas atrasa a invalidacao em 2s, o optimistic update ja garante UX imediata.

---

#### 1.2 Batch update de posicoes (negocios.api.ts — moverEtapa)

**Problema**: `moverEtapa` (linhas 509-512) faz N updates individuais via `Promise.all` para recalcular posicoes. Com 50 cards numa etapa, sao 50 queries paralelas.

**Correcao**: Criar uma funcao RPC no Supabase (`reordenar_posicoes_etapa`) que recebe um array de `{id, posicao}` e faz o update em uma unica transacao.

**Arquivos**:
- Nova migration SQL com a funcao `reordenar_posicoes_etapa`
- `src/modules/negocios/services/negocios.api.ts` — substituir o `Promise.all` de updates por `supabase.rpc('reordenar_posicoes_etapa', { items: [...] })`

**Mesmo fix aplicado em**: `handleSortColumn` no `KanbanBoard.tsx` (linhas 188-191)

**Risco**: Baixo. A funcao RPC faz exatamente o mesmo que o `Promise.all`, so que em 1 roundtrip. Se a RPC falhar, o rollback e atomico.

---

#### 1.3 Remover logica de rodizio duplicada do frontend (negocios.api.ts — criarOportunidade)

**Problema**: O rodizio de distribuicao existe no frontend (linhas 556-618) E no trigger do banco (`aplicar_config_pipeline_oportunidade`). Isso cria race condition e possivel atribuicao dupla.

**Correcao**: Remover o bloco de rodizio do frontend (linhas 556-618). Manter apenas `responsavelFinal = payload.usuario_responsavel_id || userId` como fallback simples. O trigger do banco ja faz a logica correta.

**Arquivo**: `src/modules/negocios/services/negocios.api.ts`

**Risco**: Baixo. O trigger `aplicar_config_pipeline_oportunidade` ja existe e faz o rodizio. Verificar que o trigger esta ativo antes de remover. O frontend passa a confiar no banco como fonte unica de verdade (conforme arquiteto).

---

#### 1.4 Remover criacao de tarefas automaticas duplicada (negocios.api.ts)

**Problema**: `criarTarefasAutomaticas` e chamado em 2 pontos do frontend (ao criar oportunidade linha 652-664, ao mover etapa linhas 517-532) E pelo trigger `aplicar_config_pipeline_oportunidade`. A deduplicacao parcial (linhas 1246-1261) mitiga mas nao elimina o risco.

**Correcao**: Remover as 2 chamadas a `criarTarefasAutomaticas` de `criarOportunidade` e de `moverEtapa`. Manter a funcao `criarTarefasAutomaticas` no codigo (pode ser util para chamadas manuais), mas nao chama-la automaticamente — o trigger do banco ja cuida disso.

**Arquivo**: `src/modules/negocios/services/negocios.api.ts`

**Risco**: Baixo. A deduplicacao ja existente protege contra duplicatas. Remover a chamada do frontend apenas elimina a redundancia. Verificar que o trigger cobre os dois cenarios (criacao e movimentacao).

---

### Fase 2 — Otimizacoes de Performance

#### 2.1 Paginacao no historico (negocios.api.ts — listarHistorico)

**Problema**: `listarHistorico` tem `limit(100)` fixo. Para oportunidades com muitas movimentacoes, carrega tudo de uma vez.

**Correcao**: Adicionar parametros `page` e `pageSize` opcionais (default 50). Aplicar `.range()` na query.

**Arquivos**:
- `src/modules/negocios/services/negocios.api.ts` — adicionar paginacao
- `src/modules/negocios/hooks/useOportunidadeDetalhes.ts` — passar parametros
- Componente de timeline — adicionar botao "Carregar mais" (se necessario)

**Risco**: Zero. Parametros opcionais com defaults que mantém comportamento atual.

---

#### 2.2 Limit nas anotacoes (negocios.api.ts — listarAnotacoes)

**Problema**: `listarAnotacoes` nao tem limit — carrega TODAS as anotacoes.

**Correcao**: Adicionar `.limit(50)` como default seguro. Adicionar paginacao futura se necessario.

**Arquivo**: `src/modules/negocios/services/negocios.api.ts`

**Risco**: Zero. Apenas adiciona um limit razoavel.

---

#### 2.3 Extrair auth-context compartilhado

**Problema**: 3 copias identicas do pattern `_cachedOrgId/_cachedUserId` em `negocios.api.ts`, `detalhes.api.ts` e `pre-oportunidades.api.ts`.

**Correcao**: Criar `src/shared/services/auth-context.ts` com as funcoes `getOrganizacaoId()`, `getUsuarioId()` e `getUserRole()`. Importar nos 3 arquivos.

**Arquivos**:
- Novo: `src/shared/services/auth-context.ts`
- Editar: `negocios.api.ts`, `detalhes.api.ts`, `pre-oportunidades.api.ts` — remover duplicatas e importar do modulo compartilhado

**Risco**: Zero. Apenas refactor de organizacao sem mudanca de logica.

---

### Resumo de arquivos impactados

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/modules/negocios/hooks/useKanban.ts` | Adicionar debounce no Realtime |
| `src/modules/negocios/services/negocios.api.ts` | Remover rodizio/tarefas duplicados, batch positions via RPC, limit anotacoes, paginacao historico |
| `src/modules/negocios/components/kanban/KanbanBoard.tsx` | Usar RPC para batch positions no handleSortColumn |
| `src/shared/services/auth-context.ts` | Novo arquivo — helpers de auth compartilhados |
| `src/modules/negocios/services/detalhes.api.ts` | Importar auth-context compartilhado |
| `src/modules/negocios/services/pre-oportunidades.api.ts` | Importar auth-context compartilhado |
| Nova migration SQL | Funcao `reordenar_posicoes_etapa` |

### Garantias de seguranca

- Nenhum componente visual sera alterado
- Nenhuma prop sera removida ou renomeada
- Optimistic updates continuam funcionando identicamente
- Todos os hooks mantem a mesma assinatura
- Valores default garantem retrocompatibilidade

