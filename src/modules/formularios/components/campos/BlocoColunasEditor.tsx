/**
 * AIDEV-NOTE: Componente de Bloco de Colunas no editor
 * Renderiza N colunas com drop zones independentes
 * Campos filhos são filtrados por pai_campo_id + coluna_indice
 */

import { useState, useRef, useCallback } from 'react'
import { Columns, Trash2, Settings, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CampoItem } from './CampoItem'
import type { CampoFormulario } from '../../services/formularios.api'

interface ColunasConfig {
  colunas: number
  larguras: string // "50%,50%" ou "33%,67%"
  larguras_tablet?: string
  larguras_mobile?: string
  gap: string // px
}

type DeviceViewport = 'desktop' | 'tablet' | 'mobile'

function parseColunasConfig(valorPadrao?: string | null): ColunasConfig {
  const defaults: ColunasConfig = { colunas: 2, larguras: '50%,50%', gap: '16' }
  if (!valorPadrao) return defaults
  try {
    const p = JSON.parse(valorPadrao)
    return {
      colunas: parseInt(p.colunas) || 2,
      larguras: p.larguras || defaults.larguras,
      larguras_tablet: p.larguras_tablet,
      larguras_mobile: p.larguras_mobile,
      gap: p.gap || '16',
    }
  } catch {
    return defaults
  }
}

function resolveColLarguras(config: ColunasConfig, viewport: DeviceViewport): string[] {
  let raw = config.larguras
  if (viewport === 'tablet' && config.larguras_tablet) {
    raw = config.larguras_tablet
  } else if (viewport === 'mobile') {
    raw = config.larguras_mobile || Array(config.colunas).fill('100%').join(',')
  }
  return raw.split(',').map(l => l.trim())
}

interface Props {
  bloco: CampoFormulario
  todosCampos: CampoFormulario[]
  isSelected: boolean
  selectedCampoId: string | null
  onSelect: () => void
  onRemove: () => void
  onSelectCampo: (id: string | null) => void
  onRemoveCampo: (id: string) => void
  onDropNewCampoInColuna: (e: React.DragEvent, index: number, paiCampoId: string, colunaIndice: number) => void
  onReorderCampoInColuna: (dragId: string, targetIndex: number, paiCampoId: string, colunaIndice: number) => void
  onMoveCampoToColuna: (campoId: string, paiCampoId: string, colunaIndice: number) => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onUpdateLabel?: (campoId: string, newLabel: string) => void
  viewport?: DeviceViewport
}

