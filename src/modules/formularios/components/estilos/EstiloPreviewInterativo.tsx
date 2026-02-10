/**
 * AIDEV-NOTE: Preview interativo com click-to-edit para estilos
 * Cada área (container, campos, botão) é clicável e abre painel de edição
 * Renderiza campos reais do formulário quando disponíveis
 */

import { useCallback } from 'react'
import type {
  EstiloContainer,
  EstiloCabecalho,
  EstiloCampos,
  EstiloBotao,
  CampoFormulario,
} from '../../services/formularios.api'

export type SelectedElement = 'container' | 'campos' | 'botao' | 'botao_whatsapp' | null

interface Props {
  container: EstiloContainer
  cabecalho: EstiloCabecalho
  campos: EstiloCampos
  botao: EstiloBotao
  titulo?: string
  descricao?: string
  selectedElement: SelectedElement
  onSelectElement: (el: SelectedElement) => void
  isPreviewMode: boolean
  camposReais?: CampoFormulario[]
}

const SOMBRA_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}

// AIDEV-NOTE: TAMANHO_BOTAO removido - agora usamos altura livre

export function EstiloPreviewInterativo({
  container,
  cabecalho,
  campos,
  botao,
  titulo,
  descricao,
  selectedElement,
  onSelectElement,
  isPreviewMode,
  camposReais,
}: Props) {
  const fontFamily = container.font_family
    ? `${container.font_family}, 'Inter', system-ui, sans-serif`
    : "'Inter', system-ui, sans-serif"

  const computedPadding = container.padding_top
    ? `${container.padding_top}px ${container.padding_right || '24'}px ${container.padding_bottom || '24'}px ${container.padding_left || '24'}px`
    : (container.padding || '24px')

  const containerStyle: React.CSSProperties = {
    backgroundColor: container.background_color || '#FFFFFF',
    borderRadius: container.border_radius || '8px',
    padding: computedPadding,
    maxWidth: container.max_width || '600px',
    fontFamily,
    boxShadow: SOMBRA_MAP[container.sombra || 'md'] || SOMBRA_MAP.md,
    margin: '0 auto',
    border: container.border_width && parseInt(container.border_width) > 0
      ? `${container.border_width}px solid ${container.border_color || '#D1D5DB'}`
      : undefined,
  }

  const labelStyle: React.CSSProperties = {
    color: campos.label_cor || '#374151',
    fontSize: campos.label_tamanho || '14px',
    fontWeight: 500,
    display: 'block',
    marginBottom: '4px',
    fontFamily,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: campos.input_background || '#F9FAFB',
    border: `${campos.input_border_width || '1'}px solid ${campos.input_border_color || '#D1D5DB'}`,
    borderRadius: campos.input_border_radius || '6px',
    color: campos.input_texto_cor || '#1F2937',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily,
  }

  const buttonStyle: React.CSSProperties = {
    backgroundColor: botao.background_color || '#3B82F6',
    color: botao.texto_cor || '#FFFFFF',
    borderRadius: botao.border_radius || '6px',
    width: botao.largura === 'full' ? '100%' : botao.largura === '50%' ? '50%' : 'auto',
    height: botao.altura || undefined,
    padding: botao.altura ? '0 20px' : '10px 20px',
    fontSize: botao.font_size || '14px',
    fontWeight: botao.font_bold ? 700 : 600,
    fontStyle: botao.font_italic ? 'italic' : undefined,
    textDecoration: botao.font_underline ? 'underline' : undefined,
    border: 'none',
    cursor: isPreviewMode ? 'default' : 'pointer',
    fontFamily,
  }

  const getOutline = (el: SelectedElement) =>
    !isPreviewMode && selectedElement === el
      ? '2px dashed hsl(var(--primary))'
      : undefined

  const hoverStyle = !isPreviewMode
    ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-muted-foreground/40 hover:outline-offset-2 cursor-pointer'
    : ''

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPreviewMode) return
      if (e.target === e.currentTarget) {
        onSelectElement('container')
      }
    },
    [isPreviewMode, onSelectElement]
  )

  const handleCamposClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPreviewMode) return
      e.stopPropagation()
      onSelectElement('campos')
    },
    [isPreviewMode, onSelectElement]
  )

  const handleBotaoClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPreviewMode) return
      e.stopPropagation()
      onSelectElement('botao')
    },
    [isPreviewMode, onSelectElement]
  )

  // Render a single field based on its type
  const renderCampoPreview = (campo: CampoFormulario) => {
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
          <p style={{ color: campos.label_cor || '#6B7280', fontSize: '14px', margin: 0, fontFamily }}>
            {placeholder || campo.label || 'Texto descritivo'}
          </p>
        )
      case 'divisor':
        return <hr style={{ border: 'none', borderTop: `1px solid ${campos.input_border_color || '#D1D5DB'}` }} />
      case 'espacador':
        return <div style={{ height: '16px' }} />
      case 'oculto':
        return null
      case 'area_texto':
        return (
          <div>
            <span style={labelStyle}>
              {campo.label}{campo.obrigatorio ? ' *' : ''}
            </span>
            <textarea
              style={{ ...inputStyle, height: '64px', resize: 'none' }}
              placeholder={placeholder || 'Digite aqui...'}
              readOnly
            />
          </div>
        )
      case 'checkbox':
      case 'checkbox_termos':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" disabled style={{ width: '16px', height: '16px' }} />
            <span style={{ ...labelStyle, marginBottom: 0 }}>
              {campo.label}{campo.obrigatorio ? ' *' : ''}
            </span>
          </div>
        )
      case 'selecao':
      case 'selecao_multipla':
        return (
          <div>
            <span style={labelStyle}>
              {campo.label}{campo.obrigatorio ? ' *' : ''}
            </span>
            <select style={{ ...inputStyle, appearance: 'auto' }} disabled>
              <option>{placeholder || 'Selecione...'}</option>
            </select>
          </div>
        )
      case 'radio':
        return (
          <div>
            <span style={labelStyle}>
              {campo.label}{campo.obrigatorio ? ' *' : ''}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(campo.opcoes as string[] || ['Opção 1', 'Opção 2']).slice(0, 4).map((op, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: campos.input_texto_cor || '#1F2937', fontFamily }}>
                  <input type="radio" disabled name={campo.id} />
                  {typeof op === 'string' ? op : `Opção ${i + 1}`}
                </label>
              ))}
            </div>
          </div>
        )
      default:
        return (
          <div>
            <span style={labelStyle}>
              {campo.label}{campo.obrigatorio ? ' *' : ''}
            </span>
            <input style={inputStyle} placeholder={placeholder || 'Digite aqui...'} readOnly />
          </div>
        )
    }
  }

  // Determine which fields to render
  const fieldsToRender = camposReais && camposReais.length > 0 ? camposReais : null

  return (
    <div
      data-estilo-area
      style={{
        ...containerStyle,
        outline: getOutline('container'),
        outlineOffset: getOutline('container') ? '4px' : undefined,
      }}
      className={`relative ${hoverStyle} transition-all`}
      onClick={handleContainerClick}
      title={!isPreviewMode ? 'Clique para editar container' : undefined}
    >
      {/* Header */}
      {(cabecalho.logo_url || titulo) && (
        <div
          style={{
            textAlign: cabecalho.logo_posicao === 'centro' ? 'center' : 'left',
            marginBottom: '16px',
          }}
          onClick={handleContainerClick}
        >
          {cabecalho.logo_url && (
            <img
              src={cabecalho.logo_url}
              alt="Logo"
              style={{
                maxHeight: '40px',
                marginBottom: '8px',
                display: cabecalho.logo_posicao === 'centro' ? 'inline-block' : 'block',
              }}
            />
          )}
          {titulo && (
            <h3 style={{ color: cabecalho.titulo_cor || '#1F2937', fontSize: cabecalho.titulo_tamanho || '24px', fontWeight: 600, margin: 0, fontFamily }}>
              {titulo}
            </h3>
          )}
          {descricao && (
            <p style={{ color: cabecalho.descricao_cor || '#6B7280', fontSize: cabecalho.descricao_tamanho || '14px', margin: '4px 0 0', fontFamily }}>
              {descricao}
            </p>
          )}
        </div>
      )}

      {/* Fields */}
      <div
        data-estilo-area
        className={`${hoverStyle} rounded transition-all`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: campos.gap || '12px',
          padding: '4px',
          outline: getOutline('campos'),
          outlineOffset: getOutline('campos') ? '2px' : undefined,
        }}
        onClick={handleCamposClick}
        title={!isPreviewMode ? 'Clique para editar campos' : undefined}
      >
        {fieldsToRender ? (
          fieldsToRender.map((campo) => (
            <div key={campo.id}>{renderCampoPreview(campo)}</div>
          ))
        ) : (
          <>
            <div>
              <span style={labelStyle}>Nome completo</span>
              <input style={inputStyle} placeholder="Digite seu nome..." readOnly />
            </div>
            <div>
              <span style={labelStyle}>Email *</span>
              <input style={inputStyle} placeholder="seu@email.com" readOnly />
            </div>
            <div>
              <span style={labelStyle}>Telefone</span>
              <input style={inputStyle} placeholder="(00) 00000-0000" readOnly />
            </div>
          </>
        )}
      </div>

      {/* Button */}
      <div style={{ marginTop: '16px' }}>
        <button
          type="button"
          data-estilo-area
          style={{
            ...buttonStyle,
            outline: getOutline('botao'),
            outlineOffset: getOutline('botao') ? '2px' : undefined,
          }}
          className={`${hoverStyle} transition-all`}
          onClick={handleBotaoClick}
          title={!isPreviewMode ? 'Clique para editar botão' : undefined}
        >
          {botao.texto || 'Enviar'}
        </button>
      </div>
    </div>
  )
}
