
# Plano de Implementação - PRD-14 (Super Admin) - Frontend Completo

## Contexto

Conforme análise do PRD-00 (Índice Geral), o **PRD-14 (Super Admin)** é parte da **Fase 0 (CRÍTICA)** e deve ser completado ANTES de qualquer outro módulo CRM, pois é através dele que se cria o primeiro tenant e Admin do sistema.

### Status Atual

| Componente | Status | Conectado ao Backend |
|------------|--------|---------------------|
| `DashboardPage.tsx` | ✅ Implementado | ✅ Sim |
| `OrganizacoesPage.tsx` | ⚠️ Parcial (apenas listagem) | ✅ Sim |
| Wizard Nova Organização | ❌ Faltando | Backend pronto |
| Detalhes da Organização | ❌ Faltando | Backend pronto |
| Gerenciamento de Módulos | ❌ Faltando | Backend pronto |
| Página de Planos | ❌ Placeholder | Backend pronto |
| Página de Configurações Globais | ❌ Placeholder | Backend pronto |

### Backend Disponível (admin.api.ts)

Todas as funções já estão implementadas:
- `listarOrganizacoes`, `obterOrganizacao`, `criarOrganizacao`
- `suspenderOrganizacao`, `reativarOrganizacao`, `impersonarOrganizacao`
- `listarUsuariosOrganizacao`, `obterLimitesOrganizacao`, `obterModulosOrganizacao`
- `listarPlanos`, `obterPlano`, `criarPlano`, `atualizarPlano`
- `listarConfigGlobais`, `obterConfigGlobal`, `atualizarConfigGlobal`, `testarConfigGlobal`

---

## Ordem de Implementação

| Prioridade | Tarefa | Descrição |
|------------|--------|-----------|
| 1 | Wizard Nova Organização | Modal 3 etapas para criar tenant + admin |
| 2 | Detalhes da Organização | Página com tabs (Usuários, Relatórios, Configurações) |
| 3 | Página de Planos | CRUD de planos com módulos |
| 4 | Página de Configurações Globais | Tabs para Meta, Google, WhatsApp, Stripe, Email |

---

## ETAPA 1: Wizard Nova Organização (3 Etapas)

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/modules/admin/components/NovaOrganizacaoModal.tsx` | Container do wizard |
| `src/modules/admin/components/wizard/Step1Empresa.tsx` | Dados da empresa |
| `src/modules/admin/components/wizard/Step2Expectativas.tsx` | Informações de qualificação |
| `src/modules/admin/components/wizard/Step3Admin.tsx` | Dados do primeiro admin |
| `src/modules/admin/hooks/useOrganizacoes.ts` | React Query mutations |
| `src/modules/admin/schemas/organizacao.schema.ts` | Validação Zod |

### Estrutura do Modal (PRD-14 RF-002)

```text
┌─────────────────────────────────────────────────────────────┐
│ [icon] Criar nova empresa                              [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         [1 Empresa]      [2 Expectativas]      [3 Admin]    │
│              ●                   ○                  ○        │
│                                                             │
│  (Conteúdo da etapa atual)                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Cancelar]                           [Voltar] [Próximo ->] │
└─────────────────────────────────────────────────────────────┘
```

### Etapa 1: Dados da Empresa

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| Nome da Empresa | texto | Sim | min: 2, max: 255 |
| Segmento | select | Sim | Lista pré-definida |
| Website | url | Não | Formato URL |
| Telefone | telefone | Não | Formato brasileiro |
| Email da Empresa | email | Sim | Formato email |
| **Endereço (opcional - accordion)** |
| CEP | texto | Não | 8 dígitos |
| Logradouro, Número, Complemento, Bairro, Cidade/Estado | - | - | - |

### Etapa 2: Expectativas

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Número de Usuários | select | Sim |
| Volume de Leads/Mês | select | Sim |
| Principal Objetivo | select | Sim |
| Como conheceu | select | Não |
| Observações | textarea | Não |

### Etapa 3: Dados do Administrador

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome | texto | Sim |
| Sobrenome | texto | Sim |
| Email | email | Sim (único) |
| Telefone | telefone | Não |
| Enviar convite por email | checkbox | Default: true |
| Senha inicial | senha | Condicional (se não enviar convite) |

### Estilo conforme Design System

| Elemento | Classes Tailwind |
|----------|-----------------|
| Modal Overlay | `fixed inset-0 bg-black/50 z-50` |
| Modal Container | `bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4` |
| Header | `px-6 py-4 border-b border-border flex items-center justify-between` |
| Stepper | `flex items-center justify-center gap-8 py-4` |
| Step Ativo | `text-primary font-medium` + círculo `bg-primary text-white` |
| Step Inativo | `text-muted-foreground` + círculo `border border-border` |
| Content | `p-6 space-y-4` |
| Footer | `px-6 py-4 border-t border-border flex justify-between` |
| Inputs | `h-11 rounded-md border-input focus:ring-2 focus:ring-primary` |
| Botão Primário | `bg-primary text-primary-foreground hover:bg-primary/90 h-11` |
| Botão Secundário | `border border-border text-foreground hover:bg-accent h-11` |

---

## ETAPA 2: Detalhes da Organização

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/modules/admin/pages/OrganizacaoDetalhesPage.tsx` | Página de detalhes |
| `src/modules/admin/components/OrganizacaoUsuariosTab.tsx` | Tab de usuários |
| `src/modules/admin/components/OrganizacaoRelatoriosTab.tsx` | Tab de métricas |
| `src/modules/admin/components/OrganizacaoConfigTab.tsx` | Tab de configurações |
| `src/modules/admin/components/GerenciarModulosModal.tsx` | Modal de módulos |

