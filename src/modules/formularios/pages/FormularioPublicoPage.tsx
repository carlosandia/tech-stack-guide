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
      // Busca formulário por slug (anon policy)
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

      // Buscar campos e estilos em paralelo
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

    // Validar campos obrigatórios
    const obrigatorios = campos.filter(c => c.obrigatorio && !['titulo', 'paragrafo', 'divisor', 'espacador', 'oculto', 'bloco_html'].includes(c.tipo))
    for (const campo of obrigatorios) {
      if (!valores[campo.id]?.trim()) {
        setErro(`O campo "${campo.label}" é obrigatório`)
        setEnviando(false)
        return
      }
    }

    // Montar dados
    const dadosCampos: Record<string, string> = {}
    campos.forEach(c => {
      if (valores[c.id] !== undefined) {
        dadosCampos[c.nome || c.id] = valores[c.id]
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

    // Pós-envio: redirecionamento
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
        <div style={{ fontSize: 0 }}>
          {campos.map(campo => (
            <div key={campo.id} style={{ fontSize: '14px', marginBottom: '12px' }}>
              {renderCampoPublico(campo, labelStyle, inputStyle, fontFamily, camposEstilo, valores[campo.id] || '', (v) => handleChange(campo.id, campo.tipo, v))}
            </div>
          ))}
        </div>

        {/* Erro */}
        {erro && (
          <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>{erro}</p>
        )}

        {/* Botões */}
        <div style={{ marginTop: '16px' }}>
          {renderBotoesPublico(configBotoes, botao, enviando, valores, campos)}
        </div>
      </form>
    </div>
  )
}

function renderCampoPublico(
  campo: CampoFormulario,
  labelStyle: React.CSSProperties,
  inputStyle: React.CSSProperties,
  fontFamily: string,
  camposEstilo: EstiloCampos,
  valor: string,
  onChange: (v: string) => void,
) {
  const larguraMap: Record<string, string> = { full: '100%', half: '50%', third: '33.33%' }
  const wrapperStyle: React.CSSProperties = {
    width: larguraMap[campo.largura] || '100%',
    display: 'inline-block',
    verticalAlign: 'top',
    paddingRight: campo.largura !== 'full' ? '8px' : undefined,
    boxSizing: 'border-box' as const,
  }

  const renderLabel = () => (
    <span style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
      {campo.label}{campo.obrigatorio ? <span style={{ color: '#EF4444' }}> *</span> : ''}
    </span>
  )

  const placeholder = campo.placeholder || ''

  switch (campo.tipo) {
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
    case 'area_texto':
      return <div style={wrapperStyle}>{renderLabel()}<textarea style={{ ...inputStyle, height: '64px', resize: 'vertical' }} placeholder={placeholder} value={valor} onChange={e => onChange(e.target.value)} /></div>
    case 'checkbox':
    case 'checkbox_termos':
      return (
        <div style={{ ...wrapperStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" style={{ width: '16px', height: '16px' }} onChange={e => onChange(e.target.checked ? 'sim' : '')} />
          <span style={{ ...labelStyle, marginBottom: 0 }}>{campo.label}{campo.obrigatorio ? <span style={{ color: '#EF4444' }}> *</span> : ''}</span>
        </div>
      )
    case 'selecao':
    case 'selecao_multipla':
    case 'pais':
    case 'estado':
    case 'cidade':
      return (
        <div style={wrapperStyle}>
          {renderLabel()}
          <select style={{ ...inputStyle, appearance: 'auto' }} value={valor} onChange={e => onChange(e.target.value)}>
            <option value="">{placeholder || 'Selecione...'}</option>
            {(campo.opcoes as string[] || []).map((op, i) => <option key={i} value={op}>{typeof op === 'string' ? op : `Opção ${i + 1}`}</option>)}
          </select>
        </div>
      )
    case 'radio':
      return (
        <div style={wrapperStyle}>
          {renderLabel()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(campo.opcoes as string[] || []).map((op, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer', fontFamily }}>
                <input type="radio" name={campo.id} value={op} checked={valor === op} onChange={() => onChange(typeof op === 'string' ? op : `Opção ${i + 1}`)} />
                {typeof op === 'string' ? op : `Opção ${i + 1}`}
              </label>
            ))}
          </div>
        </div>
      )
    case 'data':
      return <div style={wrapperStyle}>{renderLabel()}<input type="date" style={inputStyle} value={valor} onChange={e => onChange(e.target.value)} /></div>
    case 'data_hora':
      return <div style={wrapperStyle}>{renderLabel()}<input type="datetime-local" style={inputStyle} value={valor} onChange={e => onChange(e.target.value)} /></div>
    case 'hora':
      return <div style={wrapperStyle}>{renderLabel()}<input type="time" style={inputStyle} value={valor} onChange={e => onChange(e.target.value)} /></div>
    case 'numero':
      return <div style={wrapperStyle}>{renderLabel()}<input type="number" style={inputStyle} placeholder={placeholder || '0'} value={valor} onChange={e => onChange(e.target.value)} /></div>
    case 'url':
      return <div style={wrapperStyle}>{renderLabel()}<input type="url" style={inputStyle} placeholder={placeholder || 'https://'} value={valor} onChange={e => onChange(e.target.value)} /></div>
    case 'email':
      return <div style={wrapperStyle}>{renderLabel()}<input type="email" style={inputStyle} placeholder={placeholder || 'email@exemplo.com'} value={valor} onChange={e => onChange(e.target.value)} /></div>
    default:
      // Tipos com máscara (cpf, cnpj, cep, telefone, moeda) ou texto genérico
      return (
        <div style={wrapperStyle}>
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

function renderBotoesPublico(
  configBotoes: any,
  estiloBotao: EstiloBotao,
  enviando: boolean,
  valores: Record<string, string>,
  campos: CampoFormulario[],
) {
  const tipoBotao = configBotoes?.tipo_botao || 'enviar'
  const showEnviar = tipoBotao === 'enviar' || tipoBotao === 'ambos'
  const showWhatsApp = tipoBotao === 'whatsapp' || tipoBotao === 'ambos'

  const btnEnviarStyle: React.CSSProperties = {
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
    cursor: enviando ? 'not-allowed' : 'pointer',
    opacity: enviando ? 0.7 : 1,
  }

  const btnWhatsAppStyle: React.CSSProperties = {
    backgroundColor: estiloBotao.whatsapp_background || '#25D366',
    color: estiloBotao.whatsapp_texto_cor || '#FFFFFF',
    borderRadius: estiloBotao.whatsapp_border_radius || '6px',
    width: tipoBotao === 'ambos' ? '100%' : (estiloBotao.whatsapp_largura === 'full' ? '100%' : estiloBotao.whatsapp_largura === '50%' ? '50%' : 'auto'),
    height: estiloBotao.whatsapp_altura || undefined,
    padding: estiloBotao.whatsapp_altura ? '0 20px' : '10px 20px',
    fontSize: estiloBotao.whatsapp_font_size || '14px',
    fontWeight: estiloBotao.whatsapp_font_bold ? 700 : 600,
    fontStyle: estiloBotao.whatsapp_font_italic ? 'italic' : undefined,
    textDecoration: estiloBotao.whatsapp_font_underline ? 'underline' : undefined,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  }

  const handleWhatsApp = () => {
    const numero = configBotoes?.whatsapp_numero || ''
    let msg = configBotoes?.whatsapp_mensagem_template || ''
    if (!msg) {
      // Auto-generate
      const lines = campos.filter(c => valores[c.id]).map(c => `*${c.label}:* ${valores[c.id]}`)
      msg = lines.join('\n')
    } else {
      // Replace {{campo}} with values
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
