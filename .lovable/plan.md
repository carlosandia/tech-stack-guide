

# Analise de Lacunas: Frontend PRD-05 vs Backend Implementado

## Situacao Atual

O backend do PRD-05 esta **100% implementado** com todas as rotas registradas em `backend/src/index.ts`. O frontend, por outro lado, tem apenas a **infraestrutura base** e **1 de 14+ paginas** implementadas. Todas as demais paginas estao usando `StubPage` (placeholder).

---

## Inventario Completo: O que FALTA no Frontend

### CAMADA DE SERVICE (`configuracoes.api.ts`)

O service layer ja esta criado com types e funcoes API para todas as secoes. Porem, ha **lacunas de endpoints** que o backend oferece mas o frontend nao consome:

| Endpoint Backend | Frontend Service | Status |
|-----------------|------------------|--------|
| `GET /v1/categorias-produtos` | `produtosApi.listarCategorias` chama `/v1/produtos/categorias` | **ERRADO** - Backend registra em `/v1/categorias-produtos` e nao em `/v1/produtos/categorias` |
| `POST /v1/categorias-produtos` | `produtosApi.criarCategoria` chama `/v1/produtos/categorias` | **ERRADO** - Mesmo problema |
| `PATCH /v1/categorias-produtos/:id` | `produtosApi.atualizarCategoria` | **ERRADO** |
| `DELETE /v1/categorias-produtos/:id` | `produtosApi.excluirCategoria` | **ERRADO** |
| `GET /v1/integracoes/:plataforma/auth-url` | NAO existe no service | **FALTANDO** |
| `POST /v1/integracoes/:plataforma/callback` | NAO existe no service | **FALTANDO** |
| `POST /v1/webhooks-entrada/:id/regenerar-token` | NAO existe no service | **FALTANDO** |
| `GET /v1/webhooks-saida/:id/logs` | NAO existe no service | **FALTANDO** |
| `POST /v1/equipes/:id/membros` | NAO existe no service | **FALTANDO** |
| `DELETE /v1/equipes/:id/membros/:userId` | NAO existe no service | **FALTANDO** |
| `PATCH /v1/equipes/:id/membros/:userId/papel` | NAO existe no service | **FALTANDO** |
| `GET /v1/metas/minhas` | NAO existe no service | **FALTANDO** |
| `GET /v1/metas/ranking` | NAO existe no service | **FALTANDO** |
| `GET /v1/metas/progresso` | NAO existe no service | **FALTANDO** |
| `GET /v1/metas/empresa` | NAO existe no service | **FALTANDO** |
| `GET /v1/metas/equipes` | NAO existe no service | **FALTANDO** |
| `GET /v1/metas/individuais` | NAO existe no service | **FALTANDO** |
| `GET /v1/regras-qualificacao` | NAO existe no service | **FALTANDO** |
| `POST /v1/regras-qualificacao` | NAO existe no service | **FALTANDO** |
| `PATCH /v1/regras-qualificacao/:id` | NAO existe no service | **FALTANDO** |
| `DELETE /v1/regras-qualificacao/:id` | NAO existe no service | **FALTANDO** |
| `GET /v1/configuracoes-card` | NAO existe no service | **FALTANDO** |
| `PUT /v1/configuracoes-card` | NAO existe no service | **FALTANDO** |
| `POST /v1/regras-qualificacao/avaliar` | NAO existe no service | **FALTANDO** |
| Motivos `PATCH /v1/motivos-resultado/reordenar` | NAO existe no service | **FALTANDO** |
| Etapas `POST /:id/tarefas` (vincular tarefa) | NAO existe no service | **FALTANDO** |
| Etapas `DELETE /:id/tarefas/:tarefaId` (desvincular) | NAO existe no service | **FALTANDO** |

### CAMADA DE HOOKS (React Query)