### Layout da Página (PRD-14 RF-012)

```text
┌─────────────────────────────────────────────────────────────────┐
│ <- Voltar    LitoralPlace                    [Suspender] [...]  │
│              software | Pro | Criado em 14/01/2026              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Usuários]    [Relatórios]    [Configurações]                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  (Conteúdo da tab ativa)                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tab Usuários

- Lista Admin + Members
- Último acesso de cada usuário
- Status (ativo/inativo)
- Ação: Ver perfil

### Tab Relatórios

- Cards com métricas do tenant:
  - Total de Oportunidades
  - Valor Total
  - Taxa de Conversão
  - Tempo Médio de Fechamento

### Tab Configurações

- Limites de uso vs utilização (barra de progresso)
- Módulos ativos (gerenciar)
- Plano atual (alterar)

---

## ETAPA 3: Página de Planos

### Arquivo a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/modules/admin/pages/PlanosPage.tsx` | CRUD de planos |
| `src/modules/admin/components/PlanoForm.tsx` | Formulário de plano |
| `src/modules/admin/components/PlanoModulosModal.tsx` | Vincular módulos |

### Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│ Planos                                          [+ Novo Plano]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ Trial       │ │ Starter     │ │ Pro         │ │ Enterprise │ │
│  │ Grátis      │ │ R$ 99/mês   │ │ R$ 249/mês  │ │ R$ 599/mês │ │
│  │ 2 usuários  │ │ 5 usuários  │ │ 15 usuários │ │ 50 usuários│ │
│  │ [Editar]    │ │ [Editar]    │ │ [Editar]    │ │ [Editar]   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ETAPA 4: Página de Configurações Globais

### Arquivo a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx` | Página principal |
| `src/modules/admin/components/ConfigMetaTab.tsx` | Configuração Meta |
| `src/modules/admin/components/ConfigGoogleTab.tsx` | Configuração Google |
| `src/modules/admin/components/ConfigStripeTab.tsx` | Configuração Stripe |
| `src/modules/admin/components/ConfigEmailTab.tsx` | Configuração Email |
| `src/modules/admin/components/ConfigWahaTab.tsx` | Configuração WAHA |

### Layout com Tabs

```text
┌─────────────────────────────────────────────────────────────────┐
│ Configurações Globais                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Meta]  [Google]  [WhatsApp]  [Stripe]  [Email]                │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  Meta Ads / Facebook / Instagram                                 │
│                                                                  │
│  App ID                                                          │
│  [123456789012345                              ]                 │
│                                                                  │
│  App Secret                                                      │
│  [********************************            ] [Mostrar]        │
│                                                                  │
│  Status: [●] Configurado                                         │
│                                                                  │
│  [Testar Conexão]                         [Salvar Alterações]   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Seção Técnica

### Hooks React Query (useOrganizacoes.ts)

```typescript
// Listar organizações
export function useOrganizacoes(params) {
  return useQuery({
    queryKey: ['admin', 'organizacoes', params],
    queryFn: () => adminApi.listarOrganizacoes(params),
  })
}

