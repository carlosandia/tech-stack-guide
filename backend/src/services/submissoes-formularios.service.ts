/**
 * AIDEV-NOTE: Service para Submissoes de Formularios
 * Conforme PRD-17 - Modulo de Formularios (Etapa 1)
 * Submissao publica + listagem + integracao com pipeline
 */

import { supabaseAdmin } from '../config/supabase.js'
import type {
  SubmissaoFormulario,
  SubmeterFormularioPublicoPayload,
  ListarSubmissoesQuery,
  CriarLinkCompartilhamentoPayload,
  LinkCompartilhamento,
} from '../schemas/formularios.js'

const supabase = supabaseAdmin

// =====================================================
// Buscar Formulario Publico por Slug
// =====================================================

export async function buscarFormularioPublico(slug: string) {
  const { data: formulario, error } = await supabase
    .from('formularios')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'publicado')
    .is('deletado_em', null)
    .single()

  if (error || !formulario) return null

  // Buscar campos
  const { data: campos } = await supabase
    .from('campos_formularios')
    .select('*')
    .eq('formulario_id', formulario.id)
    .order('ordem', { ascending: true })

  // Buscar estilos
  const { data: estilos } = await supabase
    .from('estilos_formularios')
    .select('*')
    .eq('formulario_id', formulario.id)
    .single()

  // Incrementar visualizacoes
  await supabase
    .from('formularios')
    .update({ total_visualizacoes: (formulario.total_visualizacoes || 0) + 1 })
    .eq('id', formulario.id)

  return {
    formulario,
    campos: campos || [],
    estilos,
  }
}

// =====================================================
// Rate Limit
// =====================================================

async function verificarRateLimit(formularioId: string, ipAddress: string, max: number, janelaMinutos: number): Promise<boolean> {
  const agora = new Date()
  const inicioJanela = new Date(agora.getTime() - janelaMinutos * 60 * 1000)

  // Buscar registro existente
  const { data: registro } = await supabase
    .from('rate_limits_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .eq('ip_address', ipAddress)
    .single()

  if (!registro) {
    // Primeiro acesso
    await supabase.from('rate_limits_formularios').insert({
      formulario_id: formularioId,
      ip_address: ipAddress,
    })
    return true
  }

  // Verificar se a janela expirou
  const ultimaTentativa = new Date(registro.ultima_tentativa)
  if (ultimaTentativa < inicioJanela) {
    // Resetar
    await supabase
      .from('rate_limits_formularios')
      .update({
        tentativas: 1,
        primeira_tentativa: agora.toISOString(),
        ultima_tentativa: agora.toISOString(),
      })
      .eq('id', registro.id)
    return true
  }

  // Dentro da janela - verificar limite
  if (registro.tentativas >= max) {
    return false // Limite atingido
  }

  // Incrementar
  await supabase
    .from('rate_limits_formularios')
    .update({
      tentativas: registro.tentativas + 1,
      ultima_tentativa: agora.toISOString(),
    })
    .eq('id', registro.id)

  return true
}

// =====================================================
// Submeter Formulario (Publico)
// =====================================================

export async function submeterFormulario(
  slug: string,
  payload: SubmeterFormularioPublicoPayload,
  ipAddress: string,
  userAgent: string
): Promise<{ sucesso: boolean; mensagem: string; submissao_id?: string }> {
  // Buscar formulario
  const { data: formulario, error } = await supabase
    .from('formularios')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'publicado')
    .is('deletado_em', null)
    .single()

  if (error || !formulario) {
    return { sucesso: false, mensagem: 'Formulario nao encontrado ou nao publicado' }
  }

  // Verificar honeypot
  if (formulario.honeypot_ativo && payload.honeypot) {
    // Bot detectado - registrar como spam silenciosamente
    await supabase.from('submissoes_formularios').insert({
      formulario_id: formulario.id,
      organizacao_id: formulario.organizacao_id,
      dados: payload.dados,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: 'spam',
      honeypot_preenchido: true,
    })
    // Retornar sucesso falso para o bot
    return { sucesso: true, mensagem: formulario.mensagem_sucesso || 'Obrigado!' }
  }

  // Verificar rate limit
  if (formulario.rate_limit_ativo) {
    const permitido = await verificarRateLimit(
      formulario.id,
      ipAddress,
      formulario.rate_limit_max,
      formulario.rate_limit_janela_minutos
    )
    if (!permitido) {
      return { sucesso: false, mensagem: 'Muitas submissoes. Tente novamente mais tarde.' }
    }
  }

  // Criar submissao
  const { data: submissao, error: subError } = await supabase
    .from('submissoes_formularios')
    .insert({
      formulario_id: formulario.id,
      organizacao_id: formulario.organizacao_id,
      dados: payload.dados,
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer: payload.referrer,
      pagina_origem: payload.pagina_origem,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      utm_term: payload.utm_term,
      utm_content: payload.utm_content,
      status: 'nova',
      honeypot_preenchido: false,
      captcha_validado: payload.captcha_token ? true : null,
    })
    .select()
    .single()

  if (subError) {
    console.error('Erro ao criar submissao:', subError)
    return { sucesso: false, mensagem: 'Erro ao processar submissao' }
  }

  // Incrementar contador
  await supabase
    .from('formularios')
    .update({
      total_submissoes: (formulario.total_submissoes || 0) + 1,
      taxa_conversao: formulario.total_visualizacoes > 0
        ? Number(((((formulario.total_submissoes || 0) + 1) / formulario.total_visualizacoes) * 100).toFixed(2))
        : 0,
    })
    .eq('id', formulario.id)

  // Integracao com pipeline (se configurado)
  if (formulario.funil_id && formulario.etapa_id) {
    try {
      await criarLeadDaSubmissao(formulario, submissao, payload)
    } catch (err) {
      console.error('Erro ao criar lead da submissao:', err)
      // Nao falhar a submissao por erro de integracao
      await supabase
        .from('submissoes_formularios')
        .update({ status: 'erro', erro_mensagem: `Erro na integracao: ${(err as Error).message}` })
        .eq('id', submissao.id)
    }
  }

  // Marcar como processada
  await supabase
    .from('submissoes_formularios')
    .update({ status: 'processada' })
    .eq('id', submissao.id)
    .eq('status', 'nova')

  return {
    sucesso: true,
    mensagem: formulario.mensagem_sucesso || 'Obrigado! Sua resposta foi enviada com sucesso.',
    submissao_id: submissao.id,
  }
}

