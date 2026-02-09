/**
 * AIDEV-NOTE: Preview responsivo do formulário
 * Mostra como o formulário ficará para o usuário final
 * Suporta visualização desktop/tablet/mobile
 * Drop zones claras entre campos para drag-and-drop preciso
 * Suporta click-to-edit de estilos (container, campos, botão)
 */

import { useState, useRef, useCallback } from 'react'
import { Monitor, Tablet, Smartphone, Paintbrush, Eye, EyeOff, Code, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { CampoFormulario, Formulario, EstiloContainer, EstiloCampos, EstiloBotao, EstiloCabecalho } from '../../services/formularios.api'
import { CampoItem } from '../campos/CampoItem'
import type { SelectedElement } from '../estilos/EstiloPreviewInterativo'

type Viewport = 'desktop' | 'tablet' | 'mobile'

const SOMBRA_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}

const TAMANHO_BOTAO: Record<string, string> = {
  sm: '8px 16px',
  md: '10px 20px',
  lg: '14px 28px',
}

interface Props {
  formulario: Formulario
  campos: CampoFormulario[]
  selectedCampoId: string | null
  onSelectCampo: (id: string | null) => void
  onRemoveCampo: (id: string) => void
  onMoveCampo: (id: string, direcao: 'up' | 'down') => void
  onReorderCampo: (dragId: string, targetIndex: number) => void
  onDropNewCampo: (e: React.DragEvent, index: number) => void
  estiloContainer?: EstiloContainer
  estiloCampos?: EstiloCampos
  estiloBotao?: EstiloBotao
  estiloCabecalho?: EstiloCabecalho
  selectedStyleElement?: SelectedElement
  onSelectStyleElement?: (el: SelectedElement) => void
  // Toolbar props
  onToggleFinalPreview?: () => void
  showFinalPreview?: boolean
  onToggleCss?: () => void
  showCssDrawer?: boolean
  onSaveEstilos?: () => void
  isSaving?: boolean
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
  estiloContainer,
  estiloCampos: _estiloCampos,
  estiloBotao,
  estiloCabecalho,
  selectedStyleElement,
  onSelectStyleElement,
  onToggleFinalPreview,
  showFinalPreview,
  onToggleCss,
  showCssDrawer,
  onSaveEstilos,
  isSaving,
}: Props) {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragCounter = useRef<Record<number, number>>({})

  const viewportWidths: Record<Viewport, string> = {
    desktop: 'max-w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[390px]',
  }

  // Style-derived values
  const fontFamily = estiloContainer?.font_family
    ? `${estiloContainer.font_family}, 'Inter', system-ui, sans-serif`
    : "'Inter', system-ui, sans-serif"

  const containerStyle: React.CSSProperties = estiloContainer ? {
    backgroundColor: estiloContainer.background_color || '#FFFFFF',
    borderRadius: estiloContainer.border_radius || '8px',
    padding: estiloContainer.padding || '24px',
    fontFamily,
    boxShadow: SOMBRA_MAP[estiloContainer.sombra || 'md'] || SOMBRA_MAP.md,
  } : { fontFamily: "'Inter', system-ui, sans-serif" }

  const buttonStyle: React.CSSProperties = estiloBotao ? {
    backgroundColor: estiloBotao.background_color || '#3B82F6',
    color: estiloBotao.texto_cor || '#FFFFFF',
    borderRadius: estiloBotao.border_radius || '6px',
    width: estiloBotao.largura === 'full' ? '100%' : estiloBotao.largura === '50%' ? '50%' : 'auto',
    padding: TAMANHO_BOTAO[estiloBotao.tamanho || 'md'],
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
  } : {}


  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onSelectStyleElement) {
      onSelectStyleElement('container')
    }
  }, [onSelectStyleElement])

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectStyleElement?.('botao')
  }, [onSelectStyleElement])

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

    const campoTipoData = e.dataTransfer.getData('application/campo-tipo')
    if (campoTipoData) {
      onDropNewCampo(e, index)
      return
    }

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
      <div className="flex items-center justify-between gap-1 px-3 py-1.5 border-b border-border bg-muted/30 shrink-0">
        {/* Left: Visualizar Final + CSS */}
        <div className="flex items-center gap-1">
          {onToggleFinalPreview && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onToggleFinalPreview}>
              {showFinalPreview ? (
                <><EyeOff className="w-3.5 h-3.5 mr-1.5" />Voltar</>
              ) : (
                <><Eye className="w-3.5 h-3.5 mr-1.5" />Visualizar Final</>
              )}
            </Button>
          )}
          {onToggleCss && !showFinalPreview && (
            <Button variant={showCssDrawer ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs" onClick={onToggleCss}>
              <Code className="w-3.5 h-3.5 mr-1.5" />CSS
            </Button>
          )}
        </div>

        {/* Center: Viewport switcher */}
        <div className="flex items-center gap-1">
          {([
            { key: 'desktop', icon: Monitor, label: 'Desktop' },
            { key: 'tablet', icon: Tablet, label: 'Tablet' },
            { key: 'mobile', icon: Smartphone, label: 'Mobile' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setViewport(key)}
              className={cn("h-7 px-2.5", viewport === key && "bg-muted text-foreground font-medium")}
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline text-xs">{label}</span>
            </Button>
          ))}
        </div>

        {/* Right: Salvar Estilos */}
        <div className="flex items-center">
          {onSaveEstilos && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onSaveEstilos} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Salvar Estilos
            </Button>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div
        className="flex-1 overflow-auto p-4 bg-muted/20"
        onClick={(e) => {
          // Click on background deselects style element
          if (e.target === e.currentTarget) {
            onSelectStyleElement?.(null)
          }
        }}
      >
        <div
          className={cn(
            'mx-auto transition-all duration-300 rounded-lg border border-border relative group/container',
            viewportWidths[viewport],
            !estiloContainer && 'bg-card shadow-sm p-6',
            selectedStyleElement === 'container' && 'outline outline-2 outline-dashed outline-primary outline-offset-4'
          )}
          style={containerStyle}
          onClick={handleContainerClick}
        >
          {/* Style edit trigger for container */}
          {onSelectStyleElement && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelectStyleElement('container')
              }}
              className={cn(
                'absolute -right-2 -top-2 z-10 p-1 rounded-full border bg-card shadow-sm transition-opacity',
                'opacity-0 group-hover/container:opacity-100',
                selectedStyleElement === 'container' ? 'opacity-100 border-primary text-primary' : 'border-border text-muted-foreground hover:text-primary hover:border-primary'
              )}
              title="Editar estilos do container"
            >
              <Paintbrush className="w-3 h-3" />
            </button>
          )}
          {/* Form header */}
          <div className="mb-6 text-center">
            {estiloCabecalho?.logo_url && (
              <img
                src={estiloCabecalho.logo_url}
                alt="Logo"
                style={{
                  maxHeight: '40px',
                  marginBottom: '8px',
                  display: estiloCabecalho.logo_posicao === 'centro' ? 'inline-block' : 'block',
                }}
              />
            )}
            <h2
              className="text-lg font-semibold"
              style={{ color: estiloCabecalho?.titulo_cor || undefined }}
            >
              {formulario.nome}
            </h2>
            {formulario.descricao && (
              <p
                className="text-sm mt-1"
                style={{ color: estiloCabecalho?.descricao_cor || undefined }}
              >
                {formulario.descricao}
              </p>
            )}
          </div>

          {/* Fields area - with style editing trigger */}
          <div
            className={cn(
              'rounded transition-all relative',
              selectedStyleElement === 'campos' && 'outline outline-2 outline-dashed outline-primary outline-offset-2'
            )}
          >

            {/* Empty state drop zone */}
            {campos.length === 0 && renderDropZone(0, true)}

            {/* Fields with drop zones */}
            {campos.length > 0 && (
              <div className="group/campos">
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
                          onReorderCampo(draggedId, index)
                        }
                      }}
                      onDragLeave={() => {}}
                      onStyleEdit={onSelectStyleElement ? () => onSelectStyleElement('campos') : undefined}
                    />

                    {/* Drop zone after each field */}
                    {renderDropZone(index + 1)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit button preview - clickable for style editing */}
          {campos.length > 0 && (
            <div className="mt-6 relative group/botao">
              {/* Style edit trigger for botão */}
              {onSelectStyleElement && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectStyleElement('botao')
                  }}
                  className={cn(
                    'absolute -right-2 -top-2 z-10 p-1 rounded-full border bg-card shadow-sm transition-opacity',
                    'opacity-0 group-hover/botao:opacity-100',
                    selectedStyleElement === 'botao' ? 'opacity-100 border-primary text-primary' : 'border-border text-muted-foreground hover:text-primary hover:border-primary'
                  )}
                  title="Editar estilos do botão"
                >
                  <Paintbrush className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                className={cn(
                  'rounded-md text-sm font-semibold transition-all',
                  !estiloBotao && 'w-full bg-primary text-primary-foreground py-2.5 pointer-events-none',
                  selectedStyleElement === 'botao' && 'outline outline-2 outline-dashed outline-primary outline-offset-2'
                )}
                style={estiloBotao ? buttonStyle : undefined}
                onClick={handleButtonClick}
              >
                {estiloBotao?.texto || 'Enviar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