// Criar organização
export function useCreateOrganizacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminApi.criarOrganizacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizacoes'] })
    },
  })
}

// Obter detalhes
export function useOrganizacao(id: string) {
  return useQuery({
    queryKey: ['admin', 'organizacao', id],
    queryFn: () => adminApi.obterOrganizacao(id),
    enabled: !!id,
  })
}
```

### Schema Zod (organizacao.schema.ts)

```typescript
export const Step1EmpresaSchema = z.object({
  nome: z.string().min(2).max(255),
  segmento: z.string().min(1),
  email: z.string().email(),
  website: z.string().url().optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.object({...}).optional(),
})

export const Step2ExpectativasSchema = z.object({
  numero_usuarios: z.string().min(1),
  volume_leads_mes: z.string().min(1),
  principal_objetivo: z.string().min(1),
  como_conheceu: z.string().optional(),
  observacoes: z.string().optional(),
})

export const Step3AdminSchema = z.object({
  admin_nome: z.string().min(2),
  admin_sobrenome: z.string().min(2),
  admin_email: z.string().email(),
  admin_telefone: z.string().optional(),
  enviar_convite: z.boolean().default(true),
  senha_inicial: z.string().min(8).optional(),
})
```

### Atualização de Rotas (App.tsx)

```typescript
// Adicionar novas rotas
<Route path="organizacoes/nova" element={<NovaOrganizacaoPage />} />
<Route path="organizacoes/:id" element={<OrganizacaoDetalhesPage />} />
<Route path="organizacoes/:id/modulos" element={<OrganizacaoModulosPage />} />
<Route path="planos" element={<PlanosPage />} />
<Route path="configuracoes" element={<ConfiguracoesGlobaisPage />} />
```

---

## Critérios de Aceitação

### Wizard Nova Organização
- [ ] Modal abre ao clicar "Nova Organização"
- [ ] Stepper visual mostra progresso
- [ ] Validação por etapa antes de avançar
- [ ] Todos campos obrigatórios validados (Zod)
- [ ] Senha condicional (se não enviar convite)
- [ ] Sucesso cria tenant + admin
- [ ] Toast de confirmação ao finalizar
- [ ] Lista de organizações atualiza automaticamente

### Detalhes da Organização
- [ ] Header com nome, segmento, plano, data
- [ ] 3 tabs funcionais (Usuários, Relatórios, Config)
- [ ] Lista de usuários com último acesso
- [ ] Métricas do tenant carregando do backend
- [ ] Barra de limites de uso

### Planos
- [ ] Cards com todos planos
- [ ] Modal de edição funcionando
- [ ] Módulos vinculados ao plano

### Configurações Globais
- [ ] Tabs para cada plataforma
- [ ] Campos com máscaras de senha (*****)
- [ ] Botão "Testar Conexão" funcionando
- [ ] Status de configuração visível

---

## Estrutura Final de Arquivos

```text
src/modules/admin/
├── components/
│   ├── NovaOrganizacaoModal.tsx
│   ├── GerenciarModulosModal.tsx
│   ├── PlanoForm.tsx
│   ├── OrganizacaoUsuariosTab.tsx
│   ├── OrganizacaoRelatoriosTab.tsx
│   ├── OrganizacaoConfigTab.tsx
│   ├── ConfigMetaTab.tsx
│   ├── ConfigGoogleTab.tsx
│   ├── ConfigStripeTab.tsx
│   ├── ConfigEmailTab.tsx
│   ├── ConfigWahaTab.tsx
│   └── wizard/
│       ├── Step1Empresa.tsx
│       ├── Step2Expectativas.tsx
│       └── Step3Admin.tsx
├── hooks/
│   ├── useOrganizacoes.ts
│   ├── usePlanos.ts
│   └── useConfigGlobal.ts
├── schemas/
│   ├── organizacao.schema.ts
│   ├── plano.schema.ts
│   └── config-global.schema.ts
├── pages/
│   ├── DashboardPage.tsx (existente)
│   ├── OrganizacoesPage.tsx (existente)
│   ├── OrganizacaoDetalhesPage.tsx (novo)
│   ├── PlanosPage.tsx (novo)
│   └── ConfiguracoesGlobaisPage.tsx (novo)
├── layouts/
│   └── AdminLayout.tsx (existente)
├── services/
│   └── admin.api.ts (existente)
└── index.ts (atualizar exports)
```
