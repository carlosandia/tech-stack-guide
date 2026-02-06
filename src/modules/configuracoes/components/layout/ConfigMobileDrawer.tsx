import { NavLink } from 'react-router-dom'
import { X, LogOut } from 'lucide-react'
import { sidebarGroups } from './ConfigSidebar'

/**
 * AIDEV-NOTE: Drawer mobile do módulo Configurações
 * Usa os mesmos dados de sidebarGroups para consistência
 */

interface ConfigMobileDrawerProps {
  open: boolean
  onClose: () => void
  isAdmin: boolean
  onLogout: () => void
}

export function ConfigMobileDrawer({ open, onClose, isAdmin, onLogout }: ConfigMobileDrawerProps) {
  const visibleGroups = sidebarGroups.filter(g => !g.adminOnly || isAdmin)

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[200] bg-foreground/20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-[300] w-64 bg-white/95 backdrop-blur-md border-r border-gray-200/60
          transform transition-transform duration-200 ease-in-out lg:hidden
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-200/60">
          <span className="font-semibold text-foreground">Configurações</span>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="p-4 space-y-4">
          {visibleGroups.map(group => (
            <div key={group.key}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
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
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                            isActive
                              ? 'bg-primary/5 text-primary font-medium border border-primary/40'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                      </NavLink>
                    )
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/60">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>
    </>
  )
}
