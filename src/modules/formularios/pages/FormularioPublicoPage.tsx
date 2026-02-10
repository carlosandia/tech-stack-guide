/**
 * AIDEV-NOTE: Página pública do formulário - rota /f/:slug
 * Acesso anônimo, busca formulário publicado, renderiza campos com máscaras,
 * captura UTMs e permite submissão
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getMaskForType } from '../utils/masks'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import DOMPurify from 'dompurify'
import type { CampoFormulario, EstiloFormulario, EstiloContainer, EstiloCampos, EstiloBotao, EstiloCabecalho } from '../services/formularios.api'

interface FormularioPublico {
  id: string
  nome: string
  slug: string
  descricao: string | null
  config_botoes: Record<string, unknown> | null
  config_pos_envio: Record<string, unknown> | null
  organizacao_id: string
}

const SOMBRA_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
}

// AIDEV-NOTE: Países com DDI para o campo telefone internacional
const PAISES_DDI = [
  { code: 'BR', ddi: '+55', flag: '🇧🇷', nome: 'Brasil' },
  { code: 'US', ddi: '+1', flag: '🇺🇸', nome: 'EUA' },
  { code: 'PT', ddi: '+351', flag: '🇵🇹', nome: 'Portugal' },
  { code: 'AR', ddi: '+54', flag: '🇦🇷', nome: 'Argentina' },
  { code: 'CL', ddi: '+56', flag: '🇨🇱', nome: 'Chile' },
  { code: 'CO', ddi: '+57', flag: '🇨🇴', nome: 'Colômbia' },
  { code: 'MX', ddi: '+52', flag: '🇲🇽', nome: 'México' },
  { code: 'UY', ddi: '+598', flag: '🇺🇾', nome: 'Uruguai' },
  { code: 'PY', ddi: '+595', flag: '🇵🇾', nome: 'Paraguai' },
  { code: 'PE', ddi: '+51', flag: '🇵🇪', nome: 'Peru' },
  { code: 'DE', ddi: '+49', flag: '🇩🇪', nome: 'Alemanha' },
  { code: 'FR', ddi: '+33', flag: '🇫🇷', nome: 'França' },
  { code: 'ES', ddi: '+34', flag: '🇪🇸', nome: 'Espanha' },
  { code: 'IT', ddi: '+39', flag: '🇮🇹', nome: 'Itália' },
  { code: 'GB', ddi: '+44', flag: '🇬🇧', nome: 'Reino Unido' },
]

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export function FormularioPublicoPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()

  const [formulario, setFormulario] = useState<FormularioPublico | null>(null)
  const [campos, setCampos] = useState<CampoFormulario[]>([])
  const [estilos, setEstilos] = useState<EstiloFormulario | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ddiSelecionado, setDdiSelecionado] = useState<Record<string, string>>({})

  // Captura UTMs
  const utms = {
    utm_source: searchParams.get('utm_source') || '',
    utm_medium: searchParams.get('utm_medium') || '',
    utm_campaign: searchParams.get('utm_campaign') || '',
    utm_term: searchParams.get('utm_term') || '',
    utm_content: searchParams.get('utm_content') || '',
  }

  useEffect(() => {
    if (!slug) return
    async function load() {
      const currentSlug = slug as string
      setLoading(true)
      const { data: form, error: formErr } = await supabase
        .from('formularios')
        .select('id, nome, slug, descricao, config_botoes, config_pos_envio, organizacao_id')
        .eq('slug', currentSlug)
        .eq('status', 'publicado')
        .is('deletado_em', null)
        .maybeSingle()

      if (formErr || !form) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setFormulario(form as FormularioPublico)

      const [camposRes, estilosRes] = await Promise.all([
        supabase
          .from('campos_formularios')
          .select('*')
          .eq('formulario_id', form.id)
          .order('ordem', { ascending: true }),
        supabase
          .from('estilos_formularios')
          .select('*')
          .eq('formulario_id', form.id)
          .maybeSingle(),
      ])

      setCampos((camposRes.data || []) as unknown as CampoFormulario[])
      setEstilos(estilosRes.data as EstiloFormulario | null)
      setLoading(false)
    }
    load()
  }, [slug])

  const handleChange = useCallback((campoId: string, tipo: string, rawValue: string) => {
    const mask = getMaskForType(tipo)
    const value = mask ? mask(rawValue) : rawValue
    setValores(prev => ({ ...prev, [campoId]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formulario) return
    setEnviando(true)
    setErro(null)

    const layoutTypes = ['titulo', 'paragrafo', 'divisor', 'espacador', 'oculto', 'bloco_html', 'imagem_link']
    const obrigatorios = campos.filter(c => c.obrigatorio && !layoutTypes.includes(c.tipo))
    for (const campo of obrigatorios) {
      if (!valores[campo.id]?.trim()) {
        setErro(`O campo "${campo.label}" é obrigatório`)
        setEnviando(false)
        return
      }
    }

    const dadosCampos: Record<string, string> = {}
    campos.forEach(c => {
      if (valores[c.id] !== undefined) {
        const key = c.nome || c.id
        // Para telefone internacional, inclui o DDI
        if (c.tipo === 'telefone' && ddiSelecionado[c.id]) {
          dadosCampos[key] = `${ddiSelecionado[c.id]} ${valores[c.id]}`
        } else {
          dadosCampos[key] = valores[c.id]
        }
      }
    })

    const { error } = await supabase
      .from('submissoes_formularios')
      .insert({
        formulario_id: formulario.id,
        organizacao_id: formulario.organizacao_id,
        dados: dadosCampos,
        utm_source: utms.utm_source || null,
        utm_medium: utms.utm_medium || null,
        utm_campaign: utms.utm_campaign || null,
        ip_address: null,
        user_agent: navigator.userAgent,
      })

    setEnviando(false)
    if (error) {
      setErro('Erro ao enviar formulário. Tente novamente.')
      return
    }

    setEnviado(true)

    const posEnvio = formulario.config_pos_envio as any
    if (posEnvio?.tipo_acao_sucesso === 'redirecionar' || posEnvio?.tipo_acao_sucesso === 'ambos') {
      const url = posEnvio?.url_redirecionamento
      const tempo = (posEnvio?.tempo_redirecionamento || 3) * 1000
      if (url) {
        setTimeout(() => { window.location.href = url }, tempo)
      }
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
        <p style={{ color: '#6B7280' }}>Carregando...</p>
      </div>
    )
  }

  if (notFound || !formulario) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1F2937' }}>Formulário não encontrado</h1>
          <p style={{ color: '#6B7280', marginTop: '8px' }}>Este formulário pode ter sido removido ou não está publicado.</p>
        </div>
      </div>
    )
  }

  const container = (estilos?.container || {}) as EstiloContainer
  const camposEstilo = (estilos?.campos || {}) as EstiloCampos
  const botao = (estilos?.botao || {}) as EstiloBotao
  const cabecalho = (estilos?.cabecalho || {}) as EstiloCabecalho
  const pagina = estilos?.pagina as any || {}
  const configBotoes = formulario.config_botoes as any || {}
  const posEnvio = formulario.config_pos_envio as any || {}
  const fontFamily = container.font_family ? `${container.font_family}, 'Inter', system-ui, sans-serif` : "'Inter', system-ui, sans-serif"

  const mensagemSucesso = posEnvio.mensagem_sucesso || 'Formulário enviado com sucesso!'

  if (enviado) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: pagina.background_color || '#F3F4F6', fontFamily }}>
        <div style={{
          backgroundColor: container.background_color || '#FFFFFF',
          borderRadius: container.border_radius || '8px',
          padding: container.padding || '24px',
          maxWidth: container.max_width || '600px',
          width: '100%',
          margin: '16px',
          boxShadow: SOMBRA_MAP[container.sombra || 'md'],
          textAlign: 'center' as const,
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>Enviado!</h2>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>{mensagemSucesso}</p>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: camposEstilo.input_background || '#F9FAFB',
    border: `1px solid ${camposEstilo.input_border_color || '#D1D5DB'}`,
    borderRadius: camposEstilo.input_border_radius || '6px',
    color: camposEstilo.input_texto_cor || '#1F2937',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily,
    boxSizing: 'border-box' as const,
  }

  const labelStyle: React.CSSProperties = {
    color: camposEstilo.label_cor || '#374151',
    fontSize: camposEstilo.label_tamanho || '14px',
    fontWeight: 500,
    display: 'block',
    marginBottom: '4px',
    fontFamily,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: pagina.background_color || '#F3F4F6', padding: '16px' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: container.background_color || '#FFFFFF',
          borderRadius: container.border_radius || '8px',
          padding: container.padding || '24px',
          maxWidth: container.max_width || '600px',
          width: '100%',
          boxShadow: SOMBRA_MAP[container.sombra || 'md'],
          fontFamily,
        }}
      >
        {/* Cabeçalho */}
        <div style={{ marginBottom: '24px', textAlign: 'center' as const }}>
          {cabecalho.logo_url && (
            <img src={cabecalho.logo_url} alt="Logo" style={{ maxHeight: '40px', marginBottom: '8px', display: 'inline-block' }} />
          )}
          <h2 style={{ fontSize: cabecalho.titulo_tamanho || '24px', fontWeight: 600, color: cabecalho.titulo_cor || '#1F2937', fontFamily }}>{formulario.nome}</h2>
          {formulario.descricao && (
            <p style={{ color: cabecalho.descricao_cor || '#6B7280', fontSize: cabecalho.descricao_tamanho || '14px', marginTop: '4px', fontFamily }}>{formulario.descricao}</p>
          )}
        </div>

        {/* Campos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 0' }}>
          {campos.map(campo => {
            const larguraMap: Record<string, string> = { full: '100%', '1/2': '50%', '1/3': '33.33%', '2/3': '66.66%', half: '50%', third: '33.33%' }
            const w = larguraMap[campo.largura] || '100%'
            return (
              <div key={campo.id} style={{ width: w, paddingRight: w !== '100%' ? '8px' : undefined, boxSizing: 'border-box' as const }}>
                {renderCampoPublico({
                  campo, labelStyle, inputStyle, fontFamily, camposEstilo,
                  valor: valores[campo.id] || '',
                  onChange: (v) => handleChange(campo.id, campo.tipo, v),
                  ddi: ddiSelecionado[campo.id] || '+55',
                  onDdiChange: (ddi) => setDdiSelecionado(prev => ({ ...prev, [campo.id]: ddi })),
                })}
              </div>
            )
          })}
        </div>

        {/* Erro */}
        {erro && (
          <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px', marginTop: '8px' }}>{erro}</p>
        )}

        {/* Botões */}
        <div style={{ marginTop: '16px' }}>
          {renderBotoesPublico(configBotoes, botao, enviando, valores, campos, fontFamily)}
        </div>
      </form>
    </div>
  )
}

