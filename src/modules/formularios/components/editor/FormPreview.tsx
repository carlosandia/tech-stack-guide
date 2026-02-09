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
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import type { CampoFormulario, Formulario, EstiloContainer, EstiloCampos, EstiloBotao, EstiloCabecalho } from '../../services/formularios.api'
import type { ConfigBotoes } from '../config/ConfigBotoesEnvioForm'
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
  // Final preview props
  paginaBackgroundColor?: string
  cssCustomizado?: string
  configBotoes?: ConfigBotoes | null
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
  estiloCampos,
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
  paginaBackgroundColor,
  cssCustomizado,
  configBotoes,
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
        className="flex-1 overflow-auto p-4"
        style={{ backgroundColor: showFinalPreview ? (paginaBackgroundColor || '#F3F4F6') : undefined }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectStyleElement?.(null)
          }
        }}
      >
        {/* Inject custom CSS */}
        {cssCustomizado && (
          <style dangerouslySetInnerHTML={{ __html: cssCustomizado }} />
        )}

        <div
          className={cn(
            'mx-auto transition-all duration-300 rounded-lg relative',
            viewportWidths[viewport],
            showFinalPreview
              ? 'border border-border'
              : cn(
                  'border border-border group/container',
                  !estiloContainer && 'bg-card shadow-sm p-6',
                  selectedStyleElement === 'container' && 'outline outline-2 outline-dashed outline-primary outline-offset-4'
                )
          )}
          style={containerStyle}
          onClick={showFinalPreview ? undefined : handleContainerClick}
          data-form-container
        >
          {/* Style edit trigger for container - only in editor mode */}
          {!showFinalPreview && onSelectStyleElement && (
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
              style={{ color: estiloCabecalho?.titulo_cor || undefined, fontFamily }}
            >
              {formulario.nome}
            </h2>
            {formulario.descricao && (
              <p
                className="text-sm mt-1"
                style={{ color: estiloCabecalho?.descricao_cor || undefined, fontFamily }}
              >
                {formulario.descricao}
              </p>
            )}
          </div>

          {/* Fields area */}
          {showFinalPreview ? (
            /* Final Preview: render all field types with styles */
            <div className="space-y-3">
              {campos.map((campo) => (
                <div key={campo.id}>{renderFinalCampo(campo, estiloCampos, fontFamily)}</div>
              ))}
            </div>
          ) : (
            /* Editor mode: drag-and-drop */
            <div
              className={cn(
                'rounded transition-all relative',
                selectedStyleElement === 'campos' && 'outline outline-2 outline-dashed outline-primary outline-offset-2'
              )}
            >
              {campos.length === 0 && renderDropZone(0, true)}

              {campos.length > 0 && (
                <div className="group/campos">
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
                      {renderDropZone(index + 1)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit button(s) */}
          {campos.length > 0 && (
            <div className="mt-6 relative group/botao">
              {!showFinalPreview && onSelectStyleElement && (
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

              {renderBotoes(
                configBotoes,
                estiloBotao,
                buttonStyle,
                showFinalPreview || false,
                selectedStyleElement,
                handleButtonClick,
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Renderiza botões de envio baseado na configuração */
function renderBotoes(
  configBotoes: ConfigBotoes | null | undefined,
  estiloBotao: EstiloBotao | undefined,
  buttonStyle: React.CSSProperties,
  showFinalPreview: boolean,
  selectedStyleElement: SelectedElement | undefined,
  handleButtonClick: (e: React.MouseEvent) => void,
) {
  const tipoBotao = configBotoes?.tipo_botao || 'enviar'
  const showEnviar = tipoBotao === 'enviar' || tipoBotao === 'ambos'
  const showWhatsApp = tipoBotao === 'whatsapp' || tipoBotao === 'ambos'

  const enviarBtn = showEnviar ? (
    <button
      type="button"
      className={cn(
        'rounded-md text-sm font-semibold transition-all',
        !estiloBotao && 'w-full bg-primary text-primary-foreground py-2.5',
        !showFinalPreview && selectedStyleElement === 'botao' && 'outline outline-2 outline-dashed outline-primary outline-offset-2'
      )}
      style={estiloBotao ? buttonStyle : undefined}
      onClick={showFinalPreview ? undefined : handleButtonClick}
    >
      {estiloBotao?.texto || 'Enviar'}
    </button>
  ) : null

  const whatsAppBtn = showWhatsApp ? (
    <button
      type="button"
      className={cn(
        'rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2',
        !showFinalPreview && selectedStyleElement === 'botao' && 'outline outline-2 outline-dashed outline-primary outline-offset-2'
      )}
      style={{
        backgroundColor: '#25D366',
        color: '#FFFFFF',
        borderRadius: estiloBotao?.border_radius || '6px',
        width: tipoBotao === 'ambos' ? '100%' : (estiloBotao?.largura === 'full' ? '100%' : estiloBotao?.largura === '50%' ? '50%' : 'auto'),
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
      }}
      onClick={showFinalPreview ? undefined : handleButtonClick}
    >
      <WhatsAppIcon size={16} className="shrink-0" />
      Enviar via WhatsApp
    </button>
  ) : null

  if (tipoBotao === 'ambos') {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        {enviarBtn}
        {whatsAppBtn}
      </div>
    )
  }

  return enviarBtn || whatsAppBtn
}

/** Renderiza um campo no modo visualização final com estilos aplicados */
function renderFinalCampo(
  campo: CampoFormulario,
  estiloCampos: EstiloCampos | undefined,
  fontFamily: string,
) {
  const labelStyle: React.CSSProperties = {
    color: estiloCampos?.label_cor || '#374151',
    fontSize: estiloCampos?.label_tamanho || '14px',
    fontWeight: 500,
    display: 'block',
    marginBottom: '4px',
    fontFamily,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: estiloCampos?.input_background || '#F9FAFB',
    border: `1px solid ${estiloCampos?.input_border_color || '#D1D5DB'}`,
    borderRadius: estiloCampos?.input_border_radius || '6px',
    color: estiloCampos?.input_texto_cor || '#1F2937',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily,
  }

  const placeholder = campo.placeholder || ''

  switch (campo.tipo) {
    case 'titulo':
      return (
        <h3 style={{ ...labelStyle, fontSize: '18px', fontWeight: 600, marginBottom: 0 }}>
          {placeholder || campo.label || 'Título da seção'}
        </h3>
      )
    case 'paragrafo':
      return (
        <p style={{ color: estiloCampos?.label_cor || '#6B7280', fontSize: '14px', margin: 0, fontFamily }}>
          {placeholder || campo.label || 'Texto descritivo'}
        </p>
      )
    case 'divisor':
      return <hr style={{ border: 'none', borderTop: `1px solid ${estiloCampos?.input_border_color || '#D1D5DB'}` }} />
    case 'espacador':
      return <div style={{ height: '16px' }} />
    case 'oculto':
      return null
    case 'bloco_html':
      return (
        <div
          style={{ fontSize: '14px', fontFamily }}
          dangerouslySetInnerHTML={{ __html: campo.valor_padrao || '<p>Bloco HTML</p>' }}
        />
      )
    case 'area_texto':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <textarea style={{ ...inputStyle, height: '64px', resize: 'none' }} placeholder={placeholder || 'Digite aqui...'} readOnly />
        </div>
      )
    case 'checkbox':
    case 'checkbox_termos':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" disabled style={{ width: '16px', height: '16px' }} />
          <span style={{ ...labelStyle, marginBottom: 0 }}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
        </div>
      )
    case 'selecao':
    case 'selecao_multipla':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <select style={{ ...inputStyle, appearance: 'auto' }} disabled>
            <option>{placeholder || (campo.tipo === 'selecao_multipla' ? 'Selecione uma ou mais...' : 'Selecione...')}</option>
          </select>
        </div>
      )
    case 'radio':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(campo.opcoes as string[] || ['Opção 1', 'Opção 2']).slice(0, 4).map((op, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: estiloCampos?.input_texto_cor || '#1F2937', fontFamily }}>
                <input type="radio" disabled name={campo.id} />
                {typeof op === 'string' ? op : `Opção ${i + 1}`}
              </label>
            ))}
          </div>
        </div>
      )
    case 'data':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <input type="date" style={inputStyle} readOnly />
        </div>
      )
    case 'data_hora':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <input type="datetime-local" style={inputStyle} readOnly />
        </div>
      )
    case 'hora':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <input type="time" style={inputStyle} readOnly />
        </div>
      )
    case 'moeda':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <input style={inputStyle} placeholder={placeholder || 'R$ 0,00'} readOnly />
        </div>
      )
    case 'numero':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <input type="number" style={inputStyle} placeholder={placeholder || '0'} readOnly />
        </div>
      )
    case 'url':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <input type="url" style={inputStyle} placeholder={placeholder || 'https://'} readOnly />
        </div>
      )
    case 'avaliacao':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <div style={{ display: 'flex', gap: '4px', fontSize: '20px', color: '#FBBF24' }}>
            {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
          </div>
        </div>
      )
    case 'nps':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i} style={{ ...inputStyle, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: '12px', textAlign: 'center' as const }}>{i}</span>
            ))}
          </div>
        </div>
      )
    case 'slider':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <input type="range" style={{ width: '100%' }} disabled />
        </div>
      )
    case 'assinatura':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <div style={{ ...inputStyle, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: estiloCampos?.input_texto_cor || '#9CA3AF' }}>
            Área de assinatura
          </div>
        </div>
      )
    case 'cor':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <input type="color" style={{ width: '48px', height: '32px', border: 'none', cursor: 'default' }} disabled />
        </div>
      )
    case 'ranking':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {['Item 1', 'Item 2', 'Item 3'].map((item, i) => (
              <div key={i} style={{ ...inputStyle, padding: '6px 12px' }}>{i + 1}. {item}</div>
            ))}
          </div>
        </div>
      )
    case 'arquivo':
    case 'imagem':
    case 'documento':
    case 'upload_video':
    case 'upload_audio':
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <div style={{ ...inputStyle, padding: '12px', textAlign: 'center' as const, color: estiloCampos?.input_texto_cor || '#9CA3AF', borderStyle: 'dashed' }}>
            Clique ou arraste para enviar
          </div>
        </div>
      )
    default:
      // text, email, telefone, telefone_br, cpf, cnpj, cep, endereco, pais, estado, cidade, etc.
      return (
        <div>
          <span style={labelStyle}>{campo.label}{campo.obrigatorio ? ' *' : ''}</span>
          <input style={inputStyle} placeholder={placeholder || 'Digite aqui...'} readOnly />
        </div>
      )
  }
}