| Hook | Status |
|------|--------|
| `useCampos.ts` | Implementado |
| `useProdutos.ts` | **FALTANDO** |
| `useMotivos.ts` | **FALTANDO** |
| `useTarefasTemplates.ts` | **FALTANDO** |
| `useEtapasTemplates.ts` | **FALTANDO** |
| `useRegras.ts` | **FALTANDO** |
| `useConfigCard.ts` | **FALTANDO** |
| `useIntegracoes.ts` | **FALTANDO** |
| `useWebhooks.ts` | **FALTANDO** |
| `useEquipe.ts` | **FALTANDO** |
| `useMetas.ts` | **FALTANDO** |
| `useConfigTenant.ts` | **FALTANDO** |

### CAMADA DE SCHEMAS (Zod - Frontend)

| Schema | Status |
|--------|--------|
| `campos.schema.ts` | Implementado |
| `produtos.schema.ts` | **FALTANDO** |
| `motivos.schema.ts` | **FALTANDO** |
| `tarefas-templates.schema.ts` | **FALTANDO** |
| `etapas-templates.schema.ts` | **FALTANDO** |
| `regras.schema.ts` | **FALTANDO** |
| `webhooks.schema.ts` | **FALTANDO** |
| `equipe.schema.ts` | **FALTANDO** |
| `metas.schema.ts` | **FALTANDO** |
| `config-tenant.schema.ts` | **FALTANDO** |

### CAMADA DE PAGINAS

| Pagina | Rota | Status |
|--------|------|--------|
| `CamposPage.tsx` | `/app/configuracoes/campos` | Implementado |
| `ProdutosPage.tsx` | `/app/configuracoes/produtos` | **FALTANDO** (usa StubPage) |
| `MotivosPage.tsx` | `/app/configuracoes/motivos` | **FALTANDO** (usa StubPage) |
| `TarefasTemplatesPage.tsx` | `/app/configuracoes/tarefas-templates` | **FALTANDO** (usa StubPage) |
| `EtapasTemplatesPage.tsx` | `/app/configuracoes/etapas-templates` | **FALTANDO** (usa StubPage) |
| `RegrasPage.tsx` | `/app/configuracoes/regras` | **FALTANDO** (usa StubPage) |
| `ConfigCardPage.tsx` | `/app/configuracoes/cards` | **FALTANDO** (usa StubPage) |
| `ConexoesPage.tsx` | `/app/configuracoes/conexoes` | **FALTANDO** (usa StubPage) |
| `WebhooksEntradaPage.tsx` | `/app/configuracoes/webhooks-entrada` | **FALTANDO** (usa StubPage) |
| `WebhooksSaidaPage.tsx` | `/app/configuracoes/webhooks-saida` | **FALTANDO** (usa StubPage) |
| `MembrosPage.tsx` | `/app/configuracoes/membros` | **FALTANDO** (usa StubPage) |
| `PerfisPermissaoPage.tsx` | `/app/configuracoes/perfis` | **FALTANDO** (usa StubPage) |
| `MetasPage.tsx` | `/app/configuracoes/metas` | **FALTANDO** (usa StubPage) |
| `ConfigGeralPage.tsx` | `/app/configuracoes/config-geral` | **FALTANDO** (usa StubPage) |
| `EquipesPage.tsx` | (nao tem rota) | **FALTANDO** - PRD define CRUD de equipes mas nao ha rota no App.tsx |

### CAMADA DE COMPONENTES

| Componente | Status |
|------------|--------|
| `campos/CampoFormModal.tsx` | Implementado |
| `campos/CamposList.tsx` | Implementado |
| `produtos/ProdutoFormModal.tsx` | **FALTANDO** |
| `produtos/CategoriaFormModal.tsx` | **FALTANDO** |
| `motivos/MotivoFormModal.tsx` | **FALTANDO** |
| `tarefas/TarefaTemplateFormModal.tsx` | **FALTANDO** |
| `etapas/EtapaTemplateFormModal.tsx` | **FALTANDO** |
| `regras/RegraFormModal.tsx` | **FALTANDO** |
| `integracoes/ConexaoCard.tsx` | **FALTANDO** |
| `webhooks/WebhookEntradaFormModal.tsx` | **FALTANDO** |
| `webhooks/WebhookSaidaFormModal.tsx` | **FALTANDO** |
| `equipe/MembroFormModal.tsx` | **FALTANDO** |
| `equipe/EquipeFormModal.tsx` | **FALTANDO** |
| `equipe/PerfilFormModal.tsx` | **FALTANDO** |
| `metas/MetaFormModal.tsx` | **FALTANDO** |
| `metas/ProgressBar.tsx` | **FALTANDO** |
| `metas/RankingCard.tsx` | **FALTANDO** |
| `config/ConfigGeralForm.tsx` | **FALTANDO** |

