

# Plano: Implementacao Frontend do PRD-05 - Modulo de Configuracoes

## Visao Geral

Implementar o frontend completo do modulo de Configuracoes do CRM Renove, acessivel por usuarios com role `admin` e `member` (com restricoes para members). O modulo se conecta ao backend Express existente via cliente Axios (`src/lib/api.ts`), seguindo rigorosamente o Design System documentado.

---

## Arquitetura do Modulo

O modulo tera sua propria estrutura seguindo o padrao ja estabelecido no projeto:

```text
src/modules/configuracoes/
  index.ts                          # Barrel exports
  layouts/
    ConfiguracoesLayout.tsx         # Layout com Header horizontal + Toolbar (Design System 11.1-11.3)
  contexts/
    ConfigToolbarContext.tsx         # Contexto de toolbar (mesmo padrao do admin/ToolbarContext)
  services/
    configuracoes.api.ts            # Chamadas API via Axios ao backend Express
  hooks/
    useCampos.ts                    # React Query hooks - Campos Personalizados
    useProdutos.ts                  # React Query hooks - Produtos e Categorias
    useMotivos.ts                   # React Query hooks - Motivos de Resultado
    useTarefasTemplates.ts          # React Query hooks - Templates de Tarefas
    useEtapasTemplates.ts           # React Query hooks - Templates de Etapas
    useRegras.ts                    # React Query hooks - Regras de Qualificacao
    useConfigCard.ts                # React Query hooks - Personalizacao Cards
    useIntegracoes.ts               # React Query hooks - Conexoes OAuth
    useWebhooks.ts                  # React Query hooks - Webhooks Entrada/Saida
    useEquipe.ts                    # React Query hooks - Equipes, Usuarios, Perfis
    useMetas.ts                     # React Query hooks - Metas Hierarquicas
    useConfigTenant.ts              # React Query hooks - Config do Tenant
  pages/
    CamposPage.tsx                  # Campos Personalizados (tabs por entidade)
    ProdutosPage.tsx                # Produtos e Categorias (tabs)
    MotivosPage.tsx                 # Motivos de Resultado (tabs Ganho/Perda)
    TarefasTemplatesPage.tsx        # Templates de Tarefas
    EtapasTemplatesPage.tsx         # Templates de Etapas
    RegrasPage.tsx                  # Regras de Qualificacao
    ConfigCardPage.tsx              # Personalizacao de Cards Kanban
    ConexoesPage.tsx                # Conexoes OAuth (Admin Only)
    WebhooksEntradaPage.tsx         # Webhooks de Entrada (Admin Only)
    WebhooksSaidaPage.tsx           # Webhooks de Saida (Admin Only)
    MembrosPage.tsx                 # Gestao de Membros (Admin Only)
    PerfisPermissaoPage.tsx         # Perfis de Permissao (Admin Only)
    MetasPage.tsx                   # Metas Hierarquicas (Admin Only)
    ConfigGeralPage.tsx             # Config Geral do Tenant (Admin Only)
  components/
    campos/
      CampoFormModal.tsx            # Modal criar/editar campo
      CamposList.tsx                # Lista de campos por entidade
    produtos/
      ProdutoFormModal.tsx           # Modal criar/editar produto
      CategoriaFormModal.tsx         # Modal criar/editar categoria
    motivos/
      MotivoFormModal.tsx            # Modal criar/editar motivo
    tarefas/
      TarefaTemplateFormModal.tsx    # Modal criar/editar template tarefa
    etapas/
      EtapaTemplateFormModal.tsx     # Modal criar/editar template etapa
    regras/
      RegraFormModal.tsx             # Modal criar/editar regra
    integracoes/
      ConexaoCard.tsx               # Card de status de conexao
    webhooks/
      WebhookEntradaFormModal.tsx    # Modal criar/editar webhook entrada
      WebhookSaidaFormModal.tsx      # Modal criar/editar webhook saida
    equipe/
      MembroFormModal.tsx            # Modal convidar/editar membro
      EquipeFormModal.tsx            # Modal criar/editar equipe
      PerfilFormModal.tsx            # Modal criar/editar perfil
    metas/
      MetaFormModal.tsx             # Modal criar/editar meta
      ProgressBar.tsx               # Barra de progresso
      RankingCard.tsx               # Card de ranking
    config/
      ConfigGeralForm.tsx            # Formulario de config geral
  schemas/
    campos.schema.ts                # Validacao Zod para campos
    produtos.schema.ts              # Validacao Zod para produtos
    motivos.schema.ts               # Validacao Zod para motivos
    tarefas-templates.schema.ts     # Validacao Zod para templates tarefas
    etapas-templates.schema.ts      # Validacao Zod para templates etapas
    regras.schema.ts                # Validacao Zod para regras
    webhooks.schema.ts              # Validacao Zod para webhooks
    equipe.schema.ts                # Validacao Zod para equipe/membros/perfis
    metas.schema.ts                 # Validacao Zod para metas
    config-tenant.schema.ts         # Validacao Zod para config tenant
```

