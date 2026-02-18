/**
 * AIDEV-NOTE: Funções compartilhadas de renderização final de campos
 * Extraído de FormPreview.tsx para uso tanto no editor (CampoItem) quanto no preview final
 */

import { useState } from 'react'
import { Info } from 'lucide-react'
import { mergeCampoEstilo, ensureUnit } from './campoEstiloUtils'
import { TermosModal } from '../components/campos/TermosModal'
import type { CampoFormulario, EstiloCampos } from '../services/formularios.api'

export function parseLayoutConfig(valorPadrao: string | null | undefined, tipo: string): Record<string, string> {
  if (tipo === 'titulo' || tipo === 'paragrafo') {
    const defaults = { alinhamento: 'left', cor: '#374151', tamanho: tipo === 'titulo' ? '18' : '14' }
    if (!valorPadrao) return defaults
    try { const p = JSON.parse(valorPadrao); return { alinhamento: p.alinhamento || defaults.alinhamento, cor: p.cor || defaults.cor, tamanho: p.tamanho || defaults.tamanho } } catch { return defaults }
  }
  if (tipo === 'divisor') {
    const defaults = { cor: '#D1D5DB', espessura: '1', estilo: 'solid' }
    if (!valorPadrao) return defaults
    try { const p = JSON.parse(valorPadrao); return { cor: p.cor || defaults.cor, espessura: p.espessura || defaults.espessura, estilo: p.estilo || defaults.estilo } } catch { return defaults }
  }
  if (tipo === 'espacador') {
    const defaults = { altura: '16' }
    if (!valorPadrao) return defaults
    try { const p = JSON.parse(valorPadrao); return { altura: p.altura || defaults.altura } } catch { return defaults }
  }
  return {}
}

