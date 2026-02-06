

# PRD-06: Modulo de Contatos - Implementacao Completa (Backend + Frontend)

## Resumo da Analise

Apos analise detalhada do codigo, banco de dados, PRD e padroes existentes, identifiquei o seguinte cenario:

**O que JA EXISTE:**
- Tabelas no banco: `contatos`, `segmentos`, `contatos_segmentos`, `duplicatas_contatos`, `importacoes_contatos` (todas com RLS)
- Schema Zod completo: `backend/src/schemas/contatos.ts` e `backend/src/schemas/segmentos.ts`
- Notas de Contato: route, service e migration completos
- Menu "Contatos" no AppLayout ja configurado (`/app/contatos`)

**O que FALTA - Backend (Express):**
1. `backend/src/routes/contatos.ts` - Rotas de CRUD de contatos
2. `backend/src/services/contatos.service.ts` - Service com queries Supabase
3. `backend/src/routes/segmentos.ts` - Rotas de CRUD de segmentos
4. `backend/src/services/segmentos.service.ts` - Service de segmentos
5. Registro das rotas no `backend/src/index.ts`

**O que FALTA - Frontend (React):**
- Modulo inteiro `src/modules/contatos/` nao existe

---

## Fase 1: Backend - Routes e Services

### 1.1 Service de Contatos (`backend/src/services/contatos.service.ts`)

Criar service com os seguintes metodos usando `supabaseAdmin`:

- `listar(organizacaoId, usuarioId, role, filtros)` - Listagem paginada com filtros (tipo, status, origem, busca, segmento, periodo). Admin ve todos, Member ve apenas seus (`owner_id`).
- `buscarPorId(id, organizacaoId, usuarioId, role)` - Detalhe com empresa vinculada, segmentos e contagem de oportunidades.
- `criar(organizacaoId, usuarioId, role, dados)` - Cria pessoa ou empresa. Member vira automaticamente owner.
- `atualizar(id, organizacaoId, usuarioId, role, dados)` - Atualiza campos. Member so atualiza os seus.
- `excluir(id, organizacaoId, usuarioId, role)` - Soft delete com verificacao de vinculos (oportunidades para pessoas, pessoas para empresas).
- `excluirLote(organizacaoId, usuarioId, role, payload)` - Exclusao em massa (max 100) com verificacao de vinculos.
- `atribuirLote(organizacaoId, payload)` - Atribuir owner em massa (Admin only).
- `exportar(organizacaoId, usuarioId, role, filtros)` - Gera CSV respeitando permissoes.
- `buscarDuplicatas(organizacaoId)` - Lista grupos de duplicatas pendentes (Admin only).
- `mesclarContatos(organizacaoId, usuarioId, payload)` - Mescla dois contatos (Admin only).

### 1.2 Service de Segmentos (`backend/src/services/segmentos.service.ts`)

- `listar(organizacaoId)` - Lista todos com contagem de contatos.
- `criar(organizacaoId, usuarioId, dados)` - Cria segmento (Admin only).
- `atualizar(id, organizacaoId, dados)` - Atualiza segmento.
- `excluir(id, organizacaoId)` - Soft delete.
- `vincular(contatoId, organizacaoId, segmentoIds)` - Vincula segmentos a contato.
- `desvincular(contatoId, organizacaoId, segmentoId)` - Remove vinculo.
- `segmentarLote(organizacaoId, payload)` - Adicionar/remover segmentos em massa.

### 1.3 Route de Contatos (`backend/src/routes/contatos.ts`)

Endpoints conforme PRD:

```text
GET    /              -> Listar com filtros
GET    /:id           -> Detalhe
POST   /              -> Criar
PATCH  /:id           -> Atualizar
DELETE /:id           -> Soft delete
DELETE /lote          -> Excluir em massa
PATCH  /lote/atribuir -> Atribuir vendedor em massa
GET    /duplicatas    -> Listar duplicatas
POST   /mesclar       -> Mesclar duplicatas
GET    /exportar      -> Exportar CSV
POST   /exportar      -> Exportar selecionados
POST   /:id/segmentos    -> Vincular segmentos
DELETE /:id/segmentos/:segId -> Desvincular
POST   /lote/segmentos   -> Segmentar em massa
```

Middlewares: `authMiddleware`, `requireTenant`, `requireRole('admin', 'member')`.
Rotas exclusivas de Admin (duplicatas, mesclar, atribuir lote) terao verificacao interna.

### 1.4 Route de Segmentos (`backend/src/routes/segmentos.ts`)

```text
GET    /     -> Listar (Admin + Member)
POST   /     -> Criar (Admin only)
PATCH  /:id  -> Atualizar (Admin only)
DELETE /:id  -> Soft delete (Admin only)
```