// =====================================================
// Criar Lead da Submissao (Integracao Pipeline)
// =====================================================

async function criarLeadDaSubmissao(
  formulario: any,
  submissao: any,
  payload: SubmeterFormularioPublicoPayload
) {
  // Buscar mapeamento dos campos
  const { data: camposForm } = await supabase
    .from('campos_formularios')
    .select('nome, mapeamento_campo')
    .eq('formulario_id', formulario.id)
    .not('mapeamento_campo', 'is', null)

  if (!camposForm || camposForm.length === 0) return

  // Extrair dados mapeados
  const dadosContato: Record<string, any> = {}
  const dadosOportunidade: Record<string, any> = {}

  for (const campo of camposForm) {
    const valor = payload.dados[campo.nome]
    if (valor === undefined) continue

    if (campo.mapeamento_campo.startsWith('contato.')) {
      const key = campo.mapeamento_campo.replace('contato.', '')
      dadosContato[key] = valor
    } else if (campo.mapeamento_campo.startsWith('oportunidade.')) {
      const key = campo.mapeamento_campo.replace('oportunidade.', '')
      dadosOportunidade[key] = valor
    }
  }

  // Criar ou buscar contato
  let contatoId: string | null = null

  if (dadosContato.email) {
    // Buscar contato existente pelo email
    const { data: contatoExistente } = await supabase
      .from('contatos')
      .select('id')
      .eq('organizacao_id', formulario.organizacao_id)
      .eq('email', dadosContato.email)
      .is('deletado_em', null)
      .single()

    if (contatoExistente) {
      contatoId = contatoExistente.id
      // Atualizar dados do contato
      await supabase
        .from('contatos')
        .update(dadosContato)
        .eq('id', contatoId)
    } else {
      // Criar novo contato
      const { data: novoContato } = await supabase
        .from('contatos')
        .insert({
          organizacao_id: formulario.organizacao_id,
          tipo: 'pessoa',
          origem: 'formulario',
          ...dadosContato,
        })
        .select('id')
        .single()

      contatoId = novoContato?.id || null
    }
  }

  // Criar oportunidade
  if (contatoId) {
    const { data: oportunidade } = await supabase
      .from('oportunidades')
      .insert({
        organizacao_id: formulario.organizacao_id,
        funil_id: formulario.funil_id,
        etapa_id: formulario.etapa_id,
        contato_id: contatoId,
        titulo: dadosContato.nome
          ? `${dadosContato.nome} - ${formulario.nome}`
          : `Lead - ${formulario.nome}`,
        origem: 'formulario',
        valor: dadosOportunidade.valor || 0,
        utm_source: payload.utm_source,
        utm_medium: payload.utm_medium,
        utm_campaign: payload.utm_campaign,
        ...dadosOportunidade,
      })
      .select('id')
      .single()

    // Atualizar submissao com IDs
    if (oportunidade) {
      await supabase
        .from('submissoes_formularios')
        .update({
          contato_id: contatoId,
          oportunidade_id: oportunidade.id,
        })
        .eq('id', submissao.id)
    }
  }
}

