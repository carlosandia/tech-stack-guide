/**
 * AIDEV-NOTE: Preview responsivo do formulário
 * Mostra como o formulário ficará para o usuário final
 * Suporta visualização desktop/tablet/mobile
 * Drop zones claras entre campos para drag-and-drop preciso
 * Suporta click-to-edit de estilos (container, campos, botão)
 * Inclui seletor de país com bandeira para campos de telefone
 */

import { useState, useRef, useCallback } from 'react'
import { getMaskForType } from '../../utils/masks'
import { Monitor, Tablet, Smartphone, Paintbrush, Eye, EyeOff, Code, Save, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import type { CampoFormulario, Formulario, EstiloContainer, EstiloCampos, EstiloBotao, EstiloCabecalho } from '../../services/formularios.api'
import type { ConfigBotoes } from '../config/ConfigBotoesEnvioForm'
import { CampoItem } from '../campos/CampoItem'
import { TermosModal } from '../campos/TermosModal'
import type { SelectedElement } from '../estilos/EstiloPreviewInterativo'

type Viewport = 'desktop' | 'tablet' | 'mobile'

const SOMBRA_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}

// AIDEV-NOTE: TAMANHO_BOTAO removido - agora usamos altura livre definida pelo usuário

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
    height: estiloBotao.altura || undefined,
    padding: estiloBotao.altura ? '0 20px' : '10px 20px',
    fontSize: estiloBotao.font_size || '14px',
    fontWeight: estiloBotao.font_bold ? 700 : 600,
    fontStyle: estiloBotao.font_italic ? 'italic' : undefined,
    textDecoration: estiloBotao.font_underline ? 'underline' : undefined,
    border: 'none',
  } : {}


  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onSelectStyleElement) {
      onSelectStyleElement('container')
    }
  }, [onSelectStyleElement])

  // handleButtonClick removed - buttons now call onSelectStyleElement directly

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
            showFinalPreview && 'form-container',
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
            /* Final Preview: render all field types with styles and largura support */
            <FinalPreviewFields campos={campos} estiloCampos={estiloCampos} fontFamily={fontFamily} />
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
            <div className="mt-6">
              {renderBotoes(
                configBotoes,
                estiloBotao,
                buttonStyle,
                showFinalPreview || false,
                selectedStyleElement,
                onSelectStyleElement,
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Wrapper com estado para campos no preview final (suporta máscaras interativas) */
function FinalPreviewFields({ campos, estiloCampos, fontFamily }: { campos: CampoFormulario[], estiloCampos: EstiloCampos | undefined, fontFamily: string }) {
  const [valores, setValores] = useState<Record<string, string>>({})
  const [paises, setPaises] = useState<Record<string, { code: string; ddi: string; flag: string }>>({})

  const handleChange = useCallback((campoId: string, tipo: string, rawValue: string) => {
    const mask = getMaskForType(tipo)
    const value = mask ? mask(rawValue) : rawValue
    setValores(prev => ({ ...prev, [campoId]: value }))
  }, [])

  const handlePaisChange = useCallback((campoId: string, pais: { code: string; ddi: string; flag: string }) => {
    setPaises(prev => ({ ...prev, [campoId]: pais }))
  }, [])

  return (
    <div style={{ fontSize: 0 }}>
      {campos.map((campo) => (
        <div key={campo.id} style={{ fontSize: '14px', marginBottom: '12px' }}>
          {renderFinalCampo(
            campo, estiloCampos, fontFamily,
            valores[campo.id] || '',
            (v) => handleChange(campo.id, campo.tipo, v),
            paises[campo.id] || { code: 'BR', ddi: '55', flag: '🇧🇷' },
            (p) => handlePaisChange(campo.id, p),
          )}
        </div>
      ))}
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
  onSelectStyleElement: ((el: SelectedElement) => void) | undefined,
) {
  const tipoBotao = configBotoes?.tipo_botao || 'enviar'
  const showEnviar = tipoBotao === 'enviar' || tipoBotao === 'ambos'
  const showWhatsApp = tipoBotao === 'whatsapp' || tipoBotao === 'ambos'

  const enviarBtn = showEnviar ? (
    <div className="relative group/botao-enviar">
      {!showFinalPreview && onSelectStyleElement && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelectStyleElement('botao') }}
          className={cn(
            'absolute -right-2 -top-2 z-10 p-1 rounded-full border bg-card shadow-sm transition-opacity',
            'opacity-0 group-hover/botao-enviar:opacity-100',
            selectedStyleElement === 'botao' ? 'opacity-100 border-primary text-primary' : 'border-border text-muted-foreground hover:text-primary hover:border-primary'
          )}
          title="Editar estilos do botão Enviar"
        >
          <Paintbrush className="w-3 h-3" />
        </button>
      )}
      <button
        type="button"
        className={cn(
          'rounded-md text-sm font-semibold transition-all',
          !estiloBotao && 'w-full bg-primary text-primary-foreground py-2.5',
          !showFinalPreview && selectedStyleElement === 'botao' && 'outline outline-2 outline-dashed outline-primary outline-offset-2'
        )}
        style={estiloBotao ? buttonStyle : undefined}
        onClick={showFinalPreview ? undefined : (e) => { e.stopPropagation(); onSelectStyleElement?.('botao') }}
      >
        {estiloBotao?.texto || 'Enviar'}
      </button>
    </div>
  ) : null

  const whatsAppBtn = showWhatsApp ? (
    <div className="relative group/botao-whatsapp">
      {!showFinalPreview && onSelectStyleElement && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelectStyleElement('botao_whatsapp') }}
          className={cn(
            'absolute -right-2 -top-2 z-10 p-1 rounded-full border bg-card shadow-sm transition-opacity',
            'opacity-0 group-hover/botao-whatsapp:opacity-100',
            selectedStyleElement === 'botao_whatsapp' ? 'opacity-100 border-primary text-primary' : 'border-border text-muted-foreground hover:text-primary hover:border-primary'
          )}
          title="Editar estilos do botão WhatsApp"
        >
          <Paintbrush className="w-3 h-3" />
        </button>
      )}
      <button
        type="button"
        className={cn(
          'rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2',
          !showFinalPreview && selectedStyleElement === 'botao_whatsapp' && 'outline outline-2 outline-dashed outline-primary outline-offset-2'
        )}
        style={{
          backgroundColor: estiloBotao?.whatsapp_background || '#25D366',
          color: estiloBotao?.whatsapp_texto_cor || '#FFFFFF',
          borderRadius: estiloBotao?.whatsapp_border_radius || estiloBotao?.border_radius || '6px',
          width: tipoBotao === 'ambos' ? '100%' : (estiloBotao?.whatsapp_largura === 'full' ? '100%' : estiloBotao?.whatsapp_largura === '50%' ? '50%' : 'auto'),
          height: estiloBotao?.whatsapp_altura || undefined,
          padding: estiloBotao?.whatsapp_altura ? '0 20px' : '10px 20px',
          fontSize: estiloBotao?.whatsapp_font_size || '14px',
          fontWeight: estiloBotao?.whatsapp_font_bold ? 700 : 600,
          fontStyle: estiloBotao?.whatsapp_font_italic ? 'italic' : undefined,
          textDecoration: estiloBotao?.whatsapp_font_underline ? 'underline' : undefined,
          border: 'none',
        }}
        onClick={showFinalPreview ? undefined : (e) => { e.stopPropagation(); onSelectStyleElement?.('botao_whatsapp') }}
      >
        <WhatsAppIcon size={16} className="shrink-0" />
        {estiloBotao?.whatsapp_texto || 'Enviar via WhatsApp'}
      </button>
    </div>
  ) : null

  if (tipoBotao === 'ambos') {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">{enviarBtn}</div>
        <div className="flex-1">{whatsAppBtn}</div>
      </div>
    )
  }

  return enviarBtn || whatsAppBtn
}

