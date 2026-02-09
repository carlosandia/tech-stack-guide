
# Plano de Implementacao - PRD-17: Modulo de Formularios (Backend)

## Analise e GAPs Corrigidos

Analisei o PRD-17 por completo (16 tabelas, 50+ endpoints, 15 services) e identifiquei os seguintes GAPs que serao corrigidos na implementacao:

1. **RLS incorreta no PRD**: O documento usa `current_setting('app.current_tenant')::uuid`, mas o projeto padroniza `get_user_tenant_id()` + `is_super_admin_v2()`. Sera corrigido em todas as policies.
2. **Tabelas filhas sem `organizacao_id`**: Tabelas como `campos_formularios`, `estilos_formularios`, etc. nao tem `organizacao_id`. Nao e bloqueante pois o backend usa `supabaseAdmin` (bypass RLS), e o isolamento e feito via service layer verificando `organizacao_id` do formulario pai.
3. **Rotas publicas**: As rotas `/api/v1/publico/formularios/*` (submissao, renderizacao, tracking) precisam ficar fora dos middlewares `authMiddleware` e `requireTenant` no `index.ts`.

## Estrategia de Implementacao por Etapas

Seguindo a recomendacao do proprio PRD (secao 14.2) e boas praticas, o backend sera implementado em **4 etapas progressivas**:

---

### ETAPA 1 - MVP Core (Prioridade: Must-have)

**Objetivo:** CRUD de formularios + campos + estilos + submissao publica funcional

**Arquivos a criar:**

| Arquivo | Descricao |
|---------|-----------|
| `backend/src/schemas/formularios.ts` | Schemas Zod para formularios, campos, estilos, submissoes |
| `backend/src/services/formularios.service.ts` | CRUD formularios (criar, listar, buscar, atualizar, excluir, publicar, despublicar, duplicar) |
| `backend/src/services/campos-formularios.service.ts` | CRUD campos do formulario + reordenacao |
| `backend/src/services/estilos-formularios.service.ts` | GET/PUT estilos do formulario |
| `backend/src/services/submissoes-formularios.service.ts` | Receber submissao publica, rate limit, criar lead/oportunidade |
| `backend/src/routes/formularios.ts` | Rotas autenticadas (CRUD + campos + estilos + submissoes) |
| `backend/src/routes/formularios-publico.ts` | Rotas publicas (GET formulario por slug, POST submissao) |
| Migration SQL | 6 tabelas: `formularios`, `campos_formularios`, `estilos_formularios`, `submissoes_formularios`, `rate_limits_formularios`, `links_compartilhamento_formularios` |

**Tabelas (Migration):**
- `formularios` - tabela principal com todos campos do PRD
- `campos_formularios` - campos do formulario com tipos, validacao, mapeamento
- `estilos_formularios` - JSONB com estilos do container/cabecalho/campos/botao
- `submissoes_formularios` - dados de submissao com UTM, geo, lead scoring
- `rate_limits_formularios` - controle de rate limit por IP
- `links_compartilhamento_formularios` - links, embed, QR code

**Endpoints implementados:**
- `GET/POST /api/v1/formularios` - Listar e criar
- `GET/PUT/DELETE /api/v1/formularios/:id` - CRUD individual
- `POST /api/v1/formularios/:id/publicar` e `/despublicar`
- `POST /api/v1/formularios/:id/duplicar`
- `GET/POST/PUT/DELETE /api/v1/formularios/:id/campos`
- `PUT /api/v1/formularios/:id/campos/reordenar`
- `GET/PUT /api/v1/formularios/:id/estilos`
- `GET /api/v1/formularios/:id/submissoes`
- `POST /api/v1/formularios/:id/compartilhar`
- `GET /api/v1/formularios/:id/links-compartilhamento`
- **Publico (sem auth):** `GET /api/v1/publico/formularios/:slug`
- **Publico (sem auth):** `POST /api/v1/publico/formularios/:slug/submeter`

**RLS:** Aplicada em `formularios`, `submissoes_formularios` e `links_compartilhamento_formularios` usando `get_user_tenant_id()` + `is_super_admin_v2()`. Tabelas filhas sem `organizacao_id` ficam sem RLS (acesso controlado pelo service).

**Registro em `index.ts`:**
- Rotas autenticadas: `app.use('/api/v1/formularios', authMiddleware, requireTenant, formulariosRoutes)`
- Rotas publicas: `app.use('/api/v1/publico/formularios', formulariosPublicoRoutes)` (SEM auth)

---

### ETAPA 2 - Tipos Especificos (Prioridade: Must/Should-have)

**Objetivo:** Popup de saida, newsletter com LGPD, multi-etapas

**Arquivos a criar:**

| Arquivo | Descricao |
|---------|-----------|
| Migration SQL | 3 tabelas: `config_popup_formularios`, `config_newsletter_formularios`, `etapas_formularios` |

**Arquivos a editar:**