// =====================================================
// Listar Submissoes (Autenticado)
// =====================================================

export async function listarSubmissoes(
  organizacaoId: string,
  formularioId: string,
  query: ListarSubmissoesQuery
) {
  // Verificar propriedade
  const { data: form } = await supabase
    .from('formularios')
    .select('id')
    .eq('organizacao_id', organizacaoId)
    .eq('id', formularioId)
    .is('deletado_em', null)
    .single()

  if (!form) throw new Error('Formulario nao encontrado')

  let qb = supabase
    .from('submissoes_formularios')
    .select('*', { count: 'exact' })
    .eq('formulario_id', formularioId)
    .eq('organizacao_id', organizacaoId)

  if (query.status) qb = qb.eq('status', query.status)

  const offset = (query.page - 1) * query.per_page
  qb = qb.order('criado_em', { ascending: false }).range(offset, offset + query.per_page - 1)

  const { data, error, count } = await qb

  if (error) throw new Error(`Erro ao listar submissoes: ${error.message}`)

  return {
    submissoes: data as SubmissaoFormulario[],
    total: count || 0,
    page: query.page,
    per_page: query.per_page,
    total_pages: Math.ceil((count || 0) / query.per_page),
  }
}

// =====================================================
// Links de Compartilhamento
// =====================================================

export async function criarLinkCompartilhamento(
  organizacaoId: string,
  formularioId: string,
  payload: CriarLinkCompartilhamentoPayload,
  baseUrl: string,
  criadoPor?: string
): Promise<LinkCompartilhamento> {
  // Verificar propriedade
  const { data: form } = await supabase
    .from('formularios')
    .select('slug')
    .eq('organizacao_id', organizacaoId)
    .eq('id', formularioId)
    .is('deletado_em', null)
    .single()

  if (!form) throw new Error('Formulario nao encontrado')

  // Montar URL
  let urlCompleta = `${baseUrl}/f/${form.slug}`
  const utmParams: string[] = []
  if (payload.utm_source) utmParams.push(`utm_source=${encodeURIComponent(payload.utm_source)}`)
  if (payload.utm_medium) utmParams.push(`utm_medium=${encodeURIComponent(payload.utm_medium)}`)
  if (payload.utm_campaign) utmParams.push(`utm_campaign=${encodeURIComponent(payload.utm_campaign)}`)
  if (utmParams.length > 0) urlCompleta += `?${utmParams.join('&')}`

  // Codigo embed
  const codigoEmbed = payload.tipo === 'embed'
    ? `<iframe src="${urlCompleta}" width="100%" height="600" frameborder="0" style="border:none;"></iframe>`
    : null

  const { data, error } = await supabase
    .from('links_compartilhamento_formularios')
    .insert({
      formulario_id: formularioId,
      organizacao_id: organizacaoId,
      tipo: payload.tipo || 'link',
      url_completa: urlCompleta,
      codigo_embed: codigoEmbed,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar link: ${error.message}`)

  return data as LinkCompartilhamento
}

export async function listarLinksCompartilhamento(
  organizacaoId: string,
  formularioId: string
): Promise<LinkCompartilhamento[]> {
  const { data, error } = await supabase
    .from('links_compartilhamento_formularios')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('formulario_id', formularioId)
    .eq('ativo', true)
    .order('criado_em', { ascending: false })

  if (error) throw new Error(`Erro ao listar links: ${error.message}`)

  return data as LinkCompartilhamento[]
}

export default {
  buscarFormularioPublico,
  submeterFormulario,
  listarSubmissoes,
  criarLinkCompartilhamento,
  listarLinksCompartilhamento,
}