/** Helper: renders label with optional info icon tooltip */
function renderLabel(
  campo: CampoFormulario,
  labelStyle: React.CSSProperties,
) {
  return (
    <span style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
      {campo.label}{campo.obrigatorio ? <span style={{ color: '#EF4444' }}> *</span> : ''}
      {campo.texto_ajuda && (
        <span title={campo.texto_ajuda} style={{ cursor: 'help', display: 'inline-flex' }}>
          <Info style={{ width: '14px', height: '14px', color: '#9CA3AF' }} />
        </span>
      )}
    </span>
  )
}

const PAISES_COMUNS = [
  { code: 'BR', ddi: '55', flag: '🇧🇷', nome: 'Brasil' },
  { code: 'US', ddi: '1', flag: '🇺🇸', nome: 'EUA' },
  { code: 'PT', ddi: '351', flag: '🇵🇹', nome: 'Portugal' },
  { code: 'AR', ddi: '54', flag: '🇦🇷', nome: 'Argentina' },
  { code: 'UY', ddi: '598', flag: '🇺🇾', nome: 'Uruguai' },
  { code: 'PY', ddi: '595', flag: '🇵🇾', nome: 'Paraguai' },
  { code: 'CL', ddi: '56', flag: '🇨🇱', nome: 'Chile' },
  { code: 'CO', ddi: '57', flag: '🇨🇴', nome: 'Colômbia' },
  { code: 'MX', ddi: '52', flag: '🇲🇽', nome: 'México' },
  { code: 'ES', ddi: '34', flag: '🇪🇸', nome: 'Espanha' },
  { code: 'FR', ddi: '33', flag: '🇫🇷', nome: 'França' },
  { code: 'DE', ddi: '49', flag: '🇩🇪', nome: 'Alemanha' },
  { code: 'IT', ddi: '39', flag: '🇮🇹', nome: 'Itália' },
  { code: 'GB', ddi: '44', flag: '🇬🇧', nome: 'Reino Unido' },
  { code: 'JP', ddi: '81', flag: '🇯🇵', nome: 'Japão' },
]

