import { NavLink } from 'react-router-dom'
import {
  Users,
  Target,
  Settings,
  Plug,
  ArrowDownToLine,
  Send,
  Settings2,
  Package,
  Flag,
  ListChecks,
  Layers,
  Scale,
  LayoutGrid,
} from 'lucide-react'

/**
 * AIDEV-NOTE: Sidebar lateral do módulo Configurações
 * Visível apenas em desktop (lg+). Mobile usa drawer existente.
 * Itens agrupados por seção com ícones individuais.
 */

export interface SidebarSubItem {
  label: string
  path: string
  icon: React.ElementType
  adminOnly?: boolean
}

export interface SidebarGroup {
  key: string
  label: string
  adminOnly: boolean
  items: SidebarSubItem[]
}

export const sidebarGroups: SidebarGroup[] = [
  {
    key: 'geral',
    label: 'Geral',
    adminOnly: true,
    items: [
      { label: 'Config Geral', path: '/app/configuracoes/config-geral', icon: Settings, adminOnly: true },
    ],
  },
  {
    key: 'equipe',
    label: 'Equipe',
    adminOnly: true,
    items: [
      { label: 'Membros', path: '/app/configuracoes/membros', icon: Users },
      { label: 'Perfis', path: '/app/configuracoes/perfis', icon: Users },
      { label: 'Metas', path: '/app/configuracoes/metas', icon: Target },
    ],
  },
  {
    key: 'conexoes',
    label: 'Conexões',
    adminOnly: true,
    items: [
      { label: 'Conexões', path: '/app/configuracoes/conexoes', icon: Plug },
      { label: 'Webhooks Entrada', path: '/app/configuracoes/webhooks-entrada', icon: ArrowDownToLine },
      { label: 'Webhooks Saída', path: '/app/configuracoes/webhooks-saida', icon: Send },
    ],
  },
  {
    key: 'pipeline',
    label: 'Pipeline',
    adminOnly: false,
    items: [
      { label: 'Campos', path: '/app/configuracoes/campos', icon: Settings2 },
      { label: 'Produtos', path: '/app/configuracoes/produtos', icon: Package },
      { label: 'Motivos', path: '/app/configuracoes/motivos', icon: Flag },
      { label: 'Tarefas', path: '/app/configuracoes/tarefas', icon: ListChecks },
      { label: 'Etapas', path: '/app/configuracoes/etapas', icon: Layers },
      { label: 'Qualificação', path: '/app/configuracoes/regras', icon: Scale },
      { label: 'Cards', path: '/app/configuracoes/cards', icon: LayoutGrid, adminOnly: true },
    ],
  },
]

/** Mapeamento de títulos de página (quando diferente do label do menu) */
const pageTitleOverrides: Record<string, string> = {
  '/app/configuracoes/regras': 'Regras de Qualificação',
  '/app/configuracoes/cards': 'Cards da Oportunidade',
}

/** Retorna o título da página com base no pathname */
export function getPageTitleFromSidebar(pathname: string): string {
  if (pageTitleOverrides[pathname]) return pageTitleOverrides[pathname]
  for (const group of sidebarGroups) {
    for (const item of group.items) {
      if (pathname.startsWith(item.path)) return item.label
    }
  }
  return 'Configurações'
}

interface ConfigSidebarProps {
  isAdmin: boolean
}

export function ConfigSidebar({ isAdmin }: ConfigSidebarProps) {
  const visibleGroups = sidebarGroups.filter(g => !g.adminOnly || isAdmin)

  return (
    <aside className="hidden lg:flex flex-col w-60 fixed left-0 top-14 bottom-0 bg-white border-r border-gray-200/60 overflow-y-auto z-40">
      {/* Grupos de navegação */}
      <nav className="flex-1 px-3 pt-5 pb-4 space-y-5">
        {visibleGroups.map(group => (
          <div key={group.key}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items
                .filter(item => !item.adminOnly || isAdmin)
                .map(item => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-primary/5 text-primary font-medium border border-primary/40'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