export function BlocoColunasEditor({
  bloco,
  todosCampos,
  isSelected,
  selectedCampoId,
  onSelect,
  onRemove,
  onSelectCampo,
  onRemoveCampo,
  onDropNewCampoInColuna,
  onReorderCampoInColuna,
  onMoveCampoToColuna,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  onUpdateLabel,
  viewport = 'desktop',
}: Props) {
  const config = parseColunasConfig(bloco.valor_padrao)
  const larguras = resolveColLarguras(config, viewport)
  const [dragOverColuna, setDragOverColuna] = useState<{ col: number; index: number } | null>(null)
  const dragCounters = useRef<Record<string, number>>({})

  // Get children for a specific column
  const getChildrenForColumn = useCallback((colunaIndex: number) => {
    return todosCampos
      .filter(c => c.pai_campo_id === bloco.id && c.coluna_indice === colunaIndex)
      .sort((a, b) => a.ordem - b.ordem)
  }, [todosCampos, bloco.id])

  const handleColDragEnter = useCallback((e: React.DragEvent, col: number, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    const key = `${col}-${index}`
    dragCounters.current[key] = (dragCounters.current[key] || 0) + 1
    setDragOverColuna({ col, index })
  }, [])

  const handleColDragLeave = useCallback((e: React.DragEvent, col: number, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    const key = `${col}-${index}`
    dragCounters.current[key] = (dragCounters.current[key] || 0) - 1
    if (dragCounters.current[key] <= 0) {
      dragCounters.current[key] = 0
      setDragOverColuna(prev => (prev?.col === col && prev?.index === index ? null : prev))
    }
  }, [])

  const handleColDrop = useCallback((e: React.DragEvent, col: number, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounters.current = {}
    setDragOverColuna(null)

    // New campo from palette
    const campoTipoData = e.dataTransfer.getData('application/campo-tipo')
    if (campoTipoData) {
      onDropNewCampoInColuna(e, index, bloco.id, col)
      return
    }

    // Reorder existing campo
    const draggedId = e.dataTransfer.getData('application/campo-id')
    if (draggedId) {
      // Check if it's already in this column
      const draggedCampo = todosCampos.find(c => c.id === draggedId)
      if (draggedCampo?.pai_campo_id === bloco.id && draggedCampo?.coluna_indice === col) {
        onReorderCampoInColuna(draggedId, index, bloco.id, col)
      } else {
        // Move to this column
        onMoveCampoToColuna(draggedId, bloco.id, col)
      }
    }
  }, [bloco.id, onDropNewCampoInColuna, onReorderCampoInColuna, onMoveCampoToColuna, todosCampos])

  const handleColDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const renderColumnDropZone = (col: number, index: number, isEmpty = false) => {
    const isOver = dragOverColuna?.col === col && dragOverColuna?.index === index
    return (
      <div
        onDragEnter={(e) => handleColDragEnter(e, col, index)}
        onDragOver={handleColDragOver}
        onDragLeave={(e) => handleColDragLeave(e, col, index)}
        onDrop={(e) => handleColDrop(e, col, index)}
        className={cn(
          'transition-all rounded',
          isOver
            ? 'border-2 border-dashed border-primary bg-primary/5 py-3 text-center my-0.5'
            : isEmpty
              ? 'border-2 border-dashed border-border/50 py-4 text-center'
              : 'py-0.5',
        )}
      >
        {isOver && <p className="text-[10px] text-primary font-medium">Soltar aqui</p>}
        {isEmpty && !isOver && (
          <p className="text-[10px] text-muted-foreground">Arraste um campo</p>
        )}
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      className={cn(
        'group relative border rounded-lg p-2 transition-all cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-primary/30',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100" />
          <Columns className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">
            Bloco {config.colunas} Colunas ({larguras.join(' / ')})
          </span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onSelect() }}>
            <Settings className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); onRemove() }}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex flex-wrap" style={{ gap: `${config.gap}px` }}>
      {Array.from({ length: config.colunas }).map((_, colIndex) => {
          const children = getChildrenForColumn(colIndex)
          const rawWidth = larguras[colIndex] || `${Math.floor(100 / config.colunas)}%`
          // AIDEV-NOTE: Compensar o gap no cálculo da largura para evitar overflow
          const gapPx = parseInt(config.gap) || 16
          const totalGap = gapPx * (config.colunas - 1)
          const width = rawWidth.endsWith('%')
            ? `calc(${rawWidth} - ${totalGap * parseFloat(rawWidth) / 100}px)`
            : rawWidth

          return (
            <div
              key={colIndex}
              className="border border-dashed border-border/40 rounded-md p-1.5 min-h-[60px]"
              style={{ width }}
            >
              {children.length === 0 && renderColumnDropZone(colIndex, 0, true)}

              {children.length > 0 && (
                <>
                  {renderColumnDropZone(colIndex, 0)}
                  {children.map((child, idx) => (
                    <div key={child.id}>
                      <CampoItem
                        campo={child}
                        isSelected={selectedCampoId === child.id}
                        isDragOver={false}
                        onSelect={() => onSelectCampo(child.id)}
                        onRemove={() => onRemoveCampo(child.id)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/campo-id', child.id)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const draggedId = e.dataTransfer.getData('application/campo-id')
                          if (draggedId && draggedId !== child.id) {
                            onReorderCampoInColuna(draggedId, idx, bloco.id, colIndex)
                          }
                        }}
                        onDragLeave={() => {}}
                        onUpdateLabel={onUpdateLabel ? (newLabel) => onUpdateLabel(child.id, newLabel) : undefined}
                      />
                      {renderColumnDropZone(colIndex, idx + 1)}
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