### 1.5 Registro no Index (`backend/src/index.ts`)

Adicionar imports e mount points:
```text
app.use('/api/v1/contatos', authMiddleware, requireTenant, contatosRoutes)
app.use('/api/v1/segmentos', authMiddleware, requireTenant, segmentosRoutes)
```

---

## Fase 2: Frontend - Modulo de Contatos

### 2.1 Estrutura de Pastas

```text
src/modules/contatos/
  index.ts                          -> Barrel exports
  services/
    contatos.api.ts                 -> Chamadas API via axios
  hooks/
    useContatos.ts                  -> React Query hooks
    useSegmentos.ts                 -> React Query hooks segmentos
  schemas/
    contatos.schema.ts              -> Schemas Zod para formularios
  pages/
    ContatosPage.tsx                -> Pagina principal com tabs Pessoas/Empresas
  components/
    ContatosList.tsx                -> Tabela com checkbox, colunas fixas + dinamicas
    ContatoFormModal.tsx            -> Modal criar/editar (Pessoa ou Empresa)
    ContatoViewModal.tsx            -> Modal visualizacao com abas (Dados + Historico)
    ContatoFilters.tsx              -> Painel de filtros
    ContatoSearchBar.tsx            -> Busca com debounce
    ContatoColumnsToggle.tsx        -> Popover de toggle de colunas
    ContatoBulkActions.tsx          -> Barra flutuante de acoes em massa
    SegmentosManager.tsx            -> Modal CRUD de segmentos
    SegmentoBadge.tsx               -> Badge colorido de segmento
    ImportarContatosModal.tsx       -> Wizard 4 etapas de importacao
    ExportarContatosModal.tsx       -> Modal de exportacao CSV
    DuplicatasModal.tsx             -> Modal de duplicatas
    AtribuirVendedorDropdown.tsx    -> Dropdown para atribuir em massa
    SegmentarDropdown.tsx           -> Dropdown para segmentar em massa
    ConfirmarExclusaoModal.tsx      -> Modal de confirmacao/bloqueio
```

### 2.2 Service API (`services/contatos.api.ts`)

Usar `api` (axios com interceptors) conforme padrao existente. Rotas:

- `contatosApi.listar(params)` -> GET `/v1/contatos`
- `contatosApi.buscar(id)` -> GET `/v1/contatos/:id`
- `contatosApi.criar(payload)` -> POST `/v1/contatos`
- `contatosApi.atualizar(id, payload)` -> PATCH `/v1/contatos/:id`
- `contatosApi.excluir(id)` -> DELETE `/v1/contatos/:id`
- `contatosApi.excluirLote(payload)` -> DELETE `/v1/contatos/lote`
- `contatosApi.atribuirLote(payload)` -> PATCH `/v1/contatos/lote/atribuir`
- `contatosApi.duplicatas()` -> GET `/v1/contatos/duplicatas`
- `contatosApi.mesclar(payload)` -> POST `/v1/contatos/mesclar`
- `contatosApi.exportar(params)` -> GET `/v1/contatos/exportar`
- `contatosApi.exportarSelecionados(payload)` -> POST `/v1/contatos/exportar`
- `segmentosApi.listar()` -> GET `/v1/segmentos`
- `segmentosApi.criar(payload)` -> POST `/v1/segmentos`
- `segmentosApi.atualizar(id, payload)` -> PATCH `/v1/segmentos/:id`
- `segmentosApi.excluir(id)` -> DELETE `/v1/segmentos/:id`
- `segmentosApi.vincular(contatoId, segmentoIds)` -> POST `/v1/contatos/:id/segmentos`
- `segmentosApi.desvincular(contatoId, segmentoId)` -> DELETE `/v1/contatos/:id/segmentos/:segId`
- `segmentosApi.segmentarLote(payload)` -> POST `/v1/contatos/lote/segmentos`

### 2.3 Hooks React Query (`hooks/useContatos.ts` e `hooks/useSegmentos.ts`)

Seguindo padrao existente em `useEquipe.ts`:
- `useContatos(params)` - Listagem com filtros
- `useContato(id)` - Detalhe
- `useCriarContato()` - Mutation
- `useAtualizarContato()` - Mutation
- `useExcluirContato()` - Mutation
- `useExcluirContatosLote()` - Mutation
- `useAtribuirContatosLote()` - Mutation
- `useDuplicatas()` - Query
- `useMesclarContatos()` - Mutation
- `useSegmentos()` - Query
- `useCriarSegmento()` - Mutation
- `useAtualizarSegmento()` - Mutation
- `useExcluirSegmento()` - Mutation

