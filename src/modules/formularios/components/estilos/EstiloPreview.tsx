/**
 * AIDEV-NOTE: Preview em tempo real dos estilos aplicados ao formulário
 * Renderiza um mini-formulário com os estilos configurados
 */

import type {
  EstiloContainer,
  EstiloCabecalho,
  EstiloCampos,
  EstiloBotao,
} from '../../services/formularios.api'

interface Props {
  container: EstiloContainer
  cabecalho: EstiloCabecalho
  campos: EstiloCampos
  botao: EstiloBotao
  titulo?: string
  descricao?: string
}

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

export function EstiloPreview({ container, cabecalho, campos, botao, titulo, descricao }: Props) {
  const containerStyle: React.CSSProperties = {
    backgroundColor: container.background_color || '#FFFFFF',
    borderRadius: container.border_radius || '8px',
    padding: container.padding || '24px',
    maxWidth: container.max_width || '600px',
    fontFamily: container.font_family || 'Inter, sans-serif',
    boxShadow: SOMBRA_MAP[container.sombra || 'md'] || SOMBRA_MAP.md,
    margin: '0 auto',
  }

  const labelStyle: React.CSSProperties = {
    color: campos.label_cor || '#374151',
    fontSize: campos.label_tamanho || '14px',
    fontWeight: 500,
    display: 'block',
    marginBottom: '4px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: campos.input_background || '#F9FAFB',
    border: `1px solid ${campos.input_border_color || '#D1D5DB'}`,
    borderRadius: campos.input_border_radius || '6px',
    color: campos.input_texto_cor || '#1F2937',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
  }

  const buttonStyle: React.CSSProperties = {
    backgroundColor: botao.background_color || '#3B82F6',
    color: botao.texto_cor || '#FFFFFF',
    borderRadius: botao.border_radius || '6px',
    width: botao.largura === 'full' ? '100%' : botao.largura === '50%' ? '50%' : 'auto',
    padding: TAMANHO_BOTAO[botao.tamanho || 'md'],
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  }

  return (
    <div className="bg-muted/30 rounded-lg p-4 overflow-auto">
      <p className="text-xs text-muted-foreground text-center mb-3 font-medium">Preview</p>
      <div style={containerStyle}>
        {/* Header */}
        {(cabecalho.logo_url || titulo) && (
          <div style={{ textAlign: cabecalho.logo_posicao === 'centro' ? 'center' : 'left', marginBottom: '16px' }}>
            {cabecalho.logo_url && (
              <img
                src={cabecalho.logo_url}
                alt="Logo"
                style={{ maxHeight: '40px', marginBottom: '8px', display: cabecalho.logo_posicao === 'centro' ? 'inline-block' : 'block' }}
              />
            )}
            {titulo && (
              <h3 style={{ color: cabecalho.titulo_cor || '#1F2937', fontSize: cabecalho.titulo_tamanho || '24px', fontWeight: 600, margin: 0 }}>
                {titulo}
              </h3>
            )}
            {descricao && (
              <p style={{ color: cabecalho.descricao_cor || '#6B7280', fontSize: cabecalho.descricao_tamanho || '14px', margin: '4px 0 0' }}>
                {descricao}
              </p>
            )}
          </div>
        )}

        {/* Sample Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
        </div>

        {/* Button */}
        <div style={{ marginTop: '16px' }}>
          <button type="button" style={buttonStyle}>
            {botao.texto || 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
