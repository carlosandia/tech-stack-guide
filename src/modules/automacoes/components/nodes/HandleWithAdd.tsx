/**
 * AIDEV-NOTE: Handle unificado que combina saída do React Flow + menu de adicionar nó
 * - Click simples: abre popover para adicionar nó
 * - Click + arrastar: puxa linha de conexão (comportamento nativo do Handle)
 * 
 * Para nós com ícone (check/x), o handle fica invisível e o ícone colorido
 * é renderizado por cima como overlay visual (pointer-events: none).
 * Para nós sem ícone, o handle fica visível com a cor da categoria.
 */

import { useState, useCallback, useRef } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Play, GitBranch, Timer, ShieldCheck, Check, X } from 'lucide-react'

type NodeType = 'acao' | 'condicao' | 'delay' | 'validacao'

interface HandleWithAddProps {
  nodeId: string
  handleId?: string
  color: string
  icon?: 'check' | 'x'
  /** top % para posicionamento vertical (ex: '35%', '65%') */
  top?: string
  onAddNode?: (type: NodeType, sourceNodeId: string, sourceHandle?: string) => void
}

const options = [
  { type: 'acao' as const, label: 'Ação', icon: Play, color: 'text-green-600', bg: 'hover:bg-green-50' },
  { type: 'condicao' as const, label: 'Condição', icon: GitBranch, color: 'text-yellow-600', bg: 'hover:bg-yellow-50' },
  { type: 'validacao' as const, label: 'Validação', icon: ShieldCheck, color: 'text-violet-600', bg: 'hover:bg-violet-50' },
  { type: 'delay' as const, label: 'Delay', icon: Timer, color: 'text-blue-500', bg: 'hover:bg-blue-50' },
]

const colorMap: Record<string, string> = {
  primary: '!bg-primary',
  green: '!bg-green-500',
  blue: '!bg-blue-400',
  yellow: '!bg-yellow-500',
  violet: '!bg-violet-500',
}

export function HandleWithAdd({ nodeId, handleId, color, icon, top, onAddNode }: HandleWithAddProps) {
  const [open, setOpen] = useState(false)
  const isDragging = useRef(false)
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null)
  const handleRef = useRef<HTMLDivElement>(null)

  const bgClass = colorMap[color] || colorMap.primary
  const hasIcon = !!icon
  const IconComponent = icon === 'check' ? Check : icon === 'x' ? X : null
  const iconBg = icon === 'check' ? 'bg-green-500' : 'bg-red-500'

  // Detecta se foi drag (>5px) ou click
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    mouseDownPos.current = { x: e.clientX, y: e.clientY }
    isDragging.current = false

    const onMove = (ev: MouseEvent) => {
      if (!mouseDownPos.current) return
      const dx = ev.clientX - mouseDownPos.current.x
      const dy = ev.clientY - mouseDownPos.current.y
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        isDragging.current = true
      }
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (!isDragging.current) {
        setOpen(prev => !prev)
      }
      mouseDownPos.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const handleSelect = useCallback((type: NodeType) => {
    onAddNode?.(type, nodeId, handleId)
    setOpen(false)
  }, [onAddNode, nodeId, handleId])

  // Estilo de posição vertical do handle (para nós com múltiplas saídas)
  const handleStyle: React.CSSProperties = top ? { top } : {}

  return (
    <>
      {/* Handle real do React Flow */}
      <Handle
        type="source"
        position={Position.Right}
        id={handleId}
        className={`
          !cursor-pointer
          ${hasIcon ? '!w-0 !h-0 !bg-transparent !border-0 !-right-1.5' : `!w-5 !h-5 ${bgClass} !border-2 !border-white !-right-2.5 !z-10`}
        `}
        style={handleStyle}
        onMouseDown={handleMouseDown}
      />

      {/* Ícone visual sobreposto — click abre popover */}
      {IconComponent && (
        <div
          ref={handleRef}
          className="absolute z-20 cursor-pointer"
          style={{
            top: top || '50%',
            right: -10,
            transform: 'translateY(-50%)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(prev => !prev)
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
            style={{
              right: -170,
              top: top || '50%',
              transform: 'translateY(-50%)',
            }}
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
    </>
  )
}