---

## Bugs Identificados no Service Layer Existente

1. **URLs de Categorias incorretas**: `produtosApi.listarCategorias` chama `/v1/produtos/categorias`, mas o backend registra as categorias em `/v1/categorias-produtos`. Precisa mudar para `/v1/categorias-produtos`.

2. **URLs de Webhooks incorretas**: `webhooksApi.listarEntrada` chama `/v1/webhooks-entrada/entrada`, mas o backend registra o mesmo router tanto em `/v1/webhooks-entrada` quanto em `/v1/webhooks-saida`, e as sub-rotas usam `/entrada` e `/saida`. Ou seja, a chamada correta e `/v1/webhooks-entrada/entrada` para entrada e `/v1/webhooks-entrada/saida` para saida. Porem tambem ha duplicacao no backend (`/v1/webhooks-saida/saida` tambem funcionaria). Precisa alinhar.

---

## Resumo Quantitativo

| Camada | Implementado | Faltando | % Concluido |
|--------|-------------|----------|-------------|
| Service API (funcoes) | 8 de 12 grupos | 4 grupos + endpoints extras | ~50% |
| Hooks (React Query) | 1 de 12 | 11 | ~8% |
| Schemas (Zod) | 1 de 10 | 9 | ~10% |
| Paginas | 1 de 15 | 14 | ~7% |
| Componentes (modais/forms) | 2 de 18 | 16 | ~11% |

**Conclusao: O frontend do PRD-05 esta aproximadamente 10% implementado.** Faltam 14 paginas completas com seus respectivos hooks, schemas, e componentes de CRUD.

---

## Plano de Implementacao para Completar

Dado o volume, recomendo implementar em **5 prompts sequenciais**:

### Prompt 1: Pipeline Basico
- Corrigir bugs de URL no service layer (categorias, webhooks)
- Adicionar endpoints faltantes ao service (regras, config card, etc.)
- Implementar `ProdutosPage` + `CategoriaFormModal` + `ProdutoFormModal` + hooks + schemas
- Implementar `MotivosPage` + `MotivoFormModal` + hooks + schemas

### Prompt 2: Pipeline Avancado
- Implementar `TarefasTemplatesPage` + modal + hooks + schemas
- Implementar `EtapasTemplatesPage` + modal + hooks + schemas (com protecao de etapas sistema)
- Implementar `RegrasPage` + modal + hooks + schemas
- Implementar `ConfigCardPage` + hooks

### Prompt 3: Integracoes
- Implementar `ConexoesPage` + `ConexaoCard` + hooks (OAuth flow)
- Implementar `WebhooksEntradaPage` + modal + hooks + schemas
- Implementar `WebhooksSaidaPage` + modal + hooks + schemas (com logs e teste)

### Prompt 4: Equipe
- Implementar `MembrosPage` + `MembroFormModal` + hooks + schemas
- Implementar `PerfisPermissaoPage` + `PerfilFormModal` + hooks + schemas
- Implementar `EquipesPage` + `EquipeFormModal` (gestao de equipes com membros)
- Adicionar rota de equipes no `App.tsx`

### Prompt 5: Metas e Config Geral
- Implementar `MetasPage` completa com hierarquia (empresa/equipe/individual)
- Implementar `MetaFormModal` com selecao de nivel e metrica
- Implementar `ProgressBar` e `RankingCard`
- Implementar `ConfigGeralPage` + `ConfigGeralForm` + hooks + schemas
- Widget "Minhas Metas" para o Dashboard do Member