### 2.4 Pagina Principal (`ContatosPage.tsx`)

- Tabs "Pessoas" / "Empresas" com contadores (URL: `/app/contatos/pessoas` e `/app/contatos/empresas`)
- Toolbar com busca, filtros, toggle de colunas
- Botoes: "+ Novo Contato", "Importar", "Exportar", "Duplicatas" (Admin only)
- Tabela com checkbox de selecao
- Barra flutuante de acoes em massa (quando ha selecao)
- Integra com campos customizados de `/configuracoes/campos` para colunas dinamicas

### 2.5 Componentes Principais

**ContatosList:** Tabela com colunas fixas conforme PRD (Nome, Empresa Vinculada, Segmentacao, Atribuido A, Status, Acoes para Pessoas; Nome Empresa, Pessoa Vinculada, Status, Acoes para Empresas). Colunas dinamicas via campos customizados. Checkbox para selecao.

**ContatoFormModal:** Formulario dinamico baseado no tipo (Pessoa/Empresa). Renderiza campos customizados de `/configuracoes/campos` (usando API existente `camposApi.listar('pessoa')` / `camposApi.listar('empresa')`). Seletor de empresa para vincular pessoa. Seletor de status, segmentos e responsavel (Admin only).

**ContatoViewModal:** Modal com abas - Pessoas tem "Dados do Contato" + "Historico de Oportunidades"; Empresas tem apenas "Dados da Empresa". Exibe campos customizados. Botoes Editar, Excluir, Fechar.

**ContatoBulkActions:** Barra sticky no rodape com acoes: Exportar, Excluir (ambos), Atribuir Vendedor e Segmentacao (apenas Pessoas). Mostra contagem de selecionados.

### 2.6 Roteamento (`App.tsx`)

Adicionar rotas dentro do bloco `/app`:
```text
/app/contatos           -> ContatosPage (redireciona para /pessoas)
/app/contatos/pessoas   -> ContatosPage (tab Pessoas)
/app/contatos/empresas  -> ContatosPage (tab Empresas)
```

---

## Fase 3: Integracoes Criticas

### 3.1 Campos Customizados

O formulario de contatos deve buscar campos de `/configuracoes/campos` via `camposApi.listar('pessoa')` e `camposApi.listar('empresa')` e renderiza-los dinamicamente, respeitando tipo (texto, select, email, telefone, url, cpf, cnpj), obrigatoriedade e ordem.

### 3.2 Visibilidade por Role (RF-012)

- **Admin**: Ve todos contatos, todos filtros, acoes de duplicatas/importacao/atribuicao
- **Member**: Ve apenas contatos onde `owner_id` = seu ID, sem filtro de responsavel, sem duplicatas/importacao, sem atribuir vendedor em massa

### 3.3 Design System

Todos componentes seguirao rigorosamente o `docs/designsystem.md`:
- Modais: `rounded-lg`, `shadow-lg`, padding `p-6`
- Botoes: variante primary/secondary/destructive com `rounded-md`
- Tabela: `px-4 py-3` por celula, header com `text-sm font-medium`
- Badges de segmento: `rounded-full` com cor de fundo e texto
- Toast via `sonner` para feedback
- Espacamento: `gap-2`, `space-y-4` conforme padrao

---

## Observacao sobre Importacao/Exportacao

A importacao CSV/XLSX (RF-008) e a exportacao (RF-009) serao implementadas com interface no frontend, porem a logica pesada de parsing CSV/XLSX sera feita no backend. O frontend fara upload do arquivo e o backend processara. Como nao ha biblioteca de parsing CSV instalada no frontend, o backend sera responsavel pelo processamento.

---

## Sequencia de Implementacao

1. Backend: Service de Segmentos + Route de Segmentos
2. Backend: Service de Contatos + Route de Contatos
3. Backend: Registro no index.ts
4. Frontend: Service API + Hooks + Schemas
5. Frontend: ContatosPage + ContatosList + abas Pessoas/Empresas
6. Frontend: ContatoFormModal (criar/editar)
7. Frontend: ContatoViewModal (visualizacao)
8. Frontend: Filtros, busca, toggle de colunas
9. Frontend: Selecao em lote + barra de acoes
10. Frontend: SegmentosManager
11. Frontend: DuplicatasModal
12. Frontend: ImportarContatosModal + ExportarContatosModal
13. Frontend: Roteamento no App.tsx
14. Testes end-to-end

---

## Estimativa

Este e um modulo extenso (o maior do sistema ate agora). A implementacao completa sera feita em multiplas etapas, priorizando o CRUD basico funcional primeiro e depois funcionalidades avancadas (importacao, duplicatas, acoes em massa).