// =====================================================
// Renderização de cada tipo de campo
// =====================================================

interface RenderCampoProps {
  campo: CampoFormulario
  labelStyle: React.CSSProperties
  inputStyle: React.CSSProperties
  fontFamily: string
  camposEstilo: EstiloCampos
  valor: string
  onChange: (v: string) => void
  ddi: string
  onDdiChange: (ddi: string) => void
}

function renderCampoPublico(props: RenderCampoProps) {
  const { campo, labelStyle, inputStyle, fontFamily, camposEstilo, valor, onChange, ddi, onDdiChange } = props
  const placeholder = campo.placeholder || ''

  const renderLabel = () => (
    <span style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
      {campo.label}{campo.obrigatorio ? <span style={{ color: '#EF4444' }}> *</span> : ''}
      {campo.texto_ajuda && (
        <span title={campo.texto_ajuda} style={{ cursor: 'help', color: '#9CA3AF', fontSize: '12px' }}>ⓘ</span>
      )}
    </span>
  )

  switch (campo.tipo) {
    // ========== LAYOUT ==========
    case 'titulo':
      return <h3 style={{ ...labelStyle, fontSize: '18px', fontWeight: 600, marginBottom: 0 }}>{placeholder || campo.label}</h3>
    case 'paragrafo':
      return <p style={{ color: camposEstilo.label_cor || '#6B7280', fontSize: '14px', margin: 0, fontFamily }}>{placeholder || campo.label}</p>
    case 'divisor':
      return <hr style={{ border: 'none', borderTop: `1px solid ${camposEstilo.input_border_color || '#D1D5DB'}` }} />
    case 'espacador':
      return <div style={{ height: '16px' }} />
    case 'oculto':
      return null
    case 'bloco_html':
      return <div style={{ fontSize: '14px', fontFamily }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(campo.valor_padrao || '') }} />
    case 'imagem_link': {
      const imgUrl = campo.valor_padrao || ''
      const linkUrl = campo.placeholder || ''
      if (!imgUrl) return null
      const img = <img src={imgUrl} alt={campo.label} style={{ width: '100%', borderRadius: '8px', display: 'block' }} />
      return linkUrl ? <a href={linkUrl} target="_blank" rel="noopener noreferrer">{img}</a> : img
    }

    // ========== TEXT INPUTS ==========
    case 'texto':
    case 'texto_longo':
      return (
        <div>
          {renderLabel()}
          {campo.tipo === 'texto_longo' ? (
            <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder={placeholder || 'Digite aqui...'} value={valor} onChange={e => onChange(e.target.value)} />
          ) : (
            <input style={inputStyle} placeholder={placeholder || 'Digite aqui...'} value={valor} onChange={e => onChange(e.target.value)} />
          )}
        </div>
      )
    case 'area_texto':
      return <div>{renderLabel()}<textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder={placeholder || 'Digite aqui...'} value={valor} onChange={e => onChange(e.target.value)} /></div>

    // ========== EMAIL ==========
    case 'email':
      return <div>{renderLabel()}<input type="email" style={inputStyle} placeholder={placeholder || 'email@exemplo.com'} value={valor} onChange={e => onChange(e.target.value)} /></div>

    // ========== TELEFONE BR com máscara ==========
    case 'telefone_br':
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <span style={{
              ...inputStyle,
              width: 'auto',
              borderRight: 'none',
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 10px',
              backgroundColor: '#F3F4F6',
              color: '#6B7280',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              🇧🇷 +55
            </span>
            <input
              style={{ ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              placeholder={placeholder || '(00) 00000-0000'}
              value={valor}
              onChange={e => onChange(e.target.value)}
            />
          </div>
        </div>
      )

    // ========== TELEFONE INTERNACIONAL com seletor de DDI ==========
    case 'telefone':
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <select
              style={{
                ...inputStyle,
                width: 'auto',
                minWidth: '90px',
                borderRight: 'none',
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                backgroundColor: '#F3F4F6',
                padding: '8px 6px',
                appearance: 'auto',
                flexShrink: 0,
              }}
              value={ddi}
              onChange={e => onDdiChange(e.target.value)}
            >
              {PAISES_DDI.map(p => (
                <option key={p.code} value={p.ddi}>{p.flag} {p.ddi}</option>
              ))}
            </select>
            <input
              style={{ ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              placeholder={placeholder || 'Digite aqui...'}
              value={valor}
              onChange={e => onChange(e.target.value)}
            />
          </div>
        </div>
      )

    // ========== MASKED FIELDS ==========
    case 'cpf':
      return <div>{renderLabel()}<input style={inputStyle} placeholder={placeholder || '000.000.000-00'} value={valor} onChange={e => onChange(e.target.value)} maxLength={14} /></div>
    case 'cnpj':
      return <div>{renderLabel()}<input style={inputStyle} placeholder={placeholder || '00.000.000/0000-00'} value={valor} onChange={e => onChange(e.target.value)} maxLength={18} /></div>
    case 'cep':
      return <div>{renderLabel()}<input style={inputStyle} placeholder={placeholder || '00000-000'} value={valor} onChange={e => onChange(e.target.value)} maxLength={9} /></div>
    case 'moeda':
      return <div>{renderLabel()}<input style={inputStyle} placeholder={placeholder || 'R$ 0,00'} value={valor} onChange={e => onChange(e.target.value)} /></div>

    // ========== NUMBER / URL ==========
    case 'numero':
      return <div>{renderLabel()}<input type="number" style={inputStyle} placeholder={placeholder || '0'} value={valor} onChange={e => onChange(e.target.value)} /></div>
    case 'url':
      return <div>{renderLabel()}<input type="url" style={inputStyle} placeholder={placeholder || 'https://'} value={valor} onChange={e => onChange(e.target.value)} /></div>

    // ========== DATE / TIME ==========
    case 'data':
      return <div>{renderLabel()}<input type="date" style={inputStyle} value={valor} onChange={e => onChange(e.target.value)} /></div>
    case 'data_hora':
      return <div>{renderLabel()}<input type="datetime-local" style={inputStyle} value={valor} onChange={e => onChange(e.target.value)} /></div>
    case 'hora':
      return <div>{renderLabel()}<input type="time" style={inputStyle} value={valor} onChange={e => onChange(e.target.value)} /></div>

    // ========== CHECKBOX / TERMOS ==========
    case 'checkbox':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#3B82F6' }} onChange={e => onChange(e.target.checked ? 'sim' : '')} />
          <span style={{ ...labelStyle, marginBottom: 0 }}>{campo.label}{campo.obrigatorio ? <span style={{ color: '#EF4444' }}> *</span> : ''}</span>
        </div>
      )
    case 'checkbox_termos':
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <input type="checkbox" style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#3B82F6' }} onChange={e => onChange(e.target.checked ? 'sim' : '')} />
          <span style={{ ...labelStyle, marginBottom: 0, fontSize: '13px' }}>
            {campo.label}{campo.obrigatorio ? <span style={{ color: '#EF4444' }}> *</span> : ''}
            {campo.valor_padrao && (
              <button type="button" onClick={() => alert(campo.valor_padrao)} style={{ color: '#3B82F6', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', marginLeft: '4px', fontFamily }}>
                Ver termos
              </button>
            )}
          </span>
        </div>
      )

    // ========== SELECT ==========
    case 'selecao':
    case 'selecao_multipla':
      return (
        <div>
          {renderLabel()}
          <select style={{ ...inputStyle, appearance: 'auto' }} value={valor} onChange={e => onChange(e.target.value)} multiple={campo.tipo === 'selecao_multipla'}>
            <option value="">{placeholder || 'Selecione...'}</option>
            {(campo.opcoes as string[] || []).map((op, i) => <option key={i} value={op}>{typeof op === 'string' ? op : `Opção ${i + 1}`}</option>)}
          </select>
        </div>
      )

    // ========== RADIO ==========
    case 'radio':
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            {(campo.opcoes as string[] || []).map((op, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', fontFamily }}>
                <input type="radio" name={campo.id} value={op} checked={valor === op} onChange={() => onChange(typeof op === 'string' ? op : `Opção ${i + 1}`)} style={{ accentColor: '#3B82F6' }} />
                {typeof op === 'string' ? op : `Opção ${i + 1}`}
              </label>
            ))}
          </div>
        </div>
      )

    // ========== ENDEREÇO FIELDS ==========
    case 'endereco':
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input style={inputStyle} placeholder="Logradouro" value={valor} onChange={e => onChange(e.target.value)} />
          </div>
        </div>
      )
    case 'pais':
      return (
        <div>
          {renderLabel()}
          <select style={{ ...inputStyle, appearance: 'auto' }} value={valor} onChange={e => onChange(e.target.value)}>
            <option value="">Selecione o país...</option>
            {PAISES_DDI.map(p => <option key={p.code} value={p.nome}>{p.flag} {p.nome}</option>)}
          </select>
        </div>
      )
    case 'estado':
      return (
        <div>
          {renderLabel()}
          <select style={{ ...inputStyle, appearance: 'auto' }} value={valor} onChange={e => onChange(e.target.value)}>
            <option value="">Selecione o estado...</option>
            {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
      )
    case 'cidade':
      return <div>{renderLabel()}<input style={inputStyle} placeholder={placeholder || 'Nome da cidade'} value={valor} onChange={e => onChange(e.target.value)} /></div>

    // ========== AVALIAÇÃO (Estrelas) ==========
    case 'avaliacao': {
      const rating = parseInt(valor || '0', 10)
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(String(star))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '28px',
                  color: star <= rating ? '#FBBF24' : '#D1D5DB',
                  padding: '2px',
                  lineHeight: 1,
                  transition: 'color 0.15s',
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )
    }

    // ========== NPS (0-10) ==========
    case 'nps': {
      const npsVal = valor ? parseInt(valor, 10) : -1
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
            {Array.from({ length: 11 }, (_, i) => i).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(String(n))}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: npsVal === n ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                  backgroundColor: npsVal === n
                    ? (n <= 6 ? '#FEE2E2' : n <= 8 ? '#FEF3C7' : '#DCFCE7')
                    : '#FFFFFF',
                  color: npsVal === n ? '#1F2937' : '#6B7280',
                  fontWeight: npsVal === n ? 700 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#9CA3AF' }}>
            <span>Nada provável</span>
            <span>Muito provável</span>
          </div>
        </div>
      )
    }

    // ========== SLIDER ==========
    case 'slider': {
      const sliderVal = valor || '50'
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderVal}
              onChange={e => onChange(e.target.value)}
              style={{ flex: 1, accentColor: '#3B82F6' }}
            />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', minWidth: '32px', textAlign: 'right' }}>{sliderVal}</span>
          </div>
        </div>
      )
    }

    // ========== RANKING ==========
    case 'ranking': {
      const opcoes = (campo.opcoes as string[] || [])
      const ranked = valor ? valor.split('|') : opcoes
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
            {ranked.map((op, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', border: `1px solid ${camposEstilo.input_border_color || '#D1D5DB'}`,
                borderRadius: '6px', backgroundColor: '#F9FAFB', fontSize: '14px', fontFamily,
              }}>
                <span style={{ color: '#9CA3AF', fontWeight: 600, fontSize: '12px' }}>{i + 1}.</span>
                {typeof op === 'string' ? op : `Item ${i + 1}`}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>Arraste para reordenar (em breve)</p>
        </div>
      )
    }

    // ========== UPLOAD FIELDS ==========
    case 'upload_imagem':
    case 'upload_video':
    case 'upload_audio':
    case 'anexo_arquivo':
    case 'documento': {
      const typeMap: Record<string, string> = {
        upload_imagem: 'image/*',
        upload_video: 'video/*',
        upload_audio: 'audio/*',
        anexo_arquivo: '*/*',
        documento: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
      }
      const labelMap: Record<string, string> = {
        upload_imagem: 'Selecionar imagem',
        upload_video: 'Selecionar vídeo',
        upload_audio: 'Selecionar áudio',
        anexo_arquivo: 'Selecionar arquivo',
        documento: 'Selecionar documento',
      }
      return (
        <div>
          {renderLabel()}
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', border: `2px dashed ${camposEstilo.input_border_color || '#D1D5DB'}`,
            borderRadius: '8px', cursor: 'pointer', backgroundColor: '#FAFAFA',
            fontSize: '14px', color: '#6B7280', fontFamily,
            transition: 'border-color 0.2s',
          }}>
            📎 {valor ? valor.split('/').pop() : (labelMap[campo.tipo] || 'Selecionar arquivo')}
            <input type="file" accept={typeMap[campo.tipo] || '*/*'} style={{ display: 'none' }} onChange={e => {
              const file = e.target.files?.[0]
              if (file) onChange(file.name)
            }} />
          </label>
        </div>
      )
    }

    // ========== ASSINATURA ==========
    case 'assinatura':
      return (
        <div>
          {renderLabel()}
          <div style={{
            border: `1px solid ${camposEstilo.input_border_color || '#D1D5DB'}`,
            borderRadius: '8px',
            height: '120px',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            fontSize: '13px',
            fontFamily,
          }}>
            ✍️ Clique para assinar
          </div>
        </div>
      )

    // ========== SELETOR DE COR ==========
    case 'seletor_cor':
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="color" value={valor || '#3B82F6'} onChange={e => onChange(e.target.value)} style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
            <input style={{ ...inputStyle, flex: 1 }} value={valor || '#3B82F6'} onChange={e => onChange(e.target.value)} placeholder="#000000" />
          </div>
        </div>
      )

    // ========== CAMPO OCULTO (BUSCA) ==========
    case 'campo_oculto':
      return null

    // ========== DEFAULT (fallback) ==========
    default:
      return (
        <div>
          {renderLabel()}
          <input
            style={inputStyle}
            placeholder={placeholder || 'Digite aqui...'}
            value={valor}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )
  }
}

