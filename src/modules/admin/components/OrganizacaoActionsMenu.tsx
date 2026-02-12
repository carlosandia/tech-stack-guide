/**
 * AIDEV-NOTE: Menu de ações usando Radix DropdownMenu
 * Radix resolve posicionamento e portal automaticamente.
 */

import { Eye, Settings, User, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVisualizar: () => void
  onGerenciarModulos: () => void
  onImpersonar: () => void
}

export function OrganizacaoActionsMenu({
  open,
  onOpenChange,
  onVisualizar,
  onGerenciarModulos,
  onImpersonar,
}: Props) {
  const actions = [
    { key: 'visualizar', label: 'Visualizar', Icon: Eye, onClick: onVisualizar },
    { key: 'modulos', label: 'Gerenciar Módulos', Icon: Settings, onClick: onGerenciarModulos },
    { key: 'impersonar', label: 'Impersonar', Icon: User, onClick: onImpersonar },
  ]

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="p-2 hover:bg-accent rounded-lg" aria-label="Ações">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-48">
        {actions.map(({ key, label, Icon, onClick }) => (
          <DropdownMenuItem key={key} onClick={onClick} className="flex items-center gap-2 cursor-pointer">
            <Icon className="w-4 h-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
