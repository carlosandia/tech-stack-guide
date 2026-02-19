/**
 * AIDEV-NOTE: Preview responsivo do formulário
 * Mostra como o formulário ficará para o usuário final
 * Suporta visualização desktop/tablet/mobile
 * Drop zones claras entre campos para drag-and-drop preciso
 * Suporta click-to-edit de estilos (container, campos, botão)
 * Inclui seletor de país com bandeira para campos de telefone
 */

import React, { useState, useRef, useCallback, useEffect, forwardRef } from 'react'
import { getMaskForType } from '../../utils/masks'

import { generateFormResponsiveCss, generateColunasResponsiveCss, resolveValue } from '../../utils/responsiveStyles'
import { renderFinalCampo, PAISES_COMUNS } from '../../utils/renderFinalCampo'
import { Monitor, Tablet, Smartphone, Settings, Code, EyeOff, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import type { CampoFormulario, Formulario, EstiloContainer, EstiloCampos, EstiloBotao, EstiloCabecalho, NewsletterTemplate } from '../../services/formularios.api'
import type { ConfigBotoes } from '../config/ConfigBotoesEnvioForm'
import type { PopupTemplate } from '../config/PopupLayoutSelector'
import { CampoItem } from '../campos/CampoItem'
import { BlocoColunasEditor } from '../campos/BlocoColunasEditor'

import type { SelectedElement } from '../estilos/EstiloPreviewInterativo'

type Viewport = 'desktop' | 'tablet' | 'mobile'

const SOMBRA_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}


/** AIDEV-NOTE: Componente helper para injetar CSS responsivo via media queries ou forçado por viewport */
function ResponsiveCssInjector({ formId, botao, container, campos, allCampos, forceViewport }: {
  formId: string
  botao?: EstiloBotao
  container?: EstiloContainer
  campos?: EstiloCampos
  allCampos?: CampoFormulario[]
  forceViewport?: 'desktop' | 'tablet' | 'mobile'
}) {
  let css = generateFormResponsiveCss(
    formId,
    botao as unknown as Record<string, unknown>,
    container as unknown as Record<string, unknown>,
    campos as unknown as Record<string, unknown>,
    forceViewport,
  )
  // AIDEV-NOTE: Gerar CSS responsivo para cada bloco de colunas
  if (allCampos) {
    for (const c of allCampos) {
      if (c.tipo === 'bloco_colunas') {
        try {
          const p = JSON.parse(c.valor_padrao || '{}')
          css += generateColunasResponsiveCss(c.id, {
            colunas: parseInt(p.colunas) || 2,
            larguras: p.larguras || '50%,50%',
            larguras_tablet: p.larguras_tablet,
            larguras_mobile: p.larguras_mobile,
          }, forceViewport)
        } catch { /* skip */ }
      }
    }
  }
  if (!css) return null
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}


interface Props {
  formulario: Formulario
  campos: CampoFormulario[]
  selectedCampoId: string | null
  onSelectCampo: (id: string | null) => void
  onRemoveCampo: (id: string) => void
  onDuplicateCampo?: (campoId: string) => void
  onMoveCampo: (id: string, direcao: 'up' | 'down') => void
  onReorderCampo: (dragId: string, targetIndex: number) => void
  onDropNewCampo: (e: React.DragEvent, index: number) => void
  onDropNewCampoInColuna?: (e: React.DragEvent, index: number, paiCampoId: string, colunaIndice: number) => void
  onReorderCampoInColuna?: (dragId: string, targetIndex: number, paiCampoId: string, colunaIndice: number) => void
  onMoveCampoToColuna?: (campoId: string, paiCampoId: string, colunaIndice: number) => void
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
  // Popup layout
  popupLayout?: { template: PopupTemplate; imagemUrl: string | null; imagemLink?: string | null } | null
  // Newsletter layout
  newsletterLayout?: { template: NewsletterTemplate; imagemUrl: string | null; imagemLink?: string | null } | null
  // Inline editing
  onUpdateCampoLabel?: (campoId: string, newLabel: string) => void
  onUpdateCampoPlaceholder?: (campoId: string, newPlaceholder: string) => void
  onUpdateBotaoTexto?: (tipo: 'enviar' | 'whatsapp', newTexto: string) => void
}

