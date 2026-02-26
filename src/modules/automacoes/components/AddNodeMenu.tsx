/**
 * AIDEV-NOTE: Menu dropdown para adicionar novos nós ao fluxo
 */

import { Play, GitBranch, Timer, ShieldCheck } from 'lucide-react'

interface AddNodeMenuProps {
  position: { x: number; y: number }
  onAdd: (type: 'acao' | 'condicao' | 'delay' | 'validacao') => void
  onClose: () => void
}

const options = [
  { type: 'acao' as const, label: 'Ação', icon: Play, color: 'text-green-500', bg: 'bg-green-500/10 hover:bg-green-500/20' },
  { type: 'condicao' as const, label: 'Condição', icon: GitBranch, color: 'text-yellow-500', bg: 'bg-yellow-500/10 hover:bg-yellow-500/20' },
  { type: 'validacao' as const, label: 'Validação', icon: ShieldCheck, color: 'text-violet-500', bg: 'bg-violet-500/10 hover:bg-violet-500/20' },
  { type: 'delay' as const, label: 'Delay', icon: Timer, color: 'text-blue-500', bg: 'bg-blue-500/10 hover:bg-blue-500/20' },
]

export function AddNodeMenu({ position, onAdd, onClose }: AddNodeMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute z-[9999] bg-popover rounded-lg shadow-lg border border-border p-1.5 min-w-[160px]"
        style={{ left: position.x, top: position.y }}
      >
        <p className="text-xs font-medium text-muted-foreground px-2.5 py-1.5 uppercase tracking-wide">
          Adicionar
        </p>
        {options.map(opt => {
          const Icon = opt.icon
          return (
            <button
              key={opt.type}
              onClick={() => { onAdd(opt.type); onClose() }}
              className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${opt.bg}`}
            >
              <Icon className={`w-4 h-4 ${opt.color}`} />
              <span className="text-foreground">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
