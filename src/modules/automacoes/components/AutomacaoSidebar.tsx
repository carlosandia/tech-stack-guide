/**
 * AIDEV-NOTE: Painel lateral com lista de automações existentes
 * Inclui busca, toggle ativo/inativo, e botão "Nova Automação"
 */

import { useState } from 'react'
import { Plus, Search, Zap, Loader2 } from 'lucide-react'
import type { Automacao } from '../schemas/automacoes.schema'

interface AutomacaoSidebarProps {
  automacoes: Automacao[]
  isLoading: boolean
  selectedId?: string
  onSelect: (id: string) => void
  onNew: () => void
  onToggle: (id: string, ativo: boolean) => void
  isAdmin: boolean
}

export function AutomacaoSidebar({
  automacoes,
  isLoading,
  selectedId,
  onSelect,
  onNew,
  onToggle,
  isAdmin,
}: AutomacaoSidebarProps) {
  const [busca, setBusca] = useState('')

  const filtradas = automacoes.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Automações</span>
          </div>
          {isAdmin && (
            <button
              onClick={onNew}
              className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Nova Automação"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {automacoes.length === 0 ? 'Nenhuma automação' : 'Nenhum resultado'}
            </p>
          </div>
        ) : (
          filtradas.map(a => (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`
                w-full text-left px-3 py-2.5 rounded-md text-sm transition-all duration-200 group
                ${selectedId === a.id
                  ? 'bg-primary/5 border border-primary/40 text-primary'
                  : 'border border-transparent hover:bg-accent text-foreground'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium truncate flex-1">{a.nome}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(a.id, !a.ativo) }}
                  className={`
                    ml-2 w-8 h-4 rounded-full relative transition-colors flex-shrink-0
                    ${a.ativo ? 'bg-green-500' : 'bg-muted-foreground/30'}
                  `}
                  title={a.ativo ? 'Desativar' : 'Ativar'}
                >
                  <div className={`
                    absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform
                    ${a.ativo ? 'left-4' : 'left-0.5'}
                  `} />
                </button>
              </div>
              {a.descricao && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.descricao}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${a.ativo ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {a.ativo ? 'Ativa' : 'Inativa'}
                </span>
                <span className="text-[10px] text-muted-foreground">{a.total_execucoes} exec.</span>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