export const PAISES_COMUNS = [
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

/** Helper: renders label with optional info icon tooltip */
export function renderLabel(
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

/** Input de telefone com seletor de país/DDI */
export function PhoneInputWithCountry({
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
      {aberto && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 50,
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
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

/**
 * AIDEV-NOTE: Calcula os estilos base (label e input) a partir do estiloCampos merged
 */
export function computeFieldStyles(campo: CampoFormulario, estiloCampos: EstiloCampos | undefined, fontFamily: string) {
  const merged = estiloCampos ? mergeCampoEstilo(estiloCampos, campo) : undefined
  const labelStyle: React.CSSProperties = {
    color: merged?.label_cor || '#374151',
    fontSize: ensureUnit(merged?.label_tamanho, '0.875rem', 'fontSize'),
    fontWeight: (merged?.label_font_weight || '500') as any,
    display: 'block',
    marginBottom: '4px',
    fontFamily,
  }

  const borderWidth = merged?.input_border_width || '1'
  const borderStyle = merged?.input_border_style || 'solid'
  const borderColor = merged?.input_border_color || '#D1D5DB'

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: merged?.input_background || '#F9FAFB',
    border: `${borderWidth}px ${borderStyle} ${borderColor}`,
    borderRadius: ensureUnit(merged?.input_border_radius, '6px', 'borderRadius'),
    color: merged?.input_texto_cor || '#1F2937',
    padding: '8px 12px',
    fontSize: '14px',
    height: ensureUnit(merged?.input_height, '2.5rem', 'height'),
    outline: 'none',
    fontFamily,
  }

  return { merged, labelStyle, inputStyle }
}

export function renderFinalCampo(
  campo: CampoFormulario,
  estiloCampos: EstiloCampos | undefined,
  fontFamily: string,
  valor: string = '',
  onChange?: (v: string) => void,
  paisSelecionado?: { code: string; ddi: string; flag: string },
  onPaisChange?: (p: { code: string; ddi: string; flag: string }) => void,
) {
  const { labelStyle, inputStyle } = computeFieldStyles(campo, estiloCampos, fontFamily)
  const placeholder = campo.placeholder || ''

  const larguraMap: Record<string, string> = { full: '100%', half: '50%', third: '33.33%' }
  const wrapperStyle: React.CSSProperties = {
    width: larguraMap[campo.largura] || '100%',
    display: 'inline-block',
    verticalAlign: 'top',
    paddingRight: campo.largura !== 'full' ? '8px' : undefined,
    boxSizing: 'border-box' as const,
  }

  const campoOverrides = ((campo.validacoes || {}) as Record<string, unknown>).estilo_campo as Partial<EstiloCampos> | undefined

  switch (campo.tipo) {
    case 'titulo': {
      const tc = parseLayoutConfig(campo.valor_padrao, 'titulo')
      const tituloFontSize = campoOverrides?.label_tamanho
        ? ensureUnit(campoOverrides.label_tamanho, `${tc.tamanho}px`, 'fontSize')
        : `${tc.tamanho}px`
      const tituloColor = campoOverrides?.label_cor || tc.cor
      const tituloWeight = campoOverrides?.label_font_weight || '600'
      return (
        <h3 style={{ ...labelStyle, fontSize: tituloFontSize, fontWeight: tituloWeight as any, marginBottom: 0, textAlign: tc.alinhamento as any, color: tituloColor }}>
          {placeholder || campo.label || 'Título da seção'}
        </h3>
      )
    }
    case 'paragrafo': {
      const pc = parseLayoutConfig(campo.valor_padrao, 'paragrafo')
      const paraFontSize = campoOverrides?.label_tamanho
        ? ensureUnit(campoOverrides.label_tamanho, `${pc.tamanho}px`, 'fontSize')
        : `${pc.tamanho}px`
      const paraColor = campoOverrides?.label_cor || pc.cor
      return (
        <p style={{ fontSize: paraFontSize, margin: 0, fontFamily, textAlign: pc.alinhamento as any, color: paraColor }}>
          {placeholder || campo.label || 'Texto descritivo'}
        </p>
      )
    }
    case 'divisor': {
      const dc = parseLayoutConfig(campo.valor_padrao, 'divisor')
      return <hr style={{ border: 'none', borderTop: `${dc.espessura}px ${dc.estilo} ${dc.cor}` }} />
    }
    case 'espacador': {
      const ec = parseLayoutConfig(campo.valor_padrao, 'espacador')
      return <div style={{ height: `${ec.altura}px` }} />
    }
    case 'oculto':
      return null
    case 'bloco_html':
      return (
        <div
          style={{ fontSize: '14px', fontFamily }}
          dangerouslySetInnerHTML={{ __html: campo.valor_padrao || '<p>Bloco HTML</p>' }}
        />
      )
    case 'imagem_link': {
      let imgSrc = ''
      let linkUrl = ''
      try {
        const parsed = JSON.parse(campo.valor_padrao || '{}')
        imgSrc = parsed.url_desktop || parsed.url_tablet || parsed.url_mobile || ''
        linkUrl = parsed.redirect_url || ''
      } catch {
        imgSrc = campo.valor_padrao || ''
        linkUrl = campo.placeholder || ''
      }
      const imgElement = imgSrc ? (
        <img src={imgSrc} alt={campo.label || 'Imagem'} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: estiloCampos?.input_border_radius || '6px', cursor: linkUrl ? 'pointer' : 'default' }} />
      ) : (
        <div style={{ ...inputStyle, padding: '24px', textAlign: 'center' as const, color: estiloCampos?.input_texto_cor || '#9CA3AF', borderStyle: 'dashed', cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🖼️</span>
          <span style={{ fontSize: '13px' }}>Insira a URL da imagem nas configurações</span>
        </div>
      )
      if (linkUrl && imgSrc) {
        return <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>{imgElement}</a>
      }
      return imgElement
    }
  }

  // Campos de input
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
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder={placeholder || 'Rua / Logradouro'} value={valor} onChange={handleInput} />
              <input style={{ ...inputStyle, flex: 0, width: '80px', minWidth: '70px' }} placeholder="Nº" />
            </div>
            <input style={inputStyle} placeholder="Complemento" />
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