/** Input de telefone com seletor de país/DDI */
function PhoneInputWithCountry({
  inputStyle,
  placeholder,
  valor,
  onChange,
  paisSelecionado,
  onPaisChange,
}: {
  inputStyle: React.CSSProperties
  placeholder: string
  valor: string
  onChange: (v: string) => void
  paisSelecionado?: { code: string; ddi: string; flag: string }
  onPaisChange?: (p: { code: string; ddi: string; flag: string }) => void
}) {
  const [aberto, setAberto] = useState(false)
  const pais = paisSelecionado || PAISES_COMUNS[0]

  return (
    <div style={{ position: 'relative', display: 'flex', gap: 0 }}>
      {/* Seletor de país */}
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        style={{
          ...inputStyle,
          width: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 8px',
          borderRight: 'none',
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          cursor: 'pointer',
          flexShrink: 0,
          fontSize: '14px',
        }}
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>{pais.flag}</span>
        <span style={{ fontSize: '12px', color: inputStyle.color, opacity: 0.7 }}>+{pais.ddi}</span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>▼</span>
      </button>
      {/* Input */}
      <input
        style={{
          ...inputStyle,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          flex: 1,
        }}
        placeholder={placeholder || '(00) 00000-0000'}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
      {/* Dropdown */}
      {aberto && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 50,
            background: '#FFFFFF',
            border: `1px solid ${(inputStyle.border as string)?.includes('solid') ? '#D1D5DB' : '#D1D5DB'}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            maxHeight: '200px',
            overflowY: 'auto',
            minWidth: '200px',
            marginTop: '4px',
          }}
        >
          {PAISES_COMUNS.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => {
                onPaisChange?.(p)
                setAberto(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: p.code === pais.code ? '#F3F4F6' : 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#F3F4F6' }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = p.code === pais.code ? '#F3F4F6' : 'transparent' }}
            >
              <span style={{ fontSize: '16px' }}>{p.flag}</span>
              <span>{p.nome}</span>
              <span style={{ marginLeft: 'auto', color: '#9CA3AF', fontSize: '12px' }}>+{p.ddi}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


function renderFinalCampo(
  campo: CampoFormulario,
  estiloCampos: EstiloCampos | undefined,
  fontFamily: string,
  valor: string = '',
  onChange?: (v: string) => void,
  paisSelecionado?: { code: string; ddi: string; flag: string },
  onPaisChange?: (p: { code: string; ddi: string; flag: string }) => void,
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

  // Largura do wrapper
  const larguraMap: Record<string, string> = { full: '100%', half: '50%', third: '33.33%' }
  const wrapperStyle: React.CSSProperties = {
    width: larguraMap[campo.largura] || '100%',
    display: 'inline-block',
    verticalAlign: 'top',
    paddingRight: campo.largura !== 'full' ? '8px' : undefined,
    boxSizing: 'border-box' as const,
  }

  // Campos de layout (sem wrapper de largura)
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
  }

  // Campos de input (com suporte a largura)
  const renderInput = () => {
    const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onChange?.(e.target.value)
    }

    switch (campo.tipo) {
      case 'area_texto':
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <textarea style={{ ...inputStyle, height: '64px', resize: 'vertical' }} placeholder={placeholder || 'Digite aqui...'} value={valor} onChange={handleInput} />
          </div>
        )
      case 'checkbox':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" style={{ width: '16px', height: '16px' }} onChange={(e) => onChange?.(e.target.checked ? 'sim' : '')} />
            <span style={{ ...labelStyle, marginBottom: 0 }}>{campo.label}{campo.obrigatorio ? <span style={{ color: '#EF4444' }}> *</span> : ''}</span>
          </div>
        )
      case 'checkbox_termos':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" style={{ width: '16px', height: '16px' }} onChange={(e) => onChange?.(e.target.checked ? 'sim' : '')} />
            <span style={{ ...labelStyle, marginBottom: 0 }}>
              {campo.label}{campo.obrigatorio ? <span style={{ color: '#EF4444' }}> *</span> : ''}
              {campo.valor_padrao && (
                <TermosModal
                  texto={campo.valor_padrao}
                  trigger={
                    <button
                      type="button"
                      style={{ color: '#3B82F6', textDecoration: 'underline', marginLeft: '4px', fontSize: 'inherit', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Ver termos
                    </button>
                  }
                />
              )}
            </span>
          </div>
        )
      case 'selecao':
      case 'selecao_multipla':
      case 'pais':
      case 'estado':
      case 'cidade':
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <select style={{ ...inputStyle, appearance: 'auto' }} value={valor} onChange={handleInput}>
              <option value="">{placeholder || (campo.tipo === 'selecao_multipla' ? 'Selecione uma ou mais...' : 'Selecione...')}</option>
              {(campo.opcoes as string[] || []).map((op, i) => (
                <option key={i} value={op}>{typeof op === 'string' ? op : `Opção ${i + 1}`}</option>
              ))}
            </select>
          </div>
        )
      case 'radio':
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(campo.opcoes as string[] || ['Opção 1', 'Opção 2']).slice(0, 4).map((op, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: estiloCampos?.input_texto_cor || '#1F2937', fontFamily, cursor: 'pointer' }}>
                  <input type="radio" name={campo.id} checked={valor === op} onChange={() => onChange?.(typeof op === 'string' ? op : `Opção ${i + 1}`)} />
                  {typeof op === 'string' ? op : `Opção ${i + 1}`}
                </label>
              ))}
            </div>
          </div>
        )
      case 'data':
        return <div>{renderLabel(campo, labelStyle)}<input type="date" style={inputStyle} value={valor} onChange={handleInput} /></div>
      case 'data_hora':
        return <div>{renderLabel(campo, labelStyle)}<input type="datetime-local" style={inputStyle} value={valor} onChange={handleInput} /></div>
      case 'hora':
        return <div>{renderLabel(campo, labelStyle)}<input type="time" style={inputStyle} value={valor} onChange={handleInput} /></div>
      case 'moeda':
      case 'cpf':
      case 'cnpj':
      case 'cep':
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <input style={inputStyle} placeholder={placeholder || ''} value={valor} onChange={handleInput} />
          </div>
        )
      case 'telefone':
      case 'telefone_br':
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <PhoneInputWithCountry
              inputStyle={inputStyle}
              placeholder={placeholder}
              valor={valor}
              onChange={(v) => onChange?.(v)}
              paisSelecionado={paisSelecionado}
              onPaisChange={onPaisChange}
            />
          </div>
        )
      case 'numero':
        return <div>{renderLabel(campo, labelStyle)}<input type="number" style={inputStyle} placeholder={placeholder || '0'} value={valor} onChange={handleInput} /></div>
      case 'url':
        return <div>{renderLabel(campo, labelStyle)}<input type="url" style={inputStyle} placeholder={placeholder || 'https://'} value={valor} onChange={handleInput} /></div>
      case 'email':
        return <div>{renderLabel(campo, labelStyle)}<input type="email" style={inputStyle} placeholder={placeholder || 'email@exemplo.com'} value={valor} onChange={handleInput} /></div>
      case 'endereco':
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <input style={{ ...inputStyle, marginBottom: '6px' }} placeholder={placeholder || 'Rua, número...'} value={valor} onChange={handleInput} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Cidade" />
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Estado" />
            </div>
          </div>
        )
      case 'avaliacao':
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <div style={{ display: 'flex', gap: '4px', fontSize: '20px', color: '#FBBF24', cursor: 'pointer' }}>
              {'★★★★★'.split('').map((s, i) => <span key={i} onClick={() => onChange?.(String(i + 1))}>{s}</span>)}
            </div>
          </div>
        )
      case 'nps':
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: 11 }, (_, i) => (
                <span key={i} onClick={() => onChange?.(String(i))} style={{ ...inputStyle, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: '12px', textAlign: 'center' as const, cursor: 'pointer', backgroundColor: valor === String(i) ? '#3B82F6' : inputStyle.backgroundColor, color: valor === String(i) ? '#FFFFFF' : inputStyle.color }}>{i}</span>
              ))}
            </div>
          </div>
        )
      case 'slider':
        return <div>{renderLabel(campo, labelStyle)}<input type="range" style={{ width: '100%' }} value={valor || '50'} onChange={handleInput} /></div>
      case 'assinatura':
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <div style={{ ...inputStyle, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: estiloCampos?.input_texto_cor || '#9CA3AF' }}>
              Área de assinatura
            </div>
          </div>
        )
      case 'cor':
        return <div>{renderLabel(campo, labelStyle)}<input type="color" style={{ width: '48px', height: '32px', border: 'none', cursor: 'pointer' }} value={valor || '#000000'} onChange={handleInput} /></div>
      case 'ranking':
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(campo.opcoes as string[] || ['Item 1', 'Item 2', 'Item 3']).map((item, i) => (
                <div key={i} style={{ ...inputStyle, padding: '6px 12px' }}>{i + 1}. {typeof item === 'string' ? item : `Item ${i + 1}`}</div>
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
            {renderLabel(campo, labelStyle)}
            <div style={{ ...inputStyle, padding: '12px', textAlign: 'center' as const, color: estiloCampos?.input_texto_cor || '#9CA3AF', borderStyle: 'dashed', cursor: 'pointer' }}>
              Clique ou arraste para enviar
            </div>
          </div>
        )
      default:
        return (
          <div>
            {renderLabel(campo, labelStyle)}
            <input style={inputStyle} placeholder={placeholder || 'Digite aqui...'} value={valor} onChange={handleInput} />
          </div>
        )
    }
  }

  return <div style={wrapperStyle}>{renderInput()}</div>
}