| Arquivo | Alteracao |
|---------|-----------|
| `backend/src/schemas/formularios.ts` | Adicionar schemas de popup, newsletter, etapas |
| `backend/src/routes/formularios.ts` | Adicionar rotas de config-popup, config-newsletter, etapas |
| `backend/src/services/formularios.service.ts` | Adicionar metodos de config popup/newsletter/etapas |

**Endpoints adicionados:**
- `GET/PUT /api/v1/formularios/:id/config-popup`
- `GET/PUT /api/v1/formularios/:id/config-newsletter`
- `GET/PUT /api/v1/formularios/:id/etapas`

---

### ETAPA 3 - Logica Condicional + Progressive Profiling (Prioridade: Should-have)

**Objetivo:** Regras condicionais e personalizacao para leads conhecidos

**Arquivos a criar:**

| Arquivo | Descricao |
|---------|-----------|
| `backend/src/services/logica-condicional-formularios.service.ts` | CRUD regras condicionais |
| `backend/src/services/progressive-profiling-formularios.service.ts` | Config progressive profiling |
| Migration SQL | 2 tabelas: `regras_condicionais_formularios`, `config_progressive_profiling_formularios` |

**Arquivos a editar:**

| Arquivo | Alteracao |
|---------|-----------|
| `backend/src/schemas/formularios.ts` | Schemas de regras condicionais e profiling |
| `backend/src/routes/formularios.ts` | Rotas de regras-condicionais e progressive-profiling |

**Endpoints adicionados:**
- `GET/POST /api/v1/formularios/:id/regras-condicionais`
- `PUT/DELETE /api/v1/formularios/:id/regras-condicionais/:regraId`
- `PUT /api/v1/formularios/:id/regras-condicionais/reordenar`
- `GET/PUT /api/v1/formularios/:id/progressive-profiling`

---

### ETAPA 4 - A/B Testing + Webhooks + Analytics (Prioridade: Could/Should-have)

**Objetivo:** Otimizacao de conversao e integracoes externas

**Arquivos a criar:**

| Arquivo | Descricao |
|---------|-----------|
| `backend/src/services/testes-ab-formularios.service.ts` | CRUD testes A/B, variantes, resultados |
| `backend/src/services/webhooks-formularios.service.ts` | CRUD webhooks, disparo com retry, logs |
| `backend/src/services/analytics-formularios.service.ts` | Eventos, metricas, funil, abandono |
| Migration SQL | 4 tabelas: `testes_ab_formularios`, `variantes_ab_formularios`, `webhooks_formularios`, `logs_webhooks_formularios`, `eventos_analytics_formularios` |

**Arquivos a editar:**

| Arquivo | Alteracao |
|---------|-----------|
| `backend/src/schemas/formularios.ts` | Schemas de A/B, webhooks, analytics |
| `backend/src/routes/formularios.ts` | Rotas de testes-ab, webhooks, analytics |
| `backend/src/routes/formularios-publico.ts` | Rota publica de tracking de eventos |

**Endpoints adicionados:**
- Testes A/B: 12 endpoints (CRUD teste + variantes + iniciar/pausar/concluir + resultados)
- Webhooks: 6 endpoints (CRUD + testar + logs)
- Analytics: 5 endpoints (metricas, funil, campos, abandono, conversao por origem)
- **Publico:** `POST /api/v1/publico/formularios/:slug/rastrear`

---

## Detalhes Tecnicos

### Padrao de Codigo (seguindo padroes existentes)

- **Schemas:** Zod com tipos derivados via `z.infer`
- **Services:** Funcoes exportadas com `supabaseAdmin` (bypass RLS no backend)
- **Routes:** Express Router com helpers `getOrganizacaoId`, `getUserId`, `requireAdmin`
- **Validacao:** `ZodSchema.parse(req.body)` com catch para 400
- **Soft delete:** `deletado_em` timestamp, filtro `.is('deletado_em', null)`
- **Nomenclatura:** PT-BR snake_case no banco, camelCase no codigo

### Seguranca

- Rate limit em rotas publicas: 10 submissoes/min por IP (tabela `rate_limits_formularios`)
- Captcha: Validacao opcional de reCAPTCHA/hCaptcha via API do Google
- Honeypot: Campo oculto na submissao para detectar bots
- RLS com `get_user_tenant_id()` nas tabelas com `organizacao_id`

### Integracao com Pipeline

Na submissao, se o formulario tem `funil_id` e `etapa_id`:
1. Cria/busca contato na tabela `contatos` (usando email como chave)
2. Cria oportunidade na tabela `oportunidades` vinculada ao funil/etapa
3. Registra UTMs na oportunidade

---

## Recomendacao

Implementar **Etapa 1** primeiro (e a mais extensa, ~60% do trabalho), testar, e depois seguir com as demais etapas sequencialmente. Cada etapa e independente e funcional por si so.

Deseja que eu prossiga com a implementacao da **Etapa 1**?
