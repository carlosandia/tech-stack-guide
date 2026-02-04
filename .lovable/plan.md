

# Plano de Implementacao - CRM Renove

## Visao Geral

Este plano aborda duas etapas: **correcao imediata dos erros de build** e **implementacao sequencial do frontend** seguindo a ordem definida no PRD-00.

---

## ETAPA 1: Correcao de Erros de Build (Prioridade Imediata)

### 1.1 AdminLayout.tsx - Erro de metodo inexistente

| Item | Detalhe |
|------|---------|
| **Arquivo** | `src/modules/admin/layouts/AdminLayout.tsx` |
| **Linha** | 57 |
| **Problema** | Uso de `logout` que nao existe no `AuthContextType` |
| **Solucao** | Alterar `logout` para `signOut` conforme definido no AuthProvider |

**Alteracoes:**
- Linha 57: `const { user, logout } = useAuth()` → `const { user, signOut } = useAuth()`
- Linhas 63-64: `await logout()` → `await signOut()`

### 1.2 LoginForm.tsx - Variavel nao utilizada

| Item | Detalhe |
|------|---------|
| **Arquivo** | `src/modules/auth/components/LoginForm.tsx` |
| **Linha** | 40 |
| **Problema** | `isValid` declarada mas nunca usada |
| **Solucao** | Remover `isValid` do destructuring |

**Alteracao:**
- Linha 40: `formState: { errors, isValid },` → `formState: { errors },`

### 1.3 LoginPage.tsx - Import nao utilizado

| Item | Detalhe |
|------|---------|
| **Arquivo** | `src/modules/auth/pages/LoginPage.tsx` |
| **Linha** | 7 |
| **Problema** | Import `env` declarado mas nunca usado |
| **Solucao** | Remover a linha de import |

**Alteracao:**
- Remover linha 7: `import { env } from '@/config/env'`

### 1.4 organizacao.ts - Import nao utilizado

| Item | Detalhe |
|------|---------|
| **Arquivo** | `src/shared/schemas/organizacao.ts` |
| **Linha** | 2 |
| **Problema** | `TimestampsSchema` importado mas nunca usado |
| **Solucao** | Remover do import |

**Alteracao:**
- Linha 2: `import { UUIDSchema, TimestampsSchema } from './common'` → `import { UUIDSchema } from './common'`

### 1.5 usuario.ts - Import nao utilizado

| Item | Detalhe |
|------|---------|
| **Arquivo** | `src/shared/schemas/usuario.ts` |
| **Linha** | 2 |
| **Problema** | `TimestampsSchema` importado mas nunca usado |
| **Solucao** | Remover do import |

**Alteracao:**
- Linha 2: `import { UUIDSchema, UserRoleSchema, TimestampsSchema } from './common'` → `import { UUIDSchema, UserRoleSchema } from './common'`

---

## ETAPA 2: Acao Manual do Usuario

### 2.1 Script build:dev no package.json

O Lovable requer um script `build:dev` para compilacao em modo desenvolvimento.

**Instrucao:** Adicionar manualmente no `package.json` dentro de `"scripts"`:

```json
"build:dev": "vite build --mode development"
```

---

## ETAPA 3: Ordem de Implementacao do Frontend

Seguindo rigorosamente o PRD-00 (Indice Geral), a ordem e:

### Fase 0: Fundacao + Bootstrap (CRITICA)

| Prioridade | Modulo | PRD | Escopo |
|------------|--------|-----|--------|
| **1** | Login Aprimorado | PRD-03 | Tela completa conforme RF-021 a RF-023 |
| **2** | Super Admin - Layout | PRD-14 | Layout `/admin` com Header conforme Design System |
| **3** | Super Admin - Dashboard | PRD-14 | RF-001: Cards de metricas globais |
| **4** | Super Admin - Organizacoes | PRD-14 | RF-002 a RF-011: CRUD Tenants + Wizard criacao |
| **5** | Super Admin - Detalhes Tenant | PRD-14 | RF-012 a RF-019: 3 abas (Usuarios, Relatorios, Config) |

### Fase 1: Configuracoes do Tenant (Admin)

| Prioridade | Modulo | PRD | Escopo |
|------------|--------|-----|--------|
| **6** | Layout App | Design System | Header + Toolbar horizontal para `/app` |
| **7** | Configuracoes - Campos | PRD-05 | RF-001 a RF-004: CRUD campos personalizados |
| **8** | Configuracoes - Produtos | PRD-05 | RF-005 a RF-007: CRUD produtos |
| **9** | Configuracoes - Etapas Funil | PRD-05 | RF-008 a RF-010: CRUD etapas com drag-drop |
| **10** | Configuracoes - Tarefas Template | PRD-05 | RF-011: Templates de tarefas |
| **11** | Configuracoes - Regras | PRD-05 | RF-012: Regras de automacao |
| **12** | Configuracoes - Webhooks | PRD-05 | RF-013: CRUD webhooks |
| **13** | Configuracoes - Equipe | PRD-05 | RF-014: Gerenciamento de membros |
| **14** | Configuracoes - Metas | PRD-05 | RF-015 a RF-019: Sistema hierarquico de metas |