---

## Etapas de Implementacao

### Etapa 1: Infraestrutura Base

**1.1 Layout do Modulo (`ConfiguracoesLayout.tsx`)**
- Header fixo (56px) com navegacao horizontal seguindo Design System 11.2
- Itens do menu: Pipeline (sub-itens), Integracoes (sub-itens), Equipe (Admin only)
- Toolbar sticky (48px) com contexto da pagina ativa
- Glass Effect: `bg-white/80 backdrop-blur-md border-b border-gray-200/60`
- Drawer mobile para navegacao
- O menu do Header tera 3 categorias de navegacao com sub-navegacao via Toolbar:
  - **Pipeline**: Campos, Produtos, Motivos, Tarefas, Etapas, Regras, Cards
  - **Integracoes**: Conexoes, Webhooks Entrada, Webhooks Saida (Admin Only)
  - **Equipe**: Membros, Perfis, Metas, Config Geral (Admin Only - member NAO ve)

**1.2 Contexto de Toolbar (`ConfigToolbarContext.tsx`)**
- Mesmo padrao do `ToolbarContext` existente no modulo admin
- Permite que paginas injetem acoes e subtitulos no toolbar

**1.3 Roteamento (`App.tsx`)**
- Rota `/app/configuracoes/*` acessivel para roles `admin` e `member`
- Guard de role para sub-rotas de Equipe (admin only)
- Redirecionamento de member tentando acessar areas bloqueadas

**1.4 Service Layer (`configuracoes.api.ts`)**
- Todas as chamadas via Axios ao backend Express (usando `src/lib/api.ts`)
- Endpoints base: `/v1/campos`, `/v1/produtos`, `/v1/motivos-resultado`, etc.
- Tipagem TypeScript completa para requests e responses

---

### Etapa 2: Pipeline - Campos Personalizados

**Pagina**: `CamposPage.tsx`
- Tabs por entidade: Contatos, Pessoas, Empresas, Oportunidades
- Listagem de campos com indicador de campo do sistema (bloqueado)
- Botao "+ Novo Campo" no toolbar (Admin only)
- Modal de criacao/edicao com 13 tipos de campo disponiveis
- Campos do sistema com icone de cadeado, sem acoes de edicao/exclusao

**Endpoints**: `GET/POST/PATCH/DELETE /v1/campos`

---

### Etapa 3: Pipeline - Produtos e Categorias

**Pagina**: `ProdutosPage.tsx`
- Tabs: Produtos | Categorias
- Busca e filtros no toolbar
- Cards de produto com preco, SKU, categoria, status
- Suporte a produtos recorrentes (MRR)
- Modal CRUD para produtos e categorias

**Endpoints**: `GET/POST/PATCH/DELETE /v1/produtos` e `/v1/categorias-produtos`

---

### Etapa 4: Pipeline - Motivos de Resultado

**Pagina**: `MotivosPage.tsx`
- Tabs: Ganho | Perda
- Lista com indicador de cor (verde/vermelho)
- Modal para criar/editar motivos
- Motivos do sistema marcados como protegidos

**Endpoints**: `GET/POST/PATCH/DELETE /v1/motivos-resultado`

---

### Etapa 5: Pipeline - Templates de Tarefas e Etapas

**Paginas**: `TarefasTemplatesPage.tsx` e `EtapasTemplatesPage.tsx`
- Listagem com icones por tipo (Phone, Mail, Calendar, etc.)
- Templates com prioridade, prazo e tipo
- Etapas com cores, probabilidade e tipos (entrada, normal, ganho, perda)
- Etapas Ganho/Perda com icone de cadeado (imutaveis)

**Endpoints**: `GET/POST/PATCH/DELETE /v1/tarefas-templates` e `/v1/etapas-templates`

---

### Etapa 6: Pipeline - Regras de Qualificacao e Cards

**Paginas**: `RegrasPage.tsx` e `ConfigCardPage.tsx`
- Regras MQL com campo, operador e valor
- Explicacao visual: "Quando TODAS as regras forem verdadeiras..."
- Config de cards: checkboxes para campos visiveis no Kanban
- Selecao de pipeline

**Endpoints**: `GET/POST/PATCH/DELETE /v1/regras-qualificacao` e `GET/PUT /v1/configuracoes-card`

---

### Etapa 7: Integracoes - Conexoes OAuth (Admin Only)

**Pagina**: `ConexoesPage.tsx`
- Cards de status por plataforma (WhatsApp, Instagram, Meta, Google, Email)
- Status: Conectado/Nao conectado
- Botoes: Conectar, Desconectar, Gerenciar
- Member NAO tem acesso a esta pagina

**Endpoints**: `GET/DELETE/POST /v1/integracoes`

---

### Etapa 8: Integracoes - Webhooks (Admin Only)

