/**
 * AIDEV-NOTE: Combobox reutilizável de Origem (canal de aquisição)
 * Busca origens do banco, permite criar inline
 * Salva o slug no campo de destino (compatível com relatórios)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Search, Info, Check } from 'lucide-react'
import { useOrigensAtivas, useCriarOrigem } from '@/modules/configuracoes/hooks/useOrigens'
import type { Origem } from '@/modules/configuracoes/services/origens.api'

interface OrigemComboboxProps {
  value: string
  onChange: (slug: string) => void
  label?: string
  showTooltip?: boolean
  className?: string
}

export function OrigemCombobox({
  value,
  onChange,
  label = 'Origem',
  showTooltip = true,
  className = '',
}: OrigemComboboxProps) {
  const { data: origens, isLoading } = useOrigensAtivas()
  const criarOrigem = useCriarOrigem()

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [criandoNova, setCriandoNova] = useState(false)
  const [novaOrigemNome, setNovaOrigemNome] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCriandoNova(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = (origens || []).filter(o =>
    o.nome.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOrigem = origens?.find(o => o.slug === value)
  const displayValue = selectedOrigem?.nome || (value && value !== 'manual' ? value : 'Manual')

  const handleSelect = useCallback((origem: Origem) => {
    onChange(origem.slug)
    setOpen(false)
    setSearch('')
    setCriandoNova(false)
  }, [onChange])

  const handleCriarNova = useCallback(async () => {
    if (!novaOrigemNome.trim()) return
    try {
      const nova = await criarOrigem.mutateAsync({ nome: novaOrigemNome.trim() })
      onChange(nova.slug)
      setCriandoNova(false)
      setNovaOrigemNome('')
      setOpen(false)
      setSearch('')
    } catch {
      // toast já dispara no hook
    }
  }, [novaOrigemNome, criarOrigem, onChange])

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
          {label}
          {showTooltip && (
            <span className="relative group">
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-[10px] leading-snug text-popover-foreground bg-popover border border-border rounded-md shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
                Define o canal de aquisição deste lead.<br />Aparece no relatório "Por Canal de Origem" do Dashboard.
              </span>
            </span>
          )}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open)
          if (!open) setTimeout(() => inputRef.current?.focus(), 50)
        }}
        className="w-full h-10 px-3 text-sm text-left bg-background border border-input rounded-md hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors flex items-center justify-between"
      >
        <span className="truncate">{displayValue}</span>
        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-[500] max-h-64 flex flex-col overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar origem..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setOpen(false); setSearch('') }
                }}
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">Nenhuma origem encontrada</div>
            ) : (
              filtered.map(origem => (
                <button
                  key={origem.id}
                  type="button"
                  onClick={() => handleSelect(origem)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                >
                  <Check className={`w-3.5 h-3.5 flex-shrink-0 ${value === origem.slug ? 'text-primary' : 'text-transparent'}`} />
                  <span className="truncate text-foreground">{origem.nome}</span>
                  {origem.padrao_sistema && (
                    <span className="ml-auto text-[10px] text-muted-foreground">padrão</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Criar nova */}
          <div className="border-t border-border">
            {criandoNova ? (
              <div className="p-2 flex items-center gap-2">
                <input
                  type="text"
                  value={novaOrigemNome}
                  onChange={(e) => setNovaOrigemNome(e.target.value)}
                  placeholder="Nome da nova origem"
                  className="flex-1 px-2.5 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCriarNova()
                    if (e.key === 'Escape') { setCriandoNova(false); setNovaOrigemNome('') }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCriarNova}
                  disabled={!novaOrigemNome.trim() || criarOrigem.isPending}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {criarOrigem.isPending ? '...' : 'Criar'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCriandoNova(true)
                  setNovaOrigemNome(search)
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-accent transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar nova origem
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