// =====================================================
// Renderização dos botões com todos os estilos
// =====================================================

function renderBotoesPublico(
  configBotoes: any,
  estiloBotao: EstiloBotao,
  enviando: boolean,
  valores: Record<string, string>,
  campos: CampoFormulario[],
  fontFamily: string,
) {
  const tipoBotao = configBotoes?.tipo_botao || 'enviar'
  const showEnviar = tipoBotao === 'enviar' || tipoBotao === 'ambos'
  const showWhatsApp = tipoBotao === 'whatsapp' || tipoBotao === 'ambos'

  const resolveLargura = (l?: string) => {
    if (!l || l === 'full') return '100%'
    if (l === '50%') return '50%'
    if (l === 'auto') return 'auto'
    return l
  }

  const btnEnviarStyle: React.CSSProperties = {
    backgroundColor: estiloBotao.background_color || '#3B82F6',
    color: estiloBotao.texto_cor || '#FFFFFF',
    borderRadius: estiloBotao.border_radius || '6px',
    width: tipoBotao === 'ambos' ? '100%' : resolveLargura(estiloBotao.largura),
    height: estiloBotao.altura || undefined,
    padding: estiloBotao.padding || (estiloBotao.altura ? '0 20px' : '10px 20px'),
    margin: estiloBotao.margin || undefined,
    fontSize: estiloBotao.font_size || '14px',
    fontWeight: estiloBotao.font_weight ? Number(estiloBotao.font_weight) : (estiloBotao.font_bold ? 700 : 600),
    fontStyle: estiloBotao.font_italic ? 'italic' : undefined,
    textDecoration: estiloBotao.font_underline ? 'underline' : undefined,
    border: estiloBotao.border_width
      ? `${estiloBotao.border_width} ${estiloBotao.border_style || 'solid'} ${estiloBotao.border_color || 'transparent'}`
      : 'none',
    cursor: enviando ? 'not-allowed' : 'pointer',
    opacity: enviando ? 0.7 : 1,
    fontFamily,
    transition: 'opacity 0.2s, background-color 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const btnWhatsAppStyle: React.CSSProperties = {
    backgroundColor: estiloBotao.whatsapp_background || '#25D366',
    color: estiloBotao.whatsapp_texto_cor || '#FFFFFF',
    borderRadius: estiloBotao.whatsapp_border_radius || '6px',
    width: tipoBotao === 'ambos' ? '100%' : resolveLargura(estiloBotao.whatsapp_largura),
    height: estiloBotao.whatsapp_altura || undefined,
    padding: estiloBotao.whatsapp_padding || (estiloBotao.whatsapp_altura ? '0 20px' : '10px 20px'),
    margin: estiloBotao.whatsapp_margin || undefined,
    fontSize: estiloBotao.whatsapp_font_size || '14px',
    fontWeight: estiloBotao.whatsapp_font_weight ? Number(estiloBotao.whatsapp_font_weight) : (estiloBotao.whatsapp_font_bold ? 700 : 600),
    fontStyle: estiloBotao.whatsapp_font_italic ? 'italic' : undefined,
    textDecoration: estiloBotao.whatsapp_font_underline ? 'underline' : undefined,
    border: estiloBotao.whatsapp_border_width
      ? `${estiloBotao.whatsapp_border_width} ${estiloBotao.whatsapp_border_style || 'solid'} ${estiloBotao.whatsapp_border_color || 'transparent'}`
      : 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily,
    transition: 'opacity 0.2s, background-color 0.2s',
  }

  const handleWhatsApp = () => {
    const numero = configBotoes?.whatsapp_numero || ''
    let msg = configBotoes?.whatsapp_mensagem_template || ''
    if (!msg) {
      const lines = campos.filter(c => valores[c.id]).map(c => `*${c.label}:* ${valores[c.id]}`)
      msg = lines.join('\n')
    } else {
      campos.forEach(c => {
        msg = msg.replace(new RegExp(`{{${c.nome}}}`, 'g'), valores[c.id] || '')
      })
    }
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const enviarBtn = showEnviar ? (
    <button type="submit" style={btnEnviarStyle} disabled={enviando}>
      {enviando ? 'Enviando...' : (estiloBotao.texto || 'Enviar')}
    </button>
  ) : null

  const whatsAppBtn = showWhatsApp ? (
    <button type="button" style={btnWhatsAppStyle} onClick={handleWhatsApp}>
      <WhatsAppIcon size={16} />
      {estiloBotao.whatsapp_texto || 'Enviar via WhatsApp'}
    </button>
  ) : null

  if (tipoBotao === 'ambos') {
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>{enviarBtn}</div>
        <div style={{ flex: 1 }}>{whatsAppBtn}</div>
      </div>
    )
  }

  return enviarBtn || whatsAppBtn
}