### Fase 2: Core CRM

| Prioridade | Modulo | PRD | Escopo |
|------------|--------|-----|--------|
| **15** | Contatos - Pessoas | PRD-06 | RF-001 a RF-016: Listagem, filtros, CRUD, acoes em massa |
| **16** | Contatos - Empresas | PRD-06 | Mesma estrutura de Pessoas |
| **17** | Contatos - Segmentacao | PRD-06 | Sistema de tags com nome + cor |
| **18** | Contatos - Import/Export | PRD-06 | CSV/XLSX ate 5MB, 4 etapas |
| **19** | Negocios - Kanban | PRD-07 | RF-001 a RF-011: Pipeline drag-drop |
| **20** | Negocios - Modal Oportunidade | PRD-07 | RF-014: 5 abas (Anotacoes, Tarefas, Docs, Email, Agenda) |
| **21** | Negocios - Pre-Oportunidades | PRD-07 | Triagem WhatsApp (Solicitacoes) |
| **22** | Conexoes - WhatsApp | PRD-08 | Integracao WAHA Plus |
| **23** | Conexoes - Meta Ads | PRD-08 | Lead Ads, CAPI, Audiences |
| **24** | Conexoes - Google | PRD-08 | Calendar integration |
| **25** | Conexoes - Email | PRD-08 | IMAP/SMTP pessoal |

### Fase 3: Comunicacao

| Prioridade | Modulo | PRD | Escopo |
|------------|--------|-----|--------|
| **26** | Conversas - Lista | PRD-09 | RF-001 a RF-005: Lista com preview |
| **27** | Conversas - Chat | PRD-09 | RF-006 a RF-010: Janela de mensagens |
| **28** | Conversas - Mensagens Prontas | PRD-09 | RF-011: Comandos com `/` |
| **29** | Conversas - Agendamento | PRD-09 | RF-014: Envio programado |
| **30** | Tarefas - Acompanhamento | PRD-10 | RF-001 a RF-007: Visao centralizada |

### Fase 4: Avancado

| Prioridade | Modulo | PRD | Escopo |
|------------|--------|-----|--------|
| **31** | Feedback - Botao Flutuante | PRD-15 | RF-001 a RF-003: Popover envio |
| **32** | Feedback - Modulo Evolucao | PRD-15 | RF-004 a RF-007: Gestao Super Admin |

---

## Secao Tecnica

### Padroes do Design System (designsystem.md)

**Cores Primarias:**
- Primary: `#3B82F6` (blue-500)
- Destructive: `#EF4444` (red-500)
- Success: `#22C55E` (green-500)
- Warning: `#F59E0B` (amber-500)

**Tipografia:**
- Fonte: Inter
- Titulos: 24px-48px, font-semibold
- Corpo: 14px-16px, font-normal
- Labels: 12px-14px, font-medium

**Espacamento:**
- Base: 8px
- Sub-grid: 4px
- Padding containers: 16px-24px

**Border Radius:**
- Inputs/Buttons: `rounded-md` (8px)
- Cards/Modals: `rounded-lg` (12px)
- Badges: `rounded-full`

**Layout CRM:**
- Header horizontal fixo no topo (NAO sidebar)
- Toolbar contextual abaixo do header
- Area de conteudo com scroll
- Mobile-first, breakpoints: xs/sm/md/lg/xl/2xl

### Estrutura de Pastas

```text
src/
  modules/
    auth/              # Login, ForgotPassword, ResetPassword
    admin/             # Super Admin (/admin) - PRD-14
    app/               # Admin/Member (/app)
      layouts/
      pages/
    contatos/          # PRD-06
    negocios/          # PRD-07
    conexoes/          # PRD-08
    conversas/         # PRD-09
    tarefas/           # PRD-10
    configuracoes/     # PRD-05
    feedback/          # PRD-15
  shared/
    components/ui/     # shadcn/ui components
    hooks/
    schemas/
```

### Padrao CRUD por Modulo

Cada modulo tera:

1. **Services (`.api.ts`)**: Funcoes que chamam endpoints do backend
2. **Hooks (React Query)**: Custom hooks para cache, mutations, invalidacao
3. **Schemas (Zod)**: Validacao de formularios
4. **Components**: Table, Modal, Form, Filters

**Exemplo de conexao frontend-backend:**

```typescript
// services/contatos.api.ts
export const contatosApi = {
  listar: (params) => api.get('/api/v1/contatos', { params }),
  criar: (data) => api.post('/api/v1/contatos', data),
  atualizar: (id, data) => api.patch(`/api/v1/contatos/${id}`, data),
  excluir: (id) => api.delete(`/api/v1/contatos/${id}`),
}

// hooks/useContatos.ts
export function useContatos(params) {
  return useQuery({
    queryKey: ['contatos', params],
    queryFn: () => contatosApi.listar(params),
  })
}
```

---

## Proximos Passos Apos Aprovacao

1. Corrigir os 5 erros de build (Etapa 1)
2. Confirmar com usuario sobre script `build:dev` (Etapa 2)
3. Iniciar implementacao do Login aprimorado (PRD-03)

