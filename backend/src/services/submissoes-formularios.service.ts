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

  // Incrementar visualizacoes (atomico)
  await supabase.rpc('incrementar_visualizacoes_formulario', { p_formulario_id: formulario.id })

  return {
    formulario,
    campos: campos || [],
    estilos,
  }
}

// =====================================================
// Rate Limit
// =====================================================
// Validacao Server-Side dos Dados Submetidos
// =====================================================

async function validarDadosSubmissao(
  formularioId: string,
  dados: Record<string, any>
): Promise<{ valido: boolean; erros: string[] }> {
  const { data: campos } = await supabase
    .from('campos_formularios')
    .select('nome, label, tipo, obrigatorio, validacoes')
    .eq('formulario_id', formularioId)
    .order('ordem', { ascending: true })

  if (!campos || campos.length === 0) {
    return { valido: true, erros: [] }
  }

  const erros: string[] = []

  for (const campo of campos) {
    const valor = dados[campo.nome]

    // Verificar obrigatoriedade
    if (campo.obrigatorio && (valor === undefined || valor === null || valor === '')) {
      erros.push(`Campo "${campo.label}" e obrigatorio`)
      continue
    }

    // Se nao obrigatorio e vazio, pular
    if (valor === undefined || valor === null || valor === '') continue

    // Validar tipo
    switch (campo.tipo) {
      case 'email':
        if (typeof valor === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
          erros.push(`Campo "${campo.label}" deve ser um email valido`)
        }
        break
      case 'telefone':
        if (typeof valor === 'string' && !/^[\d\s\-\+\(\)]{8,20}$/.test(valor)) {
          erros.push(`Campo "${campo.label}" deve ser um telefone valido`)
        }
        break
      case 'numero':
        if (isNaN(Number(valor))) {
          erros.push(`Campo "${campo.label}" deve ser um numero`)
        }
        break
      case 'url':
        try { new URL(String(valor)) } catch {
          erros.push(`Campo "${campo.label}" deve ser uma URL valida`)
        }
        break
      case 'cpf':
        if (typeof valor === 'string' && !/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(valor)) {
          erros.push(`Campo "${campo.label}" deve ser um CPF valido`)
        }
        break
      case 'cnpj':
        if (typeof valor === 'string' && !/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(valor)) {
          erros.push(`Campo "${campo.label}" deve ser um CNPJ valido`)
        }
        break
    }

    // Validacoes customizadas
    const validacoes = campo.validacoes as Record<string, any> | null
    if (validacoes) {
      if (validacoes.min_length && typeof valor === 'string' && valor.length < validacoes.min_length) {
        erros.push(`Campo "${campo.label}" deve ter no minimo ${validacoes.min_length} caracteres`)
      }
      if (validacoes.max_length && typeof valor === 'string' && valor.length > validacoes.max_length) {
        erros.push(`Campo "${campo.label}" deve ter no maximo ${validacoes.max_length} caracteres`)
      }
    }
  }

  return { valido: erros.length === 0, erros }
}

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

  // Validar dados contra campos do formulario
  const validacao = await validarDadosSubmissao(formulario.id, payload.dados)
  if (!validacao.valido) {
    return { sucesso: false, mensagem: `Dados invalidos: ${validacao.erros.join('; ')}` }
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

  // Incrementar contador (atomico)
  await supabase.rpc('incrementar_submissoes_formulario', { p_formulario_id: formulario.id })

  // Integracao com pipeline (se configurado)
  // Verificar config_botoes para funil_id se nao houver direto
  const configBotoes = (formulario.config_botoes && typeof formulario.config_botoes === 'object')
    ? formulario.config_botoes as Record<string, any>
    : null

  const deveCriarOportunidade =
    (formulario.funil_id) ||
    (configBotoes?.enviar_cria_oportunidade && configBotoes?.enviar_funil_id) ||
    (configBotoes?.whatsapp_cria_oportunidade && configBotoes?.whatsapp_funil_id)

  if (deveCriarOportunidade) {
    // Determinar funil_id: prioridade config_botoes > campo direto
    const funilIdFinal = configBotoes?.enviar_funil_id || configBotoes?.whatsapp_funil_id || formulario.funil_id
    try {
      await criarLeadDaSubmissao(formulario, submissao, payload, funilIdFinal)
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
  payload: SubmeterFormularioPublicoPayload,
  funilIdOverride?: string
) {
  // Buscar mapeamento dos campos
  const { data: camposForm } = await supabase
    .from('campos_formularios')
    .select('nome, mapeamento_campo')
    .eq('formulario_id', formulario.id)
    .not('mapeamento_campo', 'is', null)

  if (!camposForm || camposForm.length === 0) return

  // Extrair dados mapeados
  // Aceitar prefixos: contato.*, pessoa.*, empresa.*
  const dadosContato: Record<string, any> = {}
  const dadosEmpresa: Record<string, any> = {}
  const dadosOportunidade: Record<string, any> = {}

  for (const campo of camposForm) {
    const valor = payload.dados[campo.nome]
    if (valor === undefined || !campo.mapeamento_campo || campo.mapeamento_campo === 'nenhum') continue

    const mapeamento = campo.mapeamento_campo as string

    if (mapeamento.startsWith('contato.') || mapeamento.startsWith('pessoa.')) {
      const key = mapeamento.replace(/^(contato|pessoa)\./, '')
      dadosContato[key] = valor
    } else if (mapeamento.startsWith('empresa.')) {
      const key = mapeamento.replace('empresa.', '')
      dadosEmpresa[key] = valor
    } else if (mapeamento.startsWith('oportunidade.')) {
      const key = mapeamento.replace('oportunidade.', '')
      dadosOportunidade[key] = valor
    } else if (mapeamento.startsWith('custom.pessoa.')) {
      // Campos customizados de pessoa - armazenar para uso futuro
      dadosContato[mapeamento] = valor
    } else if (mapeamento.startsWith('custom.empresa.')) {
      dadosEmpresa[mapeamento] = valor
    }
  }

  // Criar ou buscar contato
  let contatoId: string | null = null

  if (dadosContato.email || dadosContato.nome || dadosContato.telefone) {
    // Buscar contato existente pelo email (se disponível)
    if (dadosContato.email) {
      const { data: contatoExistente } = await supabase
        .from('contatos')
        .select('id')
        .eq('organizacao_id', formulario.organizacao_id)
        .eq('email', dadosContato.email)
        .is('deletado_em', null)
        .single()

      if (contatoExistente) {
        contatoId = contatoExistente.id
        // Filtrar campos custom.* antes de atualizar
        const dadosUpdate: Record<string, any> = {}
        for (const [k, v] of Object.entries(dadosContato)) {
          if (!k.startsWith('custom.')) dadosUpdate[k] = v
        }
        if (Object.keys(dadosUpdate).length > 0) {
          await supabase
            .from('contatos')
            .update(dadosUpdate)
            .eq('id', contatoId)
        }
      }
    }

    if (!contatoId) {
      // Criar novo contato - filtrar campos custom.*
      const dadosInsert: Record<string, any> = {
        organizacao_id: formulario.organizacao_id,
        tipo: 'pessoa',
        origem: 'formulario',
      }
      for (const [k, v] of Object.entries(dadosContato)) {
        if (!k.startsWith('custom.')) dadosInsert[k] = v
      }

      const { data: novoContato } = await supabase
        .from('contatos')
        .insert(dadosInsert)
        .select('id')
        .single()

      contatoId = novoContato?.id || null
    }
  }

  // Criar oportunidade
  if (contatoId) {
    const funilId = funilIdOverride || formulario.funil_id
    if (!funilId) return

    // Buscar etapa de entrada do funil
    const { data: etapaEntrada } = await supabase
      .from('etapas_funil')
      .select('id')
      .eq('funil_id', funilId)
      .eq('tipo', 'entrada')
      .is('deletado_em', null)
      .single()

    const etapaId = etapaEntrada?.id || formulario.etapa_id

    // Gerar título no formato "[Nome] - #[Sequência]" (mesmo padrão do modal)
    const nomeContato = dadosContato.nome || 'Lead'
    const { count: countOportunidades } = await supabase
      .from('oportunidades')
      .select('id', { count: 'exact', head: true })
      .eq('contato_id', contatoId)
      .is('deletado_em', null)

    const sequencia = (countOportunidades || 0) + 1
    const tituloAuto = `${nomeContato} - #${sequencia}`

    const { data: oportunidade } = await supabase
      .from('oportunidades')
      .insert({
        organizacao_id: formulario.organizacao_id,
        funil_id: funilId,
        etapa_id: etapaId,
        contato_id: contatoId,
        titulo: tituloAuto,
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
