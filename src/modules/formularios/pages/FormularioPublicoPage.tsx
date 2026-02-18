/**
 * AIDEV-NOTE: Página pública do formulário - rota /f/:slug
 * Acesso anônimo, busca formulário publicado, renderiza campos com máscaras,
 * captura UTMs e permite submissão
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getMaskForType } from '../utils/masks'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import DOMPurify from 'dompurify'
import type { CampoFormulario, EstiloFormulario, EstiloContainer, EstiloCampos, EstiloBotao, EstiloCabecalho } from '../services/formularios.api'
import { generateFormResponsiveCss, generateColunasResponsiveCss } from '../utils/responsiveStyles'
import { mergeCampoEstilo, ensureUnit } from '../utils/campoEstiloUtils'

interface FormularioPublico {
  id: string
  nome: string
  slug: string
  descricao: string | null
  config_botoes: Record<string, unknown> | null
  config_pos_envio: Record<string, unknown> | null
  organizacao_id: string
  lgpd_ativo: boolean | null
  lgpd_texto_consentimento: string | null
  lgpd_url_politica: string | null
  lgpd_checkbox_obrigatorio: boolean | null
}

const SOMBRA_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
}

function parseLayoutConfig(valorPadrao: string | null | undefined, tipo: string): Record<string, string> {
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
  const [lgpdAceito, setLgpdAceito] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ddiSelecionado, setDdiSelecionado] = useState<Record<string, string>>({})
  const [enderecoValues, setEnderecoValues] = useState<Record<string, { rua: string; numero: string; complemento: string }>>({})
  const [buscandoCep, setBuscandoCep] = useState<Record<string, boolean>>({})

  // AIDEV-NOTE: Refs para tracking de analytics - evitar duplicatas
  const jaRegistrouVisualizacao = useRef(false)
  const jaRegistrouInicio = useRef(false)
  const focoTimestamps = useRef<Record<string, number>>({})

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
        .select('id, nome, slug, descricao, config_botoes, config_pos_envio, organizacao_id, lgpd_ativo, lgpd_texto_consentimento, lgpd_url_politica, lgpd_checkbox_obrigatorio')
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

      // AIDEV-NOTE: Registrar evento de visualização (analytics)
      if (!jaRegistrouVisualizacao.current) {
        jaRegistrouVisualizacao.current = true
        // Incrementar contador via RPC (SECURITY DEFINER)
        supabase.rpc('incrementar_visualizacao_formulario', { p_formulario_id: form.id }).then(() => {})
        // Registrar evento granular
        supabase.from('eventos_analytics_formularios').insert({
          formulario_id: form.id,
          tipo_evento: 'visualizacao',
          navegador: navigator.userAgent,
        }).then(() => {})
      }
    }
    load()
  }, [slug])

  // AIDEV-NOTE: Registrar evento de início na primeira interação com campo
  const registrarInicio = useCallback(() => {
    if (jaRegistrouInicio.current || !formulario) return
    jaRegistrouInicio.current = true
    supabase.from('eventos_analytics_formularios').insert({
      formulario_id: formulario.id,
      tipo_evento: 'inicio',
      navegador: navigator.userAgent,
    }).then(() => {})
  }, [formulario])

  // AIDEV-NOTE: Tracking de foco/saída de campos via event delegation
  const handleFormFocus = useCallback((e: React.FocusEvent) => {
    registrarInicio()
    const target = e.target as HTMLElement
    const fieldWrapper = target.closest('[data-campo-id]')
    if (!fieldWrapper || !formulario) return
    const campoId = fieldWrapper.getAttribute('data-campo-id')!
    focoTimestamps.current[campoId] = Date.now()
    supabase.from('eventos_analytics_formularios').insert({
      formulario_id: formulario.id,
      tipo_evento: 'foco_campo',
      dados_evento: { campo_id: campoId },
    }).then(() => {})
  }, [formulario, registrarInicio])

  const handleFormBlur = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement
    const fieldWrapper = target.closest('[data-campo-id]')
    if (!fieldWrapper || !formulario) return
    const campoId = fieldWrapper.getAttribute('data-campo-id')!
    const inicio = focoTimestamps.current[campoId]
    const tempo = inicio ? Math.round((Date.now() - inicio) / 1000) : null
    delete focoTimestamps.current[campoId]
    supabase.from('eventos_analytics_formularios').insert({
      formulario_id: formulario.id,
      tipo_evento: 'saida_campo',
      dados_evento: { campo_id: campoId },
      tempo_no_campo_segundos: tempo,
    }).then(() => {})
  }, [formulario])

  // AIDEV-NOTE: Registrar evento de abandono quando o usuário sai sem enviar
  useEffect(() => {
    if (!formulario) return
    const sbUrl = 'https://ybzhlsalbnxwkfszkloa.supabase.co'
    const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M'

    const registrarAbandono = () => {
      if (!jaRegistrouInicio.current || enviado) return
      // Usar fetch com keepalive para garantir envio ao fechar aba
      fetch(`${sbUrl}/rest/v1/eventos_analytics_formularios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          formulario_id: formulario.id,
          tipo_evento: 'abandono',
          navegador: navigator.userAgent,
        }),
        keepalive: true,
      }).catch(() => {})
    }

    const onVisChange = () => { if (document.visibilityState === 'hidden') registrarAbandono() }
    window.addEventListener('beforeunload', registrarAbandono)
    document.addEventListener('visibilitychange', onVisChange)
    return () => {
      window.removeEventListener('beforeunload', registrarAbandono)
      document.removeEventListener('visibilitychange', onVisChange)
    }
  }, [formulario, enviado])

  const handleChange = useCallback((campoId: string, tipo: string, rawValue: string) => {
    registrarInicio()
    const mask = getMaskForType(tipo)
    const value = mask ? mask(rawValue) : rawValue
    setValores(prev => ({ ...prev, [campoId]: value }))
  }, [registrarInicio])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formulario) return
    setEnviando(true)
    setErro(null)

    // Validar LGPD obrigatório
    if (formulario.lgpd_ativo && formulario.lgpd_checkbox_obrigatorio && !lgpdAceito) {
      setErro('Você precisa aceitar os termos de consentimento para enviar.')
      setEnviando(false)
      return
    }

    const layoutTypes = ['titulo', 'paragrafo', 'divisor', 'espacador', 'oculto', 'bloco_html', 'imagem_link', 'botao_enviar', 'botao_whatsapp']
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

    // AIDEV-NOTE: Envia tudo via edge function (service_role) para evitar 401 em contexto público
    try {
      const resp = await fetch('https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/processar-submissao-formulario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M',
        },
        body: JSON.stringify({
          formulario_id: formulario.id,
          dados: dadosCampos,
          utm_source: utms.utm_source || null,
          utm_medium: utms.utm_medium || null,
          utm_campaign: utms.utm_campaign || null,
          user_agent: navigator.userAgent,
        }),
      })

      setEnviando(false)
      if (!resp.ok) {
        const posEnvioErr = formulario.config_pos_envio as any
        setErro(posEnvioErr?.mensagem_erro || 'Erro ao enviar formulário. Tente novamente.')
        return
      }
    } catch (err) {
      setEnviando(false)
      const posEnvioErr = formulario.config_pos_envio as any
      setErro(posEnvioErr?.mensagem_erro || 'Erro ao enviar formulário. Tente novamente.')
      return
    }

    setEnviado(true)

    // AIDEV-NOTE: Registrar evento de submissão para analytics/funil
    supabase.from('eventos_analytics_formularios').insert({
      formulario_id: formulario.id,
      tipo_evento: 'submissao',
      navegador: navigator.userAgent,
    }).then(() => {})

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
  const configBotoesRaw = formulario.config_botoes as any || {}
  const configBotoes = { ...configBotoesRaw, tipo_botao: configBotoesRaw.tipo_botao || 'enviar' }
  const posEnvio = formulario.config_pos_envio as any || {}
  const fontFamily = container.font_family ? `${container.font_family}, 'Inter', system-ui, sans-serif` : "'Inter', system-ui, sans-serif"

  const mensagemSucesso = posEnvio.mensagem_sucesso || 'Formulário enviado com sucesso!'

  if (enviado) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: pagina.background_color || '#F3F4F6', fontFamily }}>
        <div style={{
          backgroundColor: container.background_color || '#FFFFFF',
          borderRadius: container.border_radius || '8px',
          padding: container.padding_top
            ? `${container.padding_top}px ${container.padding_right || '24'}px ${container.padding_bottom || '24'}px ${container.padding_left || '24'}px`
            : (container.padding || '24px'),
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

  // AIDEV-NOTE: Funções que geram estilos merged (global + individual por campo)
  const getInputStyle = (campo: CampoFormulario): React.CSSProperties => {
    const m = mergeCampoEstilo(camposEstilo, campo)
    const bw = m.input_border_width || '1'
    const bs = m.input_border_style || 'solid'
    const bc = m.input_border_color || '#D1D5DB'
    return {
      width: '100%',
      backgroundColor: m.input_background || '#F9FAFB',
      border: `${bw}px ${bs} ${bc}`,
      borderRadius: ensureUnit(m.input_border_radius, '6px', 'borderRadius'),
      color: m.input_texto_cor || '#1F2937',
      padding: '8px 12px',
      fontSize: '14px',
      height: ensureUnit(m.input_height, '2.5rem', 'height'),
      outline: 'none',
      fontFamily,
      boxSizing: 'border-box' as const,
    }
  }

  const getLabelStyle = (campo: CampoFormulario): React.CSSProperties => {
    const m = mergeCampoEstilo(camposEstilo, campo)
    return {
      color: m.label_cor || '#374151',
      fontSize: ensureUnit(m.label_tamanho, '0.875rem', 'fontSize'),
      fontWeight: (m.label_font_weight || '500') as any,
      display: 'block',
      marginBottom: '4px',
      fontFamily,
    }
  }


  let responsiveCss = generateFormResponsiveCss(
    formulario.id,
    botao as unknown as Record<string, unknown>,
    container as unknown as Record<string, unknown>,
    camposEstilo as unknown as Record<string, unknown>,
  )
  // AIDEV-NOTE: Gerar CSS responsivo para cada bloco de colunas
  for (const c of campos) {
    if (c.tipo === 'bloco_colunas') {
      try {
        const p = JSON.parse(c.valor_padrao || '{}')
        responsiveCss += generateColunasResponsiveCss(c.id, {
          colunas: parseInt(p.colunas) || 2,
          larguras: p.larguras || '50%,50%',
          larguras_tablet: p.larguras_tablet,
          larguras_mobile: p.larguras_mobile,
        })
      } catch { /* skip */ }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: pagina.background_color || '#F3F4F6', padding: '16px' }}>
      {responsiveCss && <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />}
      <form
        onSubmit={handleSubmit}
        onFocus={handleFormFocus}
        onBlur={handleFormBlur}
        data-form-id={formulario.id}
        style={{
          backgroundColor: container.background_color || '#FFFFFF',
          borderRadius: container.border_radius || '8px',
          padding: container.padding_top
            ? `${container.padding_top}px ${container.padding_right || '24'}px ${container.padding_bottom || '24'}px ${container.padding_left || '24'}px`
            : (container.padding || '24px'),
          maxWidth: container.max_width || '600px',
          width: '100%',
          boxShadow: SOMBRA_MAP[container.sombra || 'md'],
          fontFamily,
          border: container.border_width && parseInt(container.border_width) > 0
            ? `${container.border_width}px solid ${container.border_color || '#D1D5DB'}`
            : undefined,
        }}
      >
        {/* Cabeçalho - só logo e descrição, sem título do formulário */}
        {(cabecalho.logo_url || formulario.descricao) && (
          <div style={{ marginBottom: '24px', textAlign: 'center' as const }}>
            {cabecalho.logo_url && (
              <img src={cabecalho.logo_url} alt="Logo" style={{ maxHeight: '40px', marginBottom: '8px', display: 'inline-block' }} />
            )}
            {formulario.descricao && (
              <p style={{ color: cabecalho.descricao_cor || '#6B7280', fontSize: cabecalho.descricao_tamanho || '14px', marginTop: '4px', fontFamily }}>{formulario.descricao}</p>
            )}
          </div>
        )}

        {/* Campos - excluir botões (renderizados no rodapé) */}
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {campos.filter(c => !c.pai_campo_id && c.tipo !== 'botao_enviar' && c.tipo !== 'botao_whatsapp').map(campo => {
            // AIDEV-NOTE: Bloco de colunas na página pública
            if (campo.tipo === 'bloco_colunas') {
              const colConfig = (() => {
                try {
                  const p = JSON.parse(campo.valor_padrao || '{}')
                  return { colunas: parseInt(p.colunas) || 2, larguras: (p.larguras || '50%,50%').split(',').map((l: string) => l.trim()), gap: p.gap || '16' }
                } catch { return { colunas: 2, larguras: ['50%', '50%'], gap: '16' } }
              })()

              return (
                <div key={campo.id} style={{ width: '100%', padding: `${((campo.validacoes as Record<string, unknown>)?.spacing_top as string) || '0'}px 0` }}>
                  <div data-bloco-id={campo.id} style={{ display: 'flex', flexWrap: 'wrap', gap: `${colConfig.gap}px` }}>
                    {Array.from({ length: colConfig.colunas }).map((_, colIdx) => {
                      const children = campos
                        .filter(c => c.pai_campo_id === campo.id && c.coluna_indice === colIdx)
                        .sort((a, b) => a.ordem - b.ordem)
                      const rawW = colConfig.larguras[colIdx] || `${Math.floor(100 / colConfig.colunas)}%`
                      // AIDEV-NOTE: Compensar o gap no cálculo da largura
                      const gapPx = parseInt(colConfig.gap) || 16
                      const totalGap = gapPx * (colConfig.colunas - 1)
                      const width = rawW.endsWith('%')
                        ? `calc(${rawW} - ${totalGap * parseFloat(rawW) / 100}px)`
                        : rawW

                      return (
                        <div key={colIdx} className={`col-${colIdx}`} style={{ width, display: 'flex', flexWrap: 'wrap' }}>
                          {children.map(child => {
                            const childLarguraMap: Record<string, string> = { full: '100%', '1/2': '50%', '1/3': '33.33%', '2/3': '66.66%', half: '50%', third: '33.33%' }
                            const cw = childLarguraMap[child.largura] || '100%'
                            // AIDEV-NOTE: Espaçamento individual por campo (validacoes.spacing_*)
                            const childVal = (child.validacoes || {}) as Record<string, unknown>
                            const fieldMargin = `${childVal.spacing_top || '0'}px ${childVal.spacing_right || '0'}px ${childVal.spacing_bottom || '0'}px ${childVal.spacing_left || '0'}px`
                            return (
                              <div key={child.id} data-campo-id={child.id} style={{ width: cw, padding: fieldMargin, boxSizing: 'border-box' as const }}>
                                {renderCampoPublico({
                                  campo: child, labelStyle: getLabelStyle(child), inputStyle: getInputStyle(child), fontFamily, camposEstilo: mergeCampoEstilo(camposEstilo, child),
                                  valor: valores[child.id] || '',
                                  onChange: (v) => handleChange(child.id, child.tipo, v),
                                  ddi: ddiSelecionado[child.id] || (PAISES_DDI.find(p => p.code === child.valor_padrao)?.ddi || '+55'),
                                  onDdiChange: (ddi) => setDdiSelecionado(prev => ({ ...prev, [child.id]: ddi })),
                                  enderecoValue: enderecoValues[child.id] || { rua: '', numero: '', complemento: '' },
                                  onEnderecoChange: (val) => setEnderecoValues(prev => ({ ...prev, [child.id]: val })),
                                  buscandoCepField: buscandoCep[child.id] || false,
                                  onCepBusca: async (cepVal: string) => {
                                    const cepLimpo = cepVal.replace(/\D/g, '')
                                    if (cepLimpo.length !== 8) return
                                    setBuscandoCep(prev => ({ ...prev, [child.id]: true }))
                                    try {
                                      const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
                                      const data = await resp.json()
                                      if (!data.erro) {
                        const allCampos = campos
                        const endCampo = allCampos.find(c => c.tipo === 'endereco')
                        if (endCampo) {
                          setEnderecoValues(prev => ({ ...prev, [endCampo.id]: { rua: data.logradouro || '', numero: '', complemento: '' } }))
                          setValores(prev => ({ ...prev, [endCampo.id]: data.logradouro || '' }))
                        }
                        const cidadeCampo = allCampos.find(c => c.tipo === 'cidade')
                        if (cidadeCampo) setValores(prev => ({ ...prev, [cidadeCampo.id]: data.localidade || '' }))
                        const estadoCampo = allCampos.find(c => c.tipo === 'estado')
                        if (estadoCampo) setValores(prev => ({ ...prev, [estadoCampo.id]: data.uf || '' }))
                        const paisCampo = allCampos.find(c => c.tipo === 'pais')
                        if (paisCampo) setValores(prev => ({ ...prev, [paisCampo.id]: '🇧🇷 BR' }))
                        setValores(prev => ({ ...prev, [child.id]: cepVal }))
                                      }
                                    } catch { /* silently fail */ }
                                    setBuscandoCep(prev => ({ ...prev, [child.id]: false }))
                                  },
                                  allCampos: campos,
                                  setValores,
                                })}
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

            const larguraMap: Record<string, string> = { full: '100%', '1/2': '50%', '1/3': '33.33%', '2/3': '66.66%', half: '50%', third: '33.33%' }
            const w = larguraMap[campo.largura] || '100%'
            // AIDEV-NOTE: Espaçamento individual por campo (validacoes.spacing_*)
            const campoVal = (campo.validacoes || {}) as Record<string, unknown>
            const fieldMargin = `${campoVal.spacing_top || '0'}px ${campoVal.spacing_right || '0'}px ${campoVal.spacing_bottom || '0'}px ${campoVal.spacing_left || '0'}px`
            return (
              <div key={campo.id} data-campo-id={campo.id} style={{ width: w, padding: fieldMargin, boxSizing: 'border-box' as const }}>
                {renderCampoPublico({
                  campo, labelStyle: getLabelStyle(campo), inputStyle: getInputStyle(campo), fontFamily, camposEstilo: mergeCampoEstilo(camposEstilo, campo),
                  valor: valores[campo.id] || '',
                  onChange: (v) => handleChange(campo.id, campo.tipo, v),
                  ddi: ddiSelecionado[campo.id] || (PAISES_DDI.find(p => p.code === campo.valor_padrao)?.ddi || '+55'),
                  onDdiChange: (ddi) => setDdiSelecionado(prev => ({ ...prev, [campo.id]: ddi })),
                  enderecoValue: enderecoValues[campo.id] || { rua: '', numero: '', complemento: '' },
                  onEnderecoChange: (val) => setEnderecoValues(prev => ({ ...prev, [campo.id]: val })),
                  buscandoCepField: buscandoCep[campo.id] || false,
                  onCepBusca: async (cepVal: string) => {
                    const cepLimpo = cepVal.replace(/\D/g, '')
                    if (cepLimpo.length !== 8) return
                    setBuscandoCep(prev => ({ ...prev, [campo.id]: true }))
                    try {
                      const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
                      const data = await resp.json()
                      if (!data.erro) {
                        const allCampos = campos
                        const endCampo = allCampos.find(c => c.tipo === 'endereco')
                        if (endCampo) {
                          setEnderecoValues(prev => ({ ...prev, [endCampo.id]: { rua: data.logradouro || '', numero: '', complemento: '' } }))
                          setValores(prev => ({ ...prev, [endCampo.id]: data.logradouro || '' }))
                        }
                        const cidadeCampo = allCampos.find(c => c.tipo === 'cidade')
                        if (cidadeCampo) setValores(prev => ({ ...prev, [cidadeCampo.id]: data.localidade || '' }))
                        const estadoCampo = allCampos.find(c => c.tipo === 'estado')
                        if (estadoCampo) setValores(prev => ({ ...prev, [estadoCampo.id]: data.uf || '' }))
                        const paisCampo = allCampos.find(c => c.tipo === 'pais')
                        if (paisCampo) setValores(prev => ({ ...prev, [paisCampo.id]: '🇧🇷 BR' }))
                        // Also fill standalone CEP field value
                        setValores(prev => ({ ...prev, [campo.id]: cepVal }))
                      }
                    } catch { /* silently fail */ }
                    setBuscandoCep(prev => ({ ...prev, [campo.id]: false }))
                  },
                  allCampos: campos,
                  setValores,
                })}
              </div>
            )
          })}
        </div>

        {/* LGPD Consentimento */}
        {formulario.lgpd_ativo && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px', fontSize: '13px', fontFamily }}>
            <input
              type="checkbox"
              checked={lgpdAceito}
              onChange={e => setLgpdAceito(e.target.checked)}
              style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#3B82F6', flexShrink: 0 }}
            />
            <span style={{ color: '#4B5563', lineHeight: '1.4' }}>
              {formulario.lgpd_texto_consentimento || 'Ao enviar este formulário, você concorda com nossa Política de Privacidade.'}
              {formulario.lgpd_url_politica && (
                <>
                  {' '}
                  <a
                    href={formulario.lgpd_url_politica}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3B82F6', textDecoration: 'underline' }}
                  >
                    Ver política
                  </a>
                </>
              )}
              {formulario.lgpd_checkbox_obrigatorio && (
                <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
              )}
            </span>
          </div>
        )}

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

interface EnderecoValue { rua: string; numero: string; complemento: string }

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
  enderecoValue: EnderecoValue
  onEnderecoChange: (val: EnderecoValue) => void
  buscandoCepField: boolean
  onCepBusca: (cep: string) => void
  allCampos: CampoFormulario[]
  setValores: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

// =====================================================
// Componente Assinatura com Canvas
// =====================================================

function AssinaturaField(props: {
  campo: CampoFormulario
  labelStyle: React.CSSProperties
  camposEstilo: EstiloCampos
  valor: string
  onChange: (v: string) => void
  renderLabel: () => React.ReactNode
}) {
  const { camposEstilo, onChange, renderLabel } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    setHasDrawn(true)
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1F2937'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDraw = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      onChange(canvas.toDataURL('image/png'))
    }
  }

  const limpar = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasDrawn(false)
      onChange('')
    }
  }

  return (
    <div>
      {renderLabel()}
      <div style={{
        border: `1px solid ${camposEstilo.input_border_color || '#D1D5DB'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        position: 'relative',
      }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          style={{ width: '100%', height: '150px', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasDrawn && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9CA3AF', fontSize: '13px', pointerEvents: 'none',
          }}>
            ✍️ Desenhe sua assinatura aqui
          </div>
        )}
      </div>
      {hasDrawn && (
        <button
          type="button"
          onClick={limpar}
          style={{
            marginTop: '6px', fontSize: '12px', color: '#6B7280',
            background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Limpar assinatura
        </button>
      )}
    </div>
  )
}

function renderCampoPublico(props: RenderCampoProps) {
  const { campo, labelStyle, inputStyle, fontFamily, camposEstilo, valor, onChange, ddi, onDdiChange, enderecoValue, onEnderecoChange, buscandoCepField, onCepBusca } = props
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
    case 'titulo': {
      const tc = parseLayoutConfig(campo.valor_padrao, 'titulo')
      return <h3 style={{ ...labelStyle, fontSize: `${tc.tamanho}px`, fontWeight: 600, marginBottom: 0, textAlign: tc.alinhamento as any, color: tc.cor }}>{placeholder || campo.label}</h3>
    }
    case 'paragrafo': {
      const pc = parseLayoutConfig(campo.valor_padrao, 'paragrafo')
      return <p style={{ fontSize: `${pc.tamanho}px`, margin: 0, fontFamily, textAlign: pc.alinhamento as any, color: pc.cor }}>{placeholder || campo.label}</p>
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
      return <div style={{ fontSize: '14px', fontFamily }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(campo.valor_padrao || '') }} />
    case 'imagem_link': {
      let imgUrl = ''
      let linkUrl = ''
      try {
        const parsed = JSON.parse(campo.valor_padrao || '{}')
        // Responsive: pick best image for current screen via CSS picture element approach
        // For simplicity, use desktop fallback
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
        const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024
        imgUrl = (isMobile && parsed.url_mobile) || (isTablet && parsed.url_tablet) || parsed.url_desktop || parsed.url_tablet || parsed.url_mobile || ''
        linkUrl = parsed.redirect_url || ''
      } catch {
        imgUrl = campo.valor_padrao || ''
        linkUrl = campo.placeholder || ''
      }
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
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
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
              boxSizing: 'border-box' as const,
              height: 'auto',
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
    case 'cep': {
      const handleCepInput = (raw: string) => {
        const mask = getMaskForType('cep')
        const masked = mask ? mask(raw) : raw
        onChange(masked)
        // Auto-busca quando completo
        if (masked.replace(/\D/g, '').length === 8) {
          onCepBusca(masked)
        }
      }
      return (
        <div>
          {renderLabel()}
          <div style={{ position: 'relative' }}>
            <input style={inputStyle} placeholder={placeholder || '00000-000'} value={valor} onChange={e => handleCepInput(e.target.value)} maxLength={9} />
            {buscandoCepField && (
              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: '12px' }}>
                ⏳
              </div>
            )}
          </div>
        </div>
      )
    }
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
      return (
        <div>
          {renderLabel()}
          <select style={{ ...inputStyle, appearance: 'auto' }} value={valor} onChange={e => onChange(e.target.value)}>
            <option value="">{placeholder || 'Selecione...'}</option>
            {(campo.opcoes as string[] || []).map((op, i) => <option key={i} value={op}>{typeof op === 'string' ? op : `Opção ${i + 1}`}</option>)}
          </select>
        </div>
      )

    // ========== MULTI SELECT (checkboxes) ==========
    case 'selecao_multipla': {
      const selectedValues = valor ? valor.split('|') : []
      const toggleValue = (v: string) => {
        const newVals = selectedValues.includes(v)
          ? selectedValues.filter(s => s !== v)
          : [...selectedValues, v]
        onChange(newVals.join('|'))
      }
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            {(campo.opcoes as string[] || []).map((op, i) => {
              const label = typeof op === 'string' ? op : `Opção ${i + 1}`
              const isChecked = selectedValues.includes(label)
              return (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    border: `1px solid ${isChecked ? '#3B82F6' : (camposEstilo.input_border_color || '#D1D5DB')}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: isChecked ? '#EFF6FF' : '#FFFFFF',
                    fontSize: '14px',
                    fontFamily,
                    transition: 'all 0.15s',
                  }}
                  onClick={() => toggleValue(label)}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ width: '16px', height: '16px', accentColor: '#3B82F6', flexShrink: 0 }}
                  />
                  {label}
                </label>
              )
            })}
          </div>
        </div>
      )
    }

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
    case 'endereco': {
      const ev = enderecoValue
      const updateField = (field: keyof EnderecoValue, v: string) => {
        const updated = { ...ev, [field]: v }
        onEnderecoChange(updated)
        onChange([updated.rua, updated.numero, updated.complemento].filter(Boolean).join(', '))
      }
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Rua / Logradouro" value={ev.rua} onChange={e => updateField('rua', e.target.value)} />
              <input style={{ ...inputStyle, flex: 0, width: '80px', minWidth: '70px' }} placeholder="Nº" value={ev.numero} onChange={e => updateField('numero', e.target.value)} />
            </div>
            <input style={inputStyle} placeholder="Complemento (opcional)" value={ev.complemento} onChange={e => updateField('complemento', e.target.value)} />
          </div>
        </div>
      )
    }
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

    // ========== RANKING (com botões ↑↓ para reordenar) ==========
    case 'ranking': {
      const opcoes = (campo.opcoes as string[] || [])
      const ranked = valor ? valor.split('|') : [...opcoes]

      const move = (from: number, to: number) => {
        const arr = [...ranked]
        const [item] = arr.splice(from, 1)
        arr.splice(to, 0, item)
        onChange(arr.join('|'))
      }

      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
            {ranked.map((op, i) => (
              <div key={`${op}-${i}`} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px',
                border: `1px solid ${camposEstilo.input_border_color || '#D1D5DB'}`,
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                fontSize: '14px',
                fontFamily,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  backgroundColor: '#EFF6FF', color: '#3B82F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ flex: 1 }}>{typeof op === 'string' ? op : `Item ${i + 1}`}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                    style={{
                      width: '24px', height: '20px', border: '1px solid #D1D5DB', borderRadius: '4px',
                      backgroundColor: i === 0 ? '#F3F4F6' : '#FFFFFF',
                      cursor: i === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: i === 0 ? '#D1D5DB' : '#6B7280',
                    }}
                  >▲</button>
                  <button
                    type="button"
                    disabled={i === ranked.length - 1}
                    onClick={() => move(i, i + 1)}
                    style={{
                      width: '24px', height: '20px', border: '1px solid #D1D5DB', borderRadius: '4px',
                      backgroundColor: i === ranked.length - 1 ? '#F3F4F6' : '#FFFFFF',
                      cursor: i === ranked.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: i === ranked.length - 1 ? '#D1D5DB' : '#6B7280',
                    }}
                  >▼</button>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px' }}>Use as setas para reordenar os itens</p>
        </div>
      )
    }

    // ========== UPLOAD FIELDS ==========
    case 'upload_imagem':
    case 'upload_video':
    case 'upload_audio':
    case 'anexo_arquivo':
    case 'documento':
    case 'arquivo':
    case 'imagem': {
      const typeMap: Record<string, string> = {
        upload_imagem: 'image/*',
        imagem: 'image/*',
        upload_video: 'video/*',
        upload_audio: 'audio/*',
        anexo_arquivo: '*/*',
        arquivo: '*/*',
        documento: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
      }
      const labelMap: Record<string, string> = {
        upload_imagem: 'Selecionar imagem',
        imagem: 'Selecionar imagem',
        upload_video: 'Selecionar vídeo',
        upload_audio: 'Selecionar áudio',
        anexo_arquivo: 'Selecionar arquivo',
        arquivo: 'Selecionar arquivo',
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

    // ========== ASSINATURA (canvas funcional) ==========
    case 'assinatura':
      return <AssinaturaField campo={campo} labelStyle={labelStyle} camposEstilo={camposEstilo} valor={valor} onChange={onChange} renderLabel={renderLabel} />

    // ========== SELETOR DE COR ==========
    case 'seletor_cor':
      return (
        <div>
          {renderLabel()}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{
              width: '44px', height: '44px', borderRadius: '8px',
              border: '2px solid #D1D5DB', cursor: 'pointer',
              backgroundColor: valor || '#3B82F6',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <input
                type="color"
                value={valor || '#3B82F6'}
                onChange={e => onChange(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
            </label>
            <input
              style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
              value={valor || '#3B82F6'}
              onChange={e => onChange(e.target.value)}
              placeholder="#000000"
              maxLength={7}
            />
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
    <button type="submit" className="form-btn-submit" style={btnEnviarStyle} disabled={enviando}>
      {enviando ? 'Enviando...' : (estiloBotao.texto || 'Enviar')}
    </button>
  ) : null

  const whatsAppBtn = showWhatsApp ? (
    <button type="button" className="form-btn-whatsapp" style={btnWhatsAppStyle} onClick={handleWhatsApp}>
      <WhatsAppIcon size={16} />
      {estiloBotao.whatsapp_texto || 'Enviar via WhatsApp'}
    </button>
  ) : null

  if (tipoBotao === 'ambos') {
    // AIDEV-NOTE: 50% = lado a lado (cada um 50%); full/auto = empilhados (cada um 100%)
    const larguraEnviar = estiloBotao?.largura || 'full'
    const larguraWhatsApp = estiloBotao?.whatsapp_largura || 'full'
    const ladoALado = larguraEnviar === '50%' && larguraWhatsApp === '50%'

    return (
      <div className="form-btns-wrapper" style={{ display: 'flex', gap: '8px', flexDirection: ladoALado ? 'row' : 'column' }}>
        <div style={{ width: ladoALado ? '50%' : '100%' }}>{enviarBtn}</div>
        <div style={{ width: ladoALado ? '50%' : '100%' }}>{whatsAppBtn}</div>
      </div>
    )
  }

  return enviarBtn || whatsAppBtn
}
