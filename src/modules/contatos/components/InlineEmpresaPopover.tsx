/**
 * AIDEV-NOTE: Popover inline para selecionar/alterar empresa vinculada
 * Usado na tabela de contatos (pessoas) — coluna Empresa
 */

import { useState, useRef, useEffect } from 'react'
import { Search, X, Building2 } from 'lucide-react'
import { useContatos, useAtualizarContato } from '../hooks/useContatos'

interface InlineEmpresaPopoverProps {
  contatoId: string
  empresaAtual?: { id: string; nome_fantasia?: string; razao_social?: string } | null
  children: React.ReactNode
}

export function InlineEmpresaPopover({ contatoId, empresaAtual, children }: InlineEmpresaPopoverProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const atualizar = useAtualizarContato()

  const { data: empresasData } = useContatos({ tipo: 'empresa', limit: 100, busca: search || undefined })
  const empresas = empresasData?.contatos || []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleSelect = (empresaId: string | null) => {
    atualizar.mutate({ id: contatoId, payload: { empresa_id: empresaId } })
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={ref} className="relative">
      <div
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 transition-colors"
      >
        {children}
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-background rounded-md shadow-lg border border-border py-1 z-[600]" onClick={e => e.stopPropagation()}>
          <div className="px-2 pb-1 pt-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[200px] overflow-y-auto">
            {/* Opção para remover vínculo */}
            {empresaAtual && (
              <button
                onClick={() => handleSelect(null)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Remover vínculo
              </button>
            )}

            {empresas.map(emp => (
              <button
                key={emp.id}
                onClick={() => handleSelect(emp.id)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left ${
                  empresaAtual?.id === emp.id ? 'bg-primary/5 text-primary' : 'text-foreground'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">{emp.nome_fantasia || emp.razao_social || '—'}</span>
              </button>
            ))}

            {empresas.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma empresa encontrada</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