**Paginas**: `WebhooksEntradaPage.tsx` e `WebhooksSaidaPage.tsx`
- Webhooks de entrada: URL gerada, API Key, status
- Webhooks de saida: URL destino, eventos selecionados, retry config
- Botao copiar URL
- Historico de logs

**Endpoints**: `GET/POST/PATCH/DELETE /v1/webhooks-entrada` e `/v1/webhooks-saida`

---

### Etapa 9: Equipe - Membros e Perfis (Admin Only)

**Paginas**: `MembrosPage.tsx` e `PerfisPermissaoPage.tsx`
- Lista de membros com avatar, perfil, status, ultimo login
- Convidar membro por email
- Ativar/Desativar membros
- Reenviar convite
- CRUD de perfis de permissao com matrix modulo x acoes
- 3 perfis padrao protegidos (Vendedor, Gerente, Visualizador)

**Endpoints**: `GET/POST/PATCH /v1/usuarios` e `GET/POST/PATCH/DELETE /v1/perfis-permissao`

---

### Etapa 10: Equipe - Metas Hierarquicas (Admin Only)

**Pagina**: `MetasPage.tsx`
- Hierarquia visual: Meta da Empresa > Equipes > Individual
- 15+ metricas organizadas por categoria (Receita, Quantidade, Atividades, Leads, Tempo)
- Barras de progresso coloridas
- Ranking de equipe com badges (TOP, ALERTA)
- Distribuicao automatica de metas
- Modal complexo de criacao com selecao de nivel, metrica e periodo

**Endpoints**: `GET/POST/PATCH/DELETE /v1/metas` e `/v1/equipes`

---

### Etapa 11: Config Geral do Tenant (Admin Only)

**Pagina**: `ConfigGeralPage.tsx`
- Formulario com secoes: Localizacao, Notificacoes, Automacao, Mensagens
- Moeda, timezone, formato de data
- Toggles para notificacoes
- Horario comercial
- Botao "Salvar Alteracoes" condicional (aparece so quando ha mudancas)

**Endpoints**: `GET/PATCH /v1/configuracoes-tenant`

---

## Detalhes Tecnicos

### Padrao de Comunicacao com Backend

Todas as chamadas serao feitas via o cliente Axios existente (`src/lib/api.ts`) que ja trata autenticacao (Bearer token) e refresh de token. O base URL e `${env.API_URL}/api`, entao endpoints serao chamados como:

```typescript
// Exemplo
const response = await api.get('/v1/campos', { params: { entidade: 'contato' } })
const response = await api.post('/v1/campos', payload)
```

### Componentes UI (Design System)

Sera necessario instalar componentes shadcn/ui que ainda nao existem no projeto:
- `dialog` (modais)
- `tabs`
- `badge`
- `switch` (toggles)
- `select`
- `label`
- `textarea`
- `checkbox`
- `separator`
- `dropdown-menu`
- `sheet` (drawer mobile)
- `toast` (sonner)

### Controle de Acesso no Frontend

```typescript
// No ConfiguracoesLayout
const { role } = useAuth()
const isAdmin = role === 'admin'

// Itens de menu Equipe & Integracoes: so aparecem se isAdmin
// Rotas /app/configuracoes/equipe/*: guard com redirect para /app se member
// Botoes de CRUD: desabilitados/ocultos para member (somente leitura)
```

### Navegacao no Header

O Header do modulo de Configuracoes tera 3 grupos de navegacao principal:
- **Pipeline** (icone: Sliders) - Acessivel por Admin e Member
- **Integracoes** (icone: Plug) - Acessivel apenas por Admin
- **Equipe** (icone: Users) - Acessivel apenas por Admin

A sub-navegacao de cada grupo sera injetada no Toolbar como tabs/botoes ghost.

### Validacao de Formularios

Todos os formularios usarao `react-hook-form` + `zod` com mensagens em PT-BR, seguindo o padrao ja estabelecido no projeto.

---

## Ordem de Implementacao Sugerida

Dado o volume, recomendo dividir em prompts separados:

1. **Prompt 1**: Infraestrutura (Layout, roteamento, services, hooks base) + Campos Personalizados
2. **Prompt 2**: Produtos + Categorias + Motivos de Resultado
3. **Prompt 3**: Templates de Tarefas + Etapas + Regras + Config Cards
4. **Prompt 4**: Conexoes OAuth + Webhooks Entrada/Saida
5. **Prompt 5**: Membros + Perfis de Permissao + Equipes
6. **Prompt 6**: Metas Hierarquicas + Config Geral do Tenant

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Backend Express nao esta rodando no ambiente de preview | Usar Supabase direto como fallback ou configurar VITE_API_URL |
| Componentes shadcn/ui nao instalados | Instalar conforme necessidade |
| Volume grande de paginas (14+) | Dividir implementacao em etapas incrementais |
| Member acessando areas bloqueadas | Guard dupla: menu oculto + redirect na rota |

