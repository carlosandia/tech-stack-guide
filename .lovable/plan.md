

# Reorganizacao do Menu Header - Agrupamento por Hub

## Contexto e Problema

Hoje o header do CRM exibe 8 modulos lado a lado (Dashboard, Contatos, Negocios, Conversas, Emails, Tarefas, Formularios, Automacoes), ocupando quase 100% do width. Com modulos futuros (ex: Relatorios, Campanhas, Base de Conhecimento), nao ha espaco.

## Como os grandes CRMs resolvem isso

### HubSpot (2024+)
Migrou de top navigation para **sidebar lateral** com modulos agrupados por "hub": CRM, Marketing, Content, Commerce, Automations, Reporting, etc. Cada grupo abre submenus.

### Pipedrive (2024+)
Usa **sidebar esquerda** com itens agrupados: Deals, Leads, Contacts, Activities, Campaigns, Projects, Insights. Permite customizar quais itens aparecem.

### RD Station
Usa **top bar** com poucos itens agrupados + dropdowns com subitens por area.

## Proposta para o CRM Renove

**Estrategia: Header horizontal com agrupamento por "Hub" usando Dropdowns**

Manter a arquitetura horizontal (conforme Design System secao 11 - decisao IMUTAVEL), mas **agrupar modulos em 3-4 categorias** com dropdown menus, reduzindo de 8 itens individuais para ~5 itens no header.

### Agrupamento Proposto

```text
Header:
[Logo RENOVE]   Dashboard | Comercial v | Atendimento v | Ferramentas v   [?] [gear] [bell] [Avatar v]
```

| Hub | Modulos incluidos | Icone do Hub |
|-----|-------------------|--------------|
| **Dashboard** | Acesso direto (sem dropdown) | LayoutDashboard |
| **Comercial** | Negocios, Contatos | Briefcase |
| **Atendimento** | Conversas, Emails | MessageSquare |
| **Ferramentas** | Tarefas, Formularios, Automacoes | Wrench |

**Futuramente**, novos modulos entram nos hubs existentes ou criam um novo:
- Relatorios -> pode virar item direto ou entrar em "Ferramentas"
- Campanhas/Marketing -> novo hub "Marketing"
- Base de Conhecimento -> "Atendimento"

### Comportamento dos Dropdowns

- Hover ou click abre um **popover/dropdown** com os subitens
- Cada subitem tem icone + label
- Item ativo: o hub pai fica destacado (border-primary/40 + bg-primary/5)
- Modulos bloqueados: exibidos com opacity-60 + cadeado (padrao existente)
- Mobile: no drawer, os hubs viram grupos colapsaveis

### Anatomia Visual Desktop

```text
+--------------------------------------------------------------------------------+
| [Logo]   Dashboard  | Comercial v  | Atendimento v  | Ferramentas v  [?][gear][bell][Av]
+--------------------------------------------------------------------------------+
                        +------------------+
                        | Briefcase Negocios   |
                        | Users     Contatos   |
                        +------------------+
```

### Mobile (Drawer)

```text
+---------------------------+
| [Logo]            [X]     |
+---------------------------+
| Dashboard                 |
|                           |
| COMERCIAL                 |
|   Negocios                |
|   Contatos                |
|                           |
| ATENDIMENTO               |
|   Conversas               |
|   Emails                  |
|                           |
| FERRAMENTAS               |
|   Tarefas                 |
|   Formularios             |
|   Automacoes              |
+---------------------------+
```

## Implementacao Tecnica

### Arquivos a alterar

1. **`src/modules/app/layouts/AppLayout.tsx`** - Reestruturar `menuItems` de array flat para array de hubs com subitens. Substituir NavItems individuais por componentes de dropdown (usar Radix `DropdownMenu` ou `Popover`).

2. **`docs/designsystem.md`** - Atualizar secao 11 com novo padrao de "Hub Dropdown Navigation", mantendo a regra de navegacao horizontal.

### Estrutura de dados proposta

```typescript
interface NavHub {
  label: string
  icon: React.ElementType
  // Se path definido, acesso direto (sem dropdown)
  path?: string
  exact?: boolean
  slug?: string
  // Se children definido, abre dropdown
  children?: NavHubItem[]
}

interface NavHubItem {
  label: string
  path: string
  icon: React.ElementType
  slug: string
}

const navHubs: NavHub[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    exact: true,
    slug: 'dashboard',
  },
  {
    label: 'Comercial',
    icon: Briefcase,
    children: [
      { label: 'Negocios', path: '/negocios', icon: Briefcase, slug: 'negocios' },
      { label: 'Contatos', path: '/contatos', icon: Users, slug: 'contatos' },
    ],
  },
  {
    label: 'Atendimento',
    icon: MessageSquare,
    children: [
      { label: 'Conversas', path: '/conversas', icon: MessageSquare, slug: 'conversas' },
      { label: 'Emails', path: '/emails', icon: Mail, slug: 'caixa-entrada-email' },
    ],
  },
  {
    label: 'Ferramentas',
    icon: Wrench,
    children: [
      { label: 'Tarefas', path: '/tarefas', icon: CheckSquare, slug: 'atividades' },
      { label: 'Formularios', path: '/formularios', icon: FileText, slug: 'formularios' },
      { label: 'Automacoes', path: '/automacoes', icon: Zap, slug: 'automacoes' },
    ],
  },
]
```

### Componente NavHubDropdown

Usar `DropdownMenu` do Radix (ja instalado) para cada hub com children. O trigger mostra o label + ChevronDown. O content mostra os subitens como `DropdownMenuItem` com NavLink interno.

### Destaque do hub ativo

Verificar se algum filho do hub tem path que corresponde ao `location.pathname`. Se sim, o trigger do hub recebe o estilo ativo (`border-primary/40 bg-primary/5 text-primary`).

### Modulos bloqueados

Manter logica existente: verificar `modulosAtivos` para cada subitem. Items bloqueados exibidos com `opacity-60 cursor-not-allowed Lock icon`.

## Escopo

- Alterar apenas `AppLayout.tsx` (layout principal do CRM)
- Atualizar drawer mobile para usar grupos
- Manter compatibilidade com `ModuloGuard` e sistema de bloqueio
- Nao alterar rotas, apenas a navegacao visual