export const FormPreview = forwardRef<HTMLDivElement, Props>(function FormPreview({
  formulario,
  campos,
  selectedCampoId,
  onSelectCampo,
  onRemoveCampo,
  onMoveCampo: _onMoveCampo,
  onReorderCampo,
  onDropNewCampo,
  onDropNewCampoInColuna,
  onReorderCampoInColuna,
  onMoveCampoToColuna,
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
  onSaveEstilos: _onSaveEstilos,
  isSaving: _isSaving,
  paginaBackgroundColor,
  cssCustomizado,
  configBotoes,
  popupLayout,
  newsletterLayout,
  onUpdateCampoLabel,
  onUpdateCampoPlaceholder,
  onUpdateBotaoTexto,
  onDuplicateCampo,
}, _ref) {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragOverImage, setDragOverImage] = useState(false)
  const [showContainerBorder, setShowContainerBorder] = useState(true)
  const dragCounter = useRef<Record<number, number>>({})
  const imageDropCounter = useRef(0)

  // Drag handlers for image area - delegates drop to index 0
  const handleImageDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    imageDropCounter.current++
    setDragOverImage(true)
  }, [])

  const handleImageDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    imageDropCounter.current--
    if (imageDropCounter.current <= 0) {
      imageDropCounter.current = 0
      setDragOverImage(false)
    }
  }, [])

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    imageDropCounter.current = 0
    setDragOverImage(false)

    const campoTipoData = e.dataTransfer.getData('application/campo-tipo')
    if (campoTipoData) {
      onDropNewCampo(e, 0)
      return
    }
    const draggedId = e.dataTransfer.getData('application/campo-id')
    if (draggedId) {
      onReorderCampo(draggedId, 0)
    }
  }, [onDropNewCampo, onReorderCampo])

  // AIDEV-NOTE: viewportWidths removido - agora usa viewportPixelWidths com width real

  // AIDEV-NOTE: Larguras reais em pixels para simular viewport no container
  const viewportPixelWidths: Record<Viewport, number | null> = {
    desktop: null, // usa largura real
    tablet: 768,
    mobile: 390,
  }

  // Style-derived values
  const fontFamily = estiloContainer?.font_family
    ? `${estiloContainer.font_family}, 'Inter', system-ui, sans-serif`
    : "'Inter', system-ui, sans-serif"

  // AIDEV-NOTE: Helper para resolver valores responsivos baseado no viewport selecionado
  const rv = useCallback((obj: Record<string, unknown> | undefined, field: string): string | undefined => {
    if (!obj) return undefined
    return resolveValue(obj, field, viewport)
  }, [viewport])

  const containerStyle: React.CSSProperties = estiloContainer ? {
    backgroundColor: estiloContainer.background_color || '#FFFFFF',
    borderRadius: estiloContainer.border_radius || '8px',
    padding: (rv(estiloContainer as any, 'padding_top') || estiloContainer.padding_top)
      ? `${rv(estiloContainer as any, 'padding_top') || '24'}px ${rv(estiloContainer as any, 'padding_right') || '24'}px ${rv(estiloContainer as any, 'padding_bottom') || '24'}px ${rv(estiloContainer as any, 'padding_left') || '24'}px`
      : (estiloContainer.padding || '24px'),
    fontFamily,
    maxWidth: rv(estiloContainer as any, 'max_width') || estiloContainer.max_width || undefined,
    boxShadow: SOMBRA_MAP[estiloContainer.sombra || 'md'] || SOMBRA_MAP.md,
  } : { fontFamily: "'Inter', system-ui, sans-serif" }

  const resolvedBtnLargura = rv(estiloBotao as any, 'largura') || estiloBotao?.largura
  const buttonStyle: React.CSSProperties = estiloBotao ? {
    backgroundColor: estiloBotao.background_color || '#3B82F6',
    color: estiloBotao.texto_cor || '#FFFFFF',
    borderRadius: estiloBotao.border_radius || '6px',
    width: (!resolvedBtnLargura || resolvedBtnLargura === 'full') ? '100%' : resolvedBtnLargura,
    height: rv(estiloBotao as any, 'altura') || estiloBotao.altura || undefined,
    padding: estiloBotao.padding || ((rv(estiloBotao as any, 'altura') || estiloBotao.altura) ? '0 20px' : '10px 20px'),
    margin: estiloBotao.margin || undefined,
    fontSize: rv(estiloBotao as any, 'font_size') || estiloBotao.font_size || '14px',
    fontWeight: estiloBotao.font_weight ? Number(estiloBotao.font_weight) : (estiloBotao.font_bold ? 700 : 600),
    fontStyle: estiloBotao.font_italic ? 'italic' : undefined,
    textDecoration: estiloBotao.font_underline ? 'underline' : undefined,
    border: estiloBotao.border_width && estiloBotao.border_width !== '0px'
      ? `${estiloBotao.border_width} ${estiloBotao.border_style || 'solid'} ${estiloBotao.border_color || '#000000'}`
      : 'none',
  } : {}



  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onSelectStyleElement) {
      onSelectStyleElement('container')
    }
  }, [onSelectStyleElement])

  // handleButtonClick removed - buttons now call onSelectStyleElement directly

  // AIDEV-NOTE: Debounced drag index to prevent flickering when hovering near zone edges
  const dragOverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastStableDragIndex = useRef<number | null>(null)

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current[index] = (dragCounter.current[index] || 0) + 1

    // Clear any pending timeout and set new index immediately
    if (dragOverTimeout.current) clearTimeout(dragOverTimeout.current)
    lastStableDragIndex.current = index
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
      // Delay clearing to prevent flicker when moving between adjacent zones
      if (dragOverTimeout.current) clearTimeout(dragOverTimeout.current)
      dragOverTimeout.current = setTimeout(() => {
        setDragOverIndex((prev) => (prev === index ? null : prev))
      }, 80)
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragOverTimeout.current) clearTimeout(dragOverTimeout.current)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragOverTimeout.current) clearTimeout(dragOverTimeout.current)
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
      className="relative w-full"
      style={{ zIndex: dragOverIndex === index ? 10 : undefined }}
    >
      {/* Invisible hit area — tall enough for easy targeting, no layout shift */}
      <div
        className={cn(
          'relative transition-all',
          isEmpty
            ? 'py-8'
            : dragOverIndex === index
              ? 'py-3'
              : 'py-1',
        )}
      >
        {/* Active indicator line */}
        {dragOverIndex === index && !isEmpty && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-2">
            <div className="flex-1 h-[2px] bg-primary rounded-full" />
            <span className="text-[10px] text-primary font-medium whitespace-nowrap px-1.5 py-0.5 bg-primary/10 rounded">
              Soltar aqui
            </span>
            <div className="flex-1 h-[2px] bg-primary rounded-full" />
          </div>
        )}
        {/* Empty state */}
        {isEmpty && dragOverIndex !== index && (
          <p className="text-sm text-muted-foreground text-center">
            Arraste campos da paleta para cá
          </p>
        )}
        {isEmpty && dragOverIndex === index && (
          <div className="border-2 border-dashed border-primary bg-primary/5 rounded-md py-4 text-center">
            <p className="text-xs text-primary font-medium">Soltar aqui</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Viewport switcher */}
      <div className="grid grid-cols-3 items-center px-3 py-1.5 border-b border-border bg-muted/30 shrink-0">
        {/* Left: Visualizar Final */}
        <div className="flex items-center">
          {onToggleFinalPreview && (
            <span className="text-xs text-muted-foreground select-none">Visualização Final</span>
          )}
        </div>

        {/* Center: Viewport switcher */}
        <div className="flex items-center justify-center gap-1">
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

        {/* Right: Border toggle + CSS */}
        <div className="flex items-center justify-end gap-1">
          <Button
            variant={showContainerBorder ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => setShowContainerBorder(prev => !prev)}
            title={showContainerBorder ? 'Ocultar borda do container' : 'Mostrar borda do container'}
          >
            {showContainerBorder ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
          {onToggleCss && !showFinalPreview && (
            <Button variant={showCssDrawer ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs" onClick={onToggleCss}>
              <Code className="w-3.5 h-3.5 mr-1.5" />CSS
            </Button>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div
        className="flex-1 overflow-auto p-4 flex justify-center min-h-0"
        data-preview-scroll
        style={{ backgroundColor: showFinalPreview ? (paginaBackgroundColor || '#F3F4F6') : 'hsl(220 15% 97.5%)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectStyleElement?.(null)
          }
        }}
      >
        {/* Inject custom CSS + responsive overrides */}
        {cssCustomizado && (
          <style dangerouslySetInnerHTML={{ __html: cssCustomizado }} />
        )}
        <ResponsiveCssInjector formId={formulario.id} botao={estiloBotao} container={estiloContainer} campos={estiloCampos} allCampos={campos} forceViewport={viewport !== 'desktop' ? viewport : undefined} />

        {/* AIDEV-NOTE: Wrapper externo para simular viewport - controla largura máxima sem afetar o container do form */}
        <div
          className="flex items-start justify-center mx-auto transition-all duration-300"
          style={{
            width: viewportPixelWidths[viewport] ? `${viewportPixelWidths[viewport]}px` : '100%',
            maxWidth: '100%',
          }}
        >
        <div
          className={cn(
            'w-full transition-all duration-300 rounded-lg relative',
            showFinalPreview && 'form-container',
            showFinalPreview
              ? (showContainerBorder ? 'border border-border' : '')
              : cn(
                  showContainerBorder ? 'border border-border' : '',
                  'group/container',
                  !estiloContainer && 'bg-card shadow-sm p-6',
                  selectedStyleElement === 'container' && 'outline outline-2 outline-dashed outline-primary outline-offset-4'
                )
          )}
          style={containerStyle}
          onClick={showFinalPreview ? undefined : handleContainerClick}
          data-form-container
          data-form-id={formulario.id}
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
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Layout wrapper (popup + newsletter) */}
          {(() => {
            const isPopup = formulario.tipo === 'popup'
            const isNewsletter = formulario.tipo === 'newsletter'

            // Determine layout config based on type
            const tpl = isPopup
              ? (popupLayout?.template || 'so_campos')
              : isNewsletter
                ? (newsletterLayout?.template || 'simples')
                : 'so_campos'
            const imgUrl = isPopup ? popupLayout?.imagemUrl : isNewsletter ? newsletterLayout?.imagemUrl : null
            const imgLink = isPopup ? popupLayout?.imagemLink : isNewsletter ? newsletterLayout?.imagemLink : null

            // Normalize: newsletter 'simples' = no image, 'hero_topo' = image top, 'hero_lateral' = lateral 50/50, 'so_imagem' = only image
            const hasImage = isPopup
              ? tpl !== 'so_campos'
              : isNewsletter
                ? tpl !== 'simples'
                : false

            // Image element or placeholder (wrapped in link if imgLink is set)
            const rawImage = hasImage ? (
              imgUrl ? (
                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                  Adicione uma imagem
                </div>
              )
            ) : null

            const imageEl = rawImage && imgLink && showFinalPreview ? (
              <a href={imgLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                {rawImage}
              </a>
            ) : rawImage

            // Form content (header + fields + buttons)
            const formContent = (
              <div>
                {/* Form header - only logo and description, no title */}
                {(estiloCabecalho?.logo_url || formulario.descricao) && (
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
                    {formulario.descricao && (
                      <p
                        className="text-sm mt-1"
                        style={{ color: estiloCabecalho?.descricao_cor || undefined, fontFamily }}
                      >
                        {formulario.descricao}
                      </p>
                    )}
                  </div>
                )}

                {/* Fields area */}
                {showFinalPreview ? (
                  <FinalPreviewFields campos={campos} estiloCampos={estiloCampos} fontFamily={fontFamily} viewport={viewport} />
                ) : (
                  <div
                    className={cn(
                      'rounded transition-all relative',
                      selectedStyleElement === 'campos' && 'outline outline-2 outline-dashed outline-primary outline-offset-2'
                    )}
                  >
                    {campos.length === 0 && renderDropZone(0, true)}

                    {campos.length > 0 && (() => {
                      // AIDEV-NOTE: Filtrar campos top-level (sem pai) e excluir botões (renderizados no rodapé)
                      const BUTTON_TYPES = ['botao_enviar', 'botao_whatsapp']
                      const topLevelCampos = campos.filter(c => !c.pai_campo_id && !BUTTON_TYPES.includes(c.tipo))

                      return (
                        <div className="group/campos">
                          {renderDropZone(0)}
                          <div className="flex flex-wrap">
                            {topLevelCampos.map((campo, index) => {
                              // AIDEV-NOTE: Larguras fracionárias - campos lado a lado
                              const largura = campo.largura || 'full'
                              const widthClass = largura === '1/2' ? 'w-[calc(50%-4px)]'
                                : largura === '1/3' ? 'w-[calc(33.333%-5.333px)]'
                                : largura === '2/3' ? 'w-[calc(66.666%-2.666px)]'
                                : 'w-full'

                              // Render bloco de colunas
                              if (campo.tipo === 'bloco_colunas') {
                                return (
                                  <div key={campo.id} className="w-full">
                                    <BlocoColunasEditor
                                      bloco={campo}
                                      todosCampos={campos}
                                      isSelected={selectedCampoId === campo.id}
                                      selectedCampoId={selectedCampoId}
                                      onSelect={() => onSelectCampo(campo.id)}
                                      onRemove={() => onRemoveCampo(campo.id)}
                                      onSelectCampo={onSelectCampo}
                                      onRemoveCampo={onRemoveCampo}
                                      onDropNewCampoInColuna={onDropNewCampoInColuna || (() => {})}
                                      onReorderCampoInColuna={onReorderCampoInColuna || (() => {})}
                                      onMoveCampoToColuna={onMoveCampoToColuna || (() => {})}
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
                                          onReorderCampo(draggedId, campo.ordem)
                                        }
                                      }}
                                      onDragLeave={() => {}}
                                      onUpdateLabel={onUpdateCampoLabel}
                                      onUpdatePlaceholder={onUpdateCampoPlaceholder}
                                      onDuplicateCampo={onDuplicateCampo}
                                      viewport={viewport}
                                      estiloCampos={estiloCampos}
                                      fontFamily={fontFamily}
                                    />
                                    {renderDropZone(campo.ordem + 1)}
                                  </div>
                                )
                              }

                              return (
                                <React.Fragment key={campo.id}>
                                  <div className={widthClass}>
                                    <CampoItem
                                      campo={campo}
                                      isSelected={selectedCampoId === campo.id}
                                      isDragOver={false}
                                      onSelect={() => onSelectCampo(campo.id)}
                                      onRemove={() => onRemoveCampo(campo.id)}
                                      onMoveUp={index > 0 ? () => _onMoveCampo(campo.id, 'up') : undefined}
                                      onMoveDown={index < topLevelCampos.length - 1 ? () => _onMoveCampo(campo.id, 'down') : undefined}
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
                                          onReorderCampo(draggedId, campo.ordem)
                                        }
                                      }}
                                      onDragLeave={() => {}}
                                      onUpdateLabel={onUpdateCampoLabel ? (newLabel) => onUpdateCampoLabel(campo.id, newLabel) : undefined}
                                      onUpdatePlaceholder={onUpdateCampoPlaceholder ? (newP) => onUpdateCampoPlaceholder(campo.id, newP) : undefined}
                                      onDuplicate={onDuplicateCampo ? () => onDuplicateCampo(campo.id) : undefined}
                                      estiloCampos={estiloCampos}
                                      fontFamily={fontFamily}
                                    />
                                  </div>
                                  {renderDropZone(campo.ordem + 1)}
                                </React.Fragment>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* LGPD Consent checkbox - rendered automatically when lgpd_ativo */}
                {formulario.lgpd_ativo && campos.length > 0 && (
                  <div className="mt-4 flex items-start gap-2 text-sm" style={{ fontFamily }}>
                    <input
                      type="checkbox"
                      disabled={!!showFinalPreview}
                      className="mt-0.5 rounded border-input"
                    />
                    <span className="text-foreground/80 leading-snug">
                      {formulario.lgpd_texto_consentimento || 'Ao enviar este formulário, você concorda com nossa Política de Privacidade.'}
                      {formulario.lgpd_url_politica && (
                        <>
                          {' '}
                          <a
                            href={formulario.lgpd_url_politica}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:text-primary/80"
                          >
                            Política de Privacidade
                          </a>
                        </>
                      )}
                      {formulario.lgpd_checkbox_obrigatorio && (
                        <span className="text-destructive ml-0.5">*</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Submit button(s) */}
                {campos.length > 0 && (
                  <div className="mt-6">
                    <RenderBotoes
                      configBotoes={configBotoes}
                      estiloBotao={estiloBotao}
                      buttonStyle={buttonStyle}
                      showFinalPreview={showFinalPreview || false}
                      selectedStyleElement={selectedStyleElement}
                      onSelectStyleElement={onSelectStyleElement}
                      onUpdateBotaoTexto={onUpdateBotaoTexto}
                      viewport={viewport}
                    />
                  </div>
                )}
              </div>
            )

            // No special layout needed - render form content directly
            if (!hasImage) return formContent

            const pTop = estiloContainer?.padding_top || '24'
            const pRight = estiloContainer?.padding_right || '24'
            const pBottom = estiloContainer?.padding_bottom || '24'
            const pLeft = estiloContainer?.padding_left || '24'
            const negMargin = { margin: `-${pTop}px -${pRight}px -${pBottom}px -${pLeft}px` }

            // so_imagem (popup or newsletter)
            if (tpl === 'so_imagem') {
              return (
                <div className="-m-6 rounded-lg overflow-hidden" style={negMargin}>
                  <div className="min-h-[300px]">{imageEl}</div>
                </div>
              )
            }

            // Popup-specific layouts
            if (isPopup) {
              if (tpl === 'imagem_esquerda') {
                return (
                  <div className="flex min-h-[300px] -m-6 rounded-lg overflow-hidden" style={negMargin}>
                    <div
                      className={cn('w-2/5 flex-shrink-0 transition-all', dragOverImage && 'ring-2 ring-dashed ring-primary ring-inset')}
                      onDragEnter={handleImageDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleImageDragLeave}
                      onDrop={handleImageDrop}
                    >{imageEl}</div>
                    <div className="w-3/5 p-6 overflow-auto">{formContent}</div>
                  </div>
                )
              }
              if (tpl === 'imagem_direita') {
                return (
                  <div className="flex min-h-[300px] -m-6 rounded-lg overflow-hidden" style={negMargin}>
                    <div className="w-3/5 p-6 overflow-auto">{formContent}</div>
                    <div
                      className={cn('w-2/5 flex-shrink-0 transition-all', dragOverImage && 'ring-2 ring-dashed ring-primary ring-inset')}
                      onDragEnter={handleImageDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleImageDragLeave}
                      onDrop={handleImageDrop}
                    >{imageEl}</div>
                  </div>
                )
              }
              if (tpl === 'imagem_topo') {
                return (
                  <div className="flex flex-col -m-6 rounded-lg overflow-hidden" style={negMargin}>
                    <div
                      className={cn('h-48 flex-shrink-0 transition-all', dragOverImage && 'ring-2 ring-dashed ring-primary ring-inset')}
                      onDragEnter={handleImageDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleImageDragLeave}
                      onDrop={handleImageDrop}
                    >{imageEl}</div>
                    <div className="p-6 overflow-auto">{formContent}</div>
                  </div>
                )
              }
              if (tpl === 'imagem_fundo') {
                return (
                  <div className="relative min-h-[350px] -m-6 rounded-lg overflow-hidden" style={negMargin}>
                    <div className="absolute inset-0">{imageEl}</div>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 p-6">{formContent}</div>
                  </div>
                )
              }
              if (tpl === 'imagem_lateral_full') {
                return (
                  <div className="flex min-h-[350px] -m-6 rounded-lg overflow-hidden" style={negMargin}>
                    <div
                      className={cn('w-1/2 flex-shrink-0 transition-all', dragOverImage && 'ring-2 ring-dashed ring-primary ring-inset')}
                      onDragEnter={handleImageDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleImageDragLeave}
                      onDrop={handleImageDrop}
                    >{imageEl}</div>
                    <div className="w-1/2 p-6 overflow-auto">{formContent}</div>
                  </div>
                )
              }
            }

            // Newsletter-specific layouts
            if (isNewsletter) {
              if (tpl === 'hero_topo') {
                return (
                  <div className="flex flex-col -m-6 rounded-lg overflow-hidden" style={negMargin}>
                    <div
                      className={cn('h-48 flex-shrink-0 transition-all', dragOverImage && 'ring-2 ring-dashed ring-primary ring-inset')}
                      onDragEnter={handleImageDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleImageDragLeave}
                      onDrop={handleImageDrop}
                    >{imageEl}</div>
                    <div className="p-6 overflow-auto">{formContent}</div>
                  </div>
                )
              }
              if (tpl === 'hero_lateral') {
                return (
                  <div className="flex min-h-[350px] -m-6 rounded-lg overflow-hidden" style={negMargin}>
                    <div
                      className={cn('w-1/2 flex-shrink-0 transition-all', dragOverImage && 'ring-2 ring-dashed ring-primary ring-inset')}
                      onDragEnter={handleImageDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleImageDragLeave}
                      onDrop={handleImageDrop}
                    >{imageEl}</div>
                    <div className="w-1/2 p-6 overflow-auto">{formContent}</div>
                  </div>
                )
              }
            }

            return formContent
          })()}
        </div>
        </div>
      </div>
    </div>
  )
})
FormPreview.displayName = 'FormPreview'

/** Wrapper com estado para campos no preview final (suporta máscaras interativas) */
function FinalPreviewFields({ campos, estiloCampos, fontFamily, viewport = 'desktop' }: { campos: CampoFormulario[], estiloCampos: EstiloCampos | undefined, fontFamily: string, viewport?: Viewport }) {
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
    <div style={{ fontSize: 0, display: 'flex', flexWrap: 'wrap', gap: '0 8px' }}>
      {campos.filter(c => !c.pai_campo_id && c.tipo !== 'botao_enviar' && c.tipo !== 'botao_whatsapp').map((campo) => {
        // AIDEV-NOTE: Renderizar bloco de colunas no preview final
        if (campo.tipo === 'bloco_colunas') {
          const colConfig = (() => {
            try {
              const p = JSON.parse(campo.valor_padrao || '{}')
              // AIDEV-NOTE: Resolver larguras baseado no viewport selecionado
              const desktopLarguras = (p.larguras || '50%,50%').split(',').map((l: string) => l.trim())
              const numCols = parseInt(p.colunas) || 2
              let resolvedLarguras = desktopLarguras
              if (viewport === 'tablet' && p.larguras_tablet) {
                resolvedLarguras = p.larguras_tablet.split(',').map((l: string) => l.trim())
              } else if (viewport === 'mobile') {
                const mobileLarguras = p.larguras_mobile || Array(numCols).fill('100%').join(',')
                resolvedLarguras = mobileLarguras.split(',').map((l: string) => l.trim())
              }
              return { colunas: numCols, larguras: resolvedLarguras, gap: p.gap || '16' }
            } catch { return { colunas: 2, larguras: ['50%', '50%'], gap: '16' } }
          })()

          return (
            <div key={campo.id} style={{ fontSize: '14px', width: '100%', padding: `${((campo.validacoes as Record<string, unknown>)?.spacing_top as string) || '0'}px ${((campo.validacoes as Record<string, unknown>)?.spacing_right as string) || '0'}px ${((campo.validacoes as Record<string, unknown>)?.spacing_bottom as string) || '0'}px ${((campo.validacoes as Record<string, unknown>)?.spacing_left as string) || '0'}px` }}>
              <div data-bloco-id={campo.id} style={{ display: 'flex', flexWrap: 'wrap', gap: `${colConfig.gap}px` }}>
                {Array.from({ length: colConfig.colunas }).map((_, colIdx) => {
                  const children = campos
                    .filter(c => c.pai_campo_id === campo.id && c.coluna_indice === colIdx)
                    .sort((a, b) => a.ordem - b.ordem)
                  const rawW = colConfig.larguras[colIdx] || `${Math.floor(100 / colConfig.colunas)}%`
                  // AIDEV-NOTE: Compensar o gap no cálculo da largura
                  const gapPx = parseInt(colConfig.gap) || 16
                  const totalGap = gapPx * (colConfig.colunas - 1)
                  const w = rawW.endsWith('%')
                    ? `calc(${rawW} - ${totalGap * parseFloat(rawW) / 100}px)`
                    : rawW

                  return (
                    <div key={colIdx} className={`col-${colIdx}`} style={{ width: w, display: 'flex', flexWrap: 'wrap' }}>
                      {children.map(child => {
                        const childWidth = child.largura === '1/2' ? 'calc(50% - 4px)' : child.largura === '1/3' ? 'calc(33.333% - 5.333px)' : child.largura === '2/3' ? 'calc(66.666% - 2.666px)' : '100%'
                        return (
                          <div key={child.id} style={{ fontSize: '14px', width: childWidth, padding: `${((child.validacoes as Record<string, unknown>)?.spacing_top as string) || '0'}px ${((child.validacoes as Record<string, unknown>)?.spacing_right as string) || '0'}px ${((child.validacoes as Record<string, unknown>)?.spacing_bottom as string) || '0'}px ${((child.validacoes as Record<string, unknown>)?.spacing_left as string) || '0'}px` }}>
                            {renderFinalCampo(
                              child, estiloCampos, fontFamily,
                              valores[child.id] || '',
                              (v) => handleChange(child.id, child.tipo, v),
                              paises[child.id] || (PAISES_COMUNS.find(p => p.code === child.valor_padrao) || PAISES_COMUNS[0]),
                              (p) => handlePaisChange(child.id, p),
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        const largura = campo.largura || 'full'
        const width = largura === '1/2' ? 'calc(50% - 4px)'
          : largura === '1/3' ? 'calc(33.333% - 5.333px)'
          : largura === '2/3' ? 'calc(66.666% - 2.666px)'
          : '100%'

        return (
          <div key={campo.id} style={{ fontSize: '14px', width, padding: `${((campo.validacoes as Record<string, unknown>)?.spacing_top as string) || '0'}px ${((campo.validacoes as Record<string, unknown>)?.spacing_right as string) || '0'}px ${((campo.validacoes as Record<string, unknown>)?.spacing_bottom as string) || '0'}px ${((campo.validacoes as Record<string, unknown>)?.spacing_left as string) || '0'}px` }}>
            {renderFinalCampo(
              campo, estiloCampos, fontFamily,
              valores[campo.id] || '',
              (v) => handleChange(campo.id, campo.tipo, v),
              paises[campo.id] || (PAISES_COMUNS.find(p => p.code === campo.valor_padrao) || PAISES_COMUNS[0]),
              (p) => handlePaisChange(campo.id, p),
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Componente de botões com suporte a edição inline do texto */
const RenderBotoes = forwardRef<HTMLDivElement, {
  configBotoes: ConfigBotoes | null | undefined
  estiloBotao: EstiloBotao | undefined
  buttonStyle: React.CSSProperties
  showFinalPreview: boolean
  selectedStyleElement: SelectedElement | undefined
  onSelectStyleElement: ((el: SelectedElement) => void) | undefined
  onUpdateBotaoTexto?: ((tipo: 'enviar' | 'whatsapp', newTexto: string) => void)
  viewport?: Viewport
}>(function RenderBotoes({
  configBotoes,
  estiloBotao,
  buttonStyle,
  showFinalPreview,
  selectedStyleElement,
  onSelectStyleElement,
  onUpdateBotaoTexto,
  viewport,
}, _ref) {
  const rvBtn = useCallback((field: string): string | undefined => {
    if (!estiloBotao) return undefined
    return resolveValue(estiloBotao as unknown as Record<string, unknown>, field, viewport || 'desktop')
  }, [estiloBotao, viewport])
  const [editingEnviar, setEditingEnviar] = useState(false)
  const [editingWhatsApp, setEditingWhatsApp] = useState(false)
  const [enviarText, setEnviarText] = useState(estiloBotao?.texto || 'Enviar')
  const [whatsAppText, setWhatsAppText] = useState(estiloBotao?.whatsapp_texto || 'Enviar via WhatsApp')
  const enviarInputRef = useRef<HTMLInputElement>(null)
  const whatsAppInputRef = useRef<HTMLInputElement>(null)

  // Sync from props
  useEffect(() => { setEnviarText(estiloBotao?.texto || 'Enviar') }, [estiloBotao?.texto])
  useEffect(() => { setWhatsAppText(estiloBotao?.whatsapp_texto || 'Enviar via WhatsApp') }, [estiloBotao?.whatsapp_texto])
  useEffect(() => { if (editingEnviar && enviarInputRef.current) { enviarInputRef.current.focus(); enviarInputRef.current.select() } }, [editingEnviar])
  useEffect(() => { if (editingWhatsApp && whatsAppInputRef.current) { whatsAppInputRef.current.focus(); whatsAppInputRef.current.select() } }, [editingWhatsApp])

  const handleEnviarBlur = () => {
    setEditingEnviar(false)
    const trimmed = enviarText.trim()
    if (trimmed && trimmed !== (estiloBotao?.texto || 'Enviar') && onUpdateBotaoTexto) {
      onUpdateBotaoTexto('enviar', trimmed)
    }
  }

  const handleWhatsAppBlur = () => {
    setEditingWhatsApp(false)
    const trimmed = whatsAppText.trim()
    if (trimmed && trimmed !== (estiloBotao?.whatsapp_texto || 'Enviar via WhatsApp') && onUpdateBotaoTexto) {
      onUpdateBotaoTexto('whatsapp', trimmed)
    }
  }

  const tipoBotao = configBotoes?.tipo_botao || 'enviar'
  const showEnviar = tipoBotao === 'enviar' || tipoBotao === 'ambos'
  const showWhatsApp = tipoBotao === 'whatsapp' || tipoBotao === 'ambos'

  const enviarBtn = showEnviar ? (
    <div className="relative group/botao-enviar">
      {!showFinalPreview && onSelectStyleElement && (
        <div className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center gap-0.5 transition-opacity',
          'opacity-0 group-hover/botao-enviar:opacity-100',
        )}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelectStyleElement('botao') }}
            className={cn(
              'p-1 rounded-full border bg-card shadow-sm',
              selectedStyleElement === 'botao' ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:text-primary hover:border-primary'
            )}
            title="Configurar botão Enviar"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <button
        type="button"
        className={cn(
          'rounded-md text-sm font-semibold transition-all w-full form-btn-submit',
          !estiloBotao && 'bg-primary text-primary-foreground py-2.5',
          !showFinalPreview && selectedStyleElement === 'botao' && 'outline outline-2 outline-dashed outline-primary outline-offset-2'
        )}
        style={estiloBotao ? { ...buttonStyle, width: '100%' } : undefined}
        onClick={showFinalPreview ? undefined : (e) => { e.stopPropagation(); onSelectStyleElement?.('botao'); if (onUpdateBotaoTexto) setEditingEnviar(true) }}
      >
        {editingEnviar ? (
          <input
            ref={enviarInputRef}
            value={enviarText}
            onChange={(e) => setEnviarText(e.target.value)}
            onBlur={handleEnviarBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEnviarBlur(); if (e.key === 'Escape') { setEnviarText(estiloBotao?.texto || 'Enviar'); setEditingEnviar(false) } }}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent text-center border-none outline-none w-full"
            style={{ color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit' }}
          />
        ) : (
          estiloBotao?.texto || 'Enviar'
        )}
      </button>
    </div>
  ) : null

  const whatsAppBtn = showWhatsApp ? (
    <div className="relative group/botao-whatsapp">
      {!showFinalPreview && onSelectStyleElement && (
        <div className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center gap-0.5 transition-opacity',
          'opacity-0 group-hover/botao-whatsapp:opacity-100',
        )}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelectStyleElement('botao_whatsapp') }}
            className={cn(
              'p-1 rounded-full border bg-card shadow-sm',
              selectedStyleElement === 'botao_whatsapp' ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:text-primary hover:border-primary'
            )}
            title="Configurar botão WhatsApp"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <button
        type="button"
        className={cn(
          'rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 w-full form-btn-whatsapp',
          !showFinalPreview && selectedStyleElement === 'botao_whatsapp' && 'outline outline-2 outline-dashed outline-primary outline-offset-2'
        )}
        style={{
          backgroundColor: estiloBotao?.whatsapp_background || '#25D366',
          color: estiloBotao?.whatsapp_texto_cor || '#FFFFFF',
          borderRadius: estiloBotao?.whatsapp_border_radius || estiloBotao?.border_radius || '6px',
          width: '100%',
          height: rvBtn('whatsapp_altura') || estiloBotao?.whatsapp_altura || undefined,
          padding: estiloBotao?.whatsapp_padding || ((rvBtn('whatsapp_altura') || estiloBotao?.whatsapp_altura) ? '0 20px' : '10px 20px'),
          margin: estiloBotao?.whatsapp_margin || undefined,
          fontSize: rvBtn('whatsapp_font_size') || estiloBotao?.whatsapp_font_size || '14px',
          fontWeight: estiloBotao?.whatsapp_font_weight ? Number(estiloBotao.whatsapp_font_weight) : (estiloBotao?.whatsapp_font_bold ? 700 : 600),
          fontStyle: estiloBotao?.whatsapp_font_italic ? 'italic' : undefined,
          textDecoration: estiloBotao?.whatsapp_font_underline ? 'underline' : undefined,
          border: estiloBotao?.whatsapp_border_width && estiloBotao.whatsapp_border_width !== '0px'
            ? `${estiloBotao.whatsapp_border_width} ${estiloBotao.whatsapp_border_style || 'solid'} ${estiloBotao.whatsapp_border_color || '#000000'}`
            : 'none',
        }}
        onClick={showFinalPreview ? undefined : (e) => { e.stopPropagation(); onSelectStyleElement?.('botao_whatsapp'); if (onUpdateBotaoTexto) setEditingWhatsApp(true) }}
      >
        <WhatsAppIcon size={16} className="shrink-0" />
        {editingWhatsApp ? (
          <input
            ref={whatsAppInputRef}
            value={whatsAppText}
            onChange={(e) => setWhatsAppText(e.target.value)}
            onBlur={handleWhatsAppBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') handleWhatsAppBlur(); if (e.key === 'Escape') { setWhatsAppText(estiloBotao?.whatsapp_texto || 'Enviar via WhatsApp'); setEditingWhatsApp(false) } }}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent text-center border-none outline-none flex-1"
            style={{ color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit' }}
          />
        ) : (
          estiloBotao?.whatsapp_texto || 'Enviar via WhatsApp'
        )}
      </button>
    </div>
  ) : null

  // AIDEV-NOTE: Resolve largura do wrapper (container) baseado no config
  const resolveWrapperWidth = (largura?: string) => (!largura || largura === 'full') ? '100%' : largura

  if (tipoBotao === 'ambos') {
    const larguraEnviar = rvBtn('largura') || estiloBotao?.largura || 'full'
    const larguraWhatsApp = rvBtn('whatsapp_largura') || estiloBotao?.whatsapp_largura || 'full'
    const ladoALado = larguraEnviar === '50%' && larguraWhatsApp === '50%'

    return (
      <div className={cn('flex gap-2', ladoALado ? 'flex-row' : 'flex-col')}>
        <div style={{ width: ladoALado ? '50%' : '100%' }}>{enviarBtn}</div>
        <div style={{ width: ladoALado ? '50%' : '100%' }}>{whatsAppBtn}</div>
      </div>
    )
  }

  // Single button: wrapper controls width
  if (enviarBtn) {
    const w = rvBtn('largura') || estiloBotao?.largura
    return <div style={{ width: resolveWrapperWidth(w) }}>{enviarBtn}</div>
  }
  if (whatsAppBtn) {
    const w = rvBtn('whatsapp_largura') || estiloBotao?.whatsapp_largura
    return <div style={{ width: resolveWrapperWidth(w) }}>{whatsAppBtn}</div>
  }
  return null

  
})
RenderBotoes.displayName = 'RenderBotoes'
