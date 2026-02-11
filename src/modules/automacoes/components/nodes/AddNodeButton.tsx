/**
 * AIDEV-NOTE: Botão "+" que aparece abaixo do handle de saída de cada nó
 * Ao clicar, mostra menu inline para escolher tipo de nó (Ação, Condição, Delay)
 */

import { useState, useCallback } from 'react'
import { Plus, Play, GitBranch, Timer, ShieldCheck } from 'lucide-react'

type NodeType = 'acao' | 'condicao' | 'delay' | 'validacao'

interface AddNodeButtonProps {
  nodeId: string
  sourceHandle?: string
  onAddNode?: (type: NodeType, sourceNodeId: string, sourceHandle?: string) => void
}

const options = [
  { type: 'acao' as const, label: 'Ação', icon: Play, color: 'text-green-600', bg: 'hover:bg-green-50' },
  { type: 'condicao' as const, label: 'Condição', icon: GitBranch, color: 'text-yellow-600', bg: 'hover:bg-yellow-50' },
  { type: 'validacao' as const, label: 'Validação', icon: ShieldCheck, color: 'text-violet-600', bg: 'hover:bg-violet-50' },
  { type: 'delay' as const, label: 'Delay', icon: Timer, color: 'text-blue-500', bg: 'hover:bg-blue-50' },
]

export function AddNodeButton({ nodeId, sourceHandle, onAddNode }: AddNodeButtonProps) {
  const [open, setOpen] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(prev => !prev)
  }, [])

  const handleSelect = useCallback((type: NodeType) => {
    onAddNode?.(type, nodeId, sourceHandle)
    setOpen(false)
  }, [onAddNode, nodeId, sourceHandle])

  return (
    <div className="flex flex-col items-center relative" style={{ pointerEvents: 'all' }}>
      {/* Linha tracejada */}
      <div className="w-px h-6 border-l-2 border-dashed border-border" />

      {/* Botão + */}
      <button
        onClick={handleClick}
        className={`
          w-6 h-6 rounded-full flex items-center justify-center
          border-2 border-border bg-white shadow-sm
          hover:border-primary hover:bg-primary/5 hover:scale-110
          transition-all duration-150 z-10
          ${open ? 'border-primary bg-primary/5 scale-110' : ''}
        `}
      >
        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Menu dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
          <div className="absolute top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-border p-1 min-w-[150px]">
            <p className="text-[10px] font-semibold text-muted-foreground px-2.5 py-1 uppercase tracking-wider">
              Adicionar
            </p>
            {options.map(opt => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.type}
                  onClick={(e) => { e.stopPropagation(); handleSelect(opt.type) }}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${opt.bg}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${opt.color}`} />
                  <span className="text-foreground">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
