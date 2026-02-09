/**
 * AIDEV-NOTE: Preview responsivo do formulário
 * Mostra como o formulário ficará para o usuário final
 * Suporta visualização desktop/tablet/mobile
 * Drop zones claras entre campos para drag-and-drop preciso
 */

import { useState, useRef, useCallback } from 'react'
import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { CampoFormulario, Formulario } from '../../services/formularios.api'
import { CampoItem } from '../campos/CampoItem'

type Viewport = 'desktop' | 'tablet' | 'mobile'

interface Props {
  formulario: Formulario
  campos: CampoFormulario[]
  selectedCampoId: string | null
  onSelectCampo: (id: string | null) => void
  onRemoveCampo: (id: string) => void
  onMoveCampo: (id: string, direcao: 'up' | 'down') => void
  onReorderCampo: (dragId: string, targetIndex: number) => void
  onDropNewCampo: (e: React.DragEvent, index: number) => void
}

export function FormPreview({
  formulario,
  campos,
  selectedCampoId,
  onSelectCampo,
  onRemoveCampo,
  onMoveCampo,
  onReorderCampo,
  onDropNewCampo,
}: Props) {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragCounter = useRef<Record<number, number>>({})

  const viewportWidths: Record<Viewport, string> = {
    desktop: 'max-w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[390px]',
  }

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current[index] = (dragCounter.current[index] || 0) + 1
    setDragOverIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current[index] = (dragCounter.current[index] || 0) - 1
    if (dragCounter.current[index] <= 0) {
      dragCounter.current[index] = 0
      setDragOverIndex((prev) => (prev === index ? null : prev))
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = {}
    setDragOverIndex(null)

    // New campo from palette
    const campoTipoData = e.dataTransfer.getData('application/campo-tipo')
    if (campoTipoData) {
      onDropNewCampo(e, index)
      return
    }

    // Existing campo being reordered — pass target index directly
    const draggedId = e.dataTransfer.getData('application/campo-id')
    if (draggedId) {
      onReorderCampo(draggedId, index)
    }
  }, [onDropNewCampo, onReorderCampo])

  const renderDropZone = (index: number, isEmpty = false) => (
    <div
      onDragEnter={(e) => handleDragEnter(e, index)}
      onDragOver={handleDragOver}
      onDragLeave={(e) => handleDragLeave(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      className={cn(
        'transition-all rounded-md',
        dragOverIndex === index
          ? 'border-2 border-dashed border-primary bg-primary/5 py-4 text-center my-1'
          : isEmpty
            ? 'border-2 border-dashed border-border py-8 text-center'
            : 'py-1',
      )}
    >
      {dragOverIndex === index && (
        <p className="text-xs text-primary font-medium">Soltar aqui</p>
      )}
      {isEmpty && dragOverIndex !== index && (
        <p className="text-sm text-muted-foreground">
          Arraste campos da paleta para cá
        </p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Viewport switcher */}
      <div className="flex items-center justify-center gap-1 py-2 border-b border-border bg-muted/30">
        {([
          { key: 'desktop', icon: Monitor, label: 'Desktop' },
          { key: 'tablet', icon: Tablet, label: 'Tablet' },
          { key: 'mobile', icon: Smartphone, label: 'Mobile' },
        ] as const).map(({ key, icon: Icon, label }) => (
          <Button
            key={key}
            variant={viewport === key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewport(key)}
            className="h-7 px-2.5"
          >
            <Icon className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline text-xs">{label}</span>
          </Button>
        ))}
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-4 bg-muted/20">
        <div className={cn(
          'mx-auto transition-all duration-300 bg-card rounded-lg border border-border shadow-sm p-6',
          viewportWidths[viewport]
        )}>
          {/* Form header */}
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-foreground">{formulario.nome}</h2>
            {formulario.descricao && (
              <p className="text-sm text-muted-foreground mt-1">{formulario.descricao}</p>
            )}
          </div>

          {/* Empty state drop zone */}
          {campos.length === 0 && renderDropZone(0, true)}

          {/* Fields with drop zones */}
          {campos.length > 0 && (
            <div>
              {/* Top drop zone */}
              {renderDropZone(0)}

              {campos.map((campo, index) => (
                <div key={campo.id}>
                  <CampoItem
                    campo={campo}
                    isSelected={selectedCampoId === campo.id}
                    isDragOver={false}
                    onSelect={() => onSelectCampo(campo.id)}
                    onRemove={() => onRemoveCampo(campo.id)}
                    onMoveUp={index > 0 ? () => onMoveCampo(campo.id, 'up') : undefined}
                    onMoveDown={index < campos.length - 1 ? () => onMoveCampo(campo.id, 'down') : undefined}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/campo-id', campo.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const draggedId = e.dataTransfer.getData('application/campo-id')
                      if (draggedId && draggedId !== campo.id) {
                        // Dropping ON a campo means insert at that campo's position
                        onReorderCampo(draggedId, index)
                      }
                    }}
                    onDragLeave={() => {}}
                  />

                  {/* Drop zone after each field */}
                  {renderDropZone(index + 1)}
                </div>
              ))}
            </div>
          )}

          {/* Submit button preview */}
          {campos.length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-semibold pointer-events-none"
              >
                Enviar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
