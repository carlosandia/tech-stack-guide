/**
 * AIDEV-NOTE: Dropdown para atribuir vendedor em massa
 * Conforme PRD-06 RF-016 - Apenas Admin, apenas Pessoas
 */

import { useState, useRef, useEffect } from 'react'
import { UserCheck, X } from 'lucide-react'
import { useUsuarios } from '@/modules/configuracoes/hooks/useEquipe'
import { useAtribuirContatosLote } from '../hooks/useContatos'

interface AtribuirVendedorDropdownProps {
  selectedIds: string[]
  onComplete: () => void
}

export function AtribuirVendedorDropdown({ selectedIds, onComplete }: AtribuirVendedorDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: usuariosData } = useUsuarios({ ativo: 'true' })
  const atribuirLote = useAtribuirContatosLote()

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const usuarios = usuariosData?.usuarios || []

  const handleAtribuir = (ownerId: string | null) => {
    atribuirLote.mutate(
      { ids: selectedIds, owner_id: ownerId },
      { onSuccess: () => { setOpen(false); onComplete() } }
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-background/10 transition-colors"
        title="Atribuir vendedor"
      >
        <UserCheck className="w-4 h-4" />
        <span className="hidden sm:inline">Atribuir</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-background rounded-lg shadow-lg border border-border py-1 z-50">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground">
              Atribuir {selectedIds.length} contato(s) para:
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {usuarios.map((u: any) => (
              <button
                key={u.id}
                onClick={() => handleAtribuir(u.id)}
                disabled={atribuirLote.isPending}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    {u.nome?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{u.nome} {u.sobrenome || ''}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-border pt-1">
            <button
              onClick={() => handleAtribuir(null)}
              disabled={atribuirLote.isPending}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
              Remover atribuição
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
