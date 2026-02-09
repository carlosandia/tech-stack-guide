/**
 * AIDEV-NOTE: Preview responsivo do formulário
 * Mostra como o formulário ficará para o usuário final
 * Suporta visualização desktop/tablet/mobile
 */

import { useState } from 'react'
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
  onReorderCampo: (dragId: string, dropId: string) => void
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

  const viewportWidths: Record<Viewport, string> = {
    desktop: 'max-w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[390px]',
  }

  const handleDragOverArea = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverIndex(index)
  }

  const handleDropArea = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    // Check if it's a new campo from palette
    const campoTipoData = e.dataTransfer.getData('application/campo-tipo')
    if (campoTipoData) {
      onDropNewCampo(e, index)
      return
    }

    // Check if it's an existing campo being reordered
    const draggedId = e.dataTransfer.getData('application/campo-id')
    if (draggedId && campos[index]) {
      onReorderCampo(draggedId, campos[index].id)
    }
  }

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

          {/* Drop zone: top of form */}
          <div
            onDragOver={(e) => handleDragOverArea(e, 0)}
            onDrop={(e) => handleDropArea(e, 0)}
            onDragLeave={() => setDragOverIndex(null)}
            className={cn(
              'transition-all rounded-md mb-2',
              dragOverIndex === 0
                ? 'border-2 border-dashed border-primary bg-primary/5 p-4 text-center'
                : 'h-2',
              campos.length === 0 && 'border-2 border-dashed border-border p-8 text-center'
            )}
          >
            {campos.length === 0 && dragOverIndex !== 0 && (
              <p className="text-sm text-muted-foreground">
                Arraste campos da paleta para cá
              </p>
            )}
            {dragOverIndex === 0 && (
              <p className="text-xs text-primary font-medium">Soltar aqui</p>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-2">
            {campos.map((campo, index) => (
              <div key={campo.id}>
                <CampoItem
                  campo={campo}
                  isSelected={selectedCampoId === campo.id}
                  isDragOver={dragOverIndex === index + 1}
                  onSelect={() => onSelectCampo(campo.id)}
                  onRemove={() => onRemoveCampo(campo.id)}
                  onMoveUp={index > 0 ? () => onMoveCampo(campo.id, 'up') : undefined}
                  onMoveDown={index < campos.length - 1 ? () => onMoveCampo(campo.id, 'down') : undefined}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/campo-id', campo.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => handleDragOverArea(e, index + 1)}
                  onDrop={(e) => handleDropArea(e, index + 1)}
                  onDragLeave={() => setDragOverIndex(null)}
                />

                {/* Drop zone between fields */}
                <div
                  onDragOver={(e) => handleDragOverArea(e, index + 1)}
                  onDrop={(e) => handleDropArea(e, index + 1)}
                  onDragLeave={() => setDragOverIndex(null)}
                  className={cn(
                    'transition-all rounded-md',
                    dragOverIndex === index + 1
                      ? 'border-2 border-dashed border-primary bg-primary/5 p-3 text-center my-1'
                      : 'h-1'
                  )}
                >
                  {dragOverIndex === index + 1 && (
                    <p className="text-xs text-primary font-medium">Soltar aqui</p>
                  )}
                </div>
              </div>
            ))}
          </div>

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
