/**
 * AIDEV-NOTE: Handle unificado que combina saída do React Flow + menu de adicionar nó
 * - Click simples: abre popover para adicionar nó
 * - Click + arrastar: puxa linha de conexão (comportamento nativo do Handle)
 */

import { useState, useCallback, useRef } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Play, GitBranch, Timer, ShieldCheck, Check, X } from 'lucide-react'

type NodeType = 'acao' | 'condicao' | 'delay' | 'validacao'

interface HandleWithAddProps {
  nodeId: string
  handleId?: string
  /** Cor do handle: 'primary' | 'green' | 'blue' | 'yellow' | 'violet' */
  color: string
  /** Ícone sobreposto: 'check' | 'x' | none */
  icon?: 'check' | 'x'
  /** Posição vertical (para nós com múltiplas saídas) */
  style?: React.CSSProperties
  onAddNode?: (type: NodeType, sourceNodeId: string, sourceHandle?: string) => void
}

const options = [
  { type: 'acao' as const, label: 'Ação', icon: Play, color: 'text-green-600', bg: 'hover:bg-green-50' },
  { type: 'condicao' as const, label: 'Condição', icon: GitBranch, color: 'text-yellow-600', bg: 'hover:bg-yellow-50' },
  { type: 'validacao' as const, label: 'Validação', icon: ShieldCheck, color: 'text-violet-600', bg: 'hover:bg-violet-50' },
  { type: 'delay' as const, label: 'Delay', icon: Timer, color: 'text-blue-500', bg: 'hover:bg-blue-50' },
]

const colorMap: Record<string, { bg: string; border: string }> = {
  primary: { bg: '!bg-primary', border: '!border-white' },
  green: { bg: '!bg-green-500', border: '!border-white' },
  blue: { bg: '!bg-blue-400', border: '!border-white' },
  yellow: { bg: '!bg-yellow-500', border: '!border-white' },
  violet: { bg: '!bg-violet-500', border: '!border-white' },
}

export function HandleWithAdd({ nodeId, handleId, color, icon, style, onAddNode }: HandleWithAddProps) {
  const [open, setOpen] = useState(false)
  const isDragging = useRef(false)
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null)

  const colors = colorMap[color] || colorMap.primary

  // Detecta se foi drag (>5px) ou click
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY }
    isDragging.current = false

    const handleMouseMove = (ev: MouseEvent) => {
      if (!mouseDownPos.current) return
      const dx = ev.clientX - mouseDownPos.current.x
      const dy = ev.clientY - mouseDownPos.current.y
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        isDragging.current = true
      }
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)

      if (!isDragging.current) {
        // Foi click simples — abre menu
        setOpen(prev => !prev)
      }
      mouseDownPos.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  const handleSelect = useCallback((type: NodeType) => {
    onAddNode?.(type, nodeId, handleId)
    setOpen(false)
  }, [onAddNode, nodeId, handleId])

  // Ícone sobreposto (check/x) ou nenhum
  const IconComponent = icon === 'check' ? Check : icon === 'x' ? X : null
  const iconBg = icon === 'check' ? 'bg-green-500' : 'bg-red-500'

  return (
    <div className="relative" style={style}>
      {/* Handle real do React Flow — tamanho aumentado para facilitar interação */}
      <Handle
        type="source"
        position={Position.Right}
        id={handleId}
        className={`!w-5 !h-5 ${colors.bg} ${colors.border} !border-2 !-right-2.5 !cursor-pointer`}
        style={style}
        onMouseDown={handleMouseDown}
      />

      {/* Ícone visual sobreposto (não bloqueia interação do handle) */}
      {IconComponent && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            right: -10,
            transform: 'translateY(-50%)',
            ...(style?.top ? { top: style.top } : {}),
          }}
        >
          <div className={`w-5 h-5 rounded-full ${iconBg} border-2 border-white flex items-center justify-center shadow-sm`}>
            <IconComponent className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* Menu dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
          <div
            className="absolute z-[9999] bg-white rounded-lg shadow-lg border border-border p-1 min-w-[150px]"
            style={{ left: 'calc(100% + 12px)', top: '50%', transform: 'translateY(-50%)' }}
          >
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
