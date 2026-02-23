import { supabase } from '@/lib/supabase'
import type {
  Parceiro,
  IndicacaoParceiro,
  ComissaoParceiro,
  ConfigProgramaParceiro,
  CriarParceiroData,
  AtualizarParceiroData,
  AtualizarConfigProgramaData,
  GerarComissoesData,
  AplicarGratuidadeData,
} from '../schemas/parceiro.schema'

// ─────────────────────────────────────────────────────────────────────────────
// PARCEIROS
// ─────────────────────────────────────────────────────────────────────────────

export async function listarParceiros(params?: {
  busca?: string
  status?: 'ativo' | 'suspenso' | 'inativo'
  page?: number
  limit?: number
}): Promise<{ parceiros: Parceiro[]; total: number }> {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('parceiros')
    .select(
      `
      *,
      organizacao:organizacoes_saas(nome, email_contato, plano, status),
      usuario:usuarios(nome, sobrenome, email),
      indicacoes_parceiro!inner(status)
      `,
      { count: 'estimated' },
    )

  if (params?.status) {
    query = query.eq('status', params.status)
  }

  // Busca por codigo de indicacao (sem join direto com org nesta query)
  if (params?.busca) {
    query = query.ilike('codigo_indicacao', `%${params.busca}%`)
  }

  const { data, error, count } = await query
    .order('criado_em', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Erro ao listar parceiros: ${error.message}`)

  // Enriquecer com contagem de indicados ativos e soma de comissões
  const parceirosIds = (data ?? []).map((p) => p.id)

  let indicadosMap: Record<string, number> = {}
  let comissoesMap: Record<string, number> = {}

  if (parceirosIds.length > 0) {
    const { data: indicados } = await supabase
      .from('indicacoes_parceiro')
      .select('parceiro_id')
      .in('parceiro_id', parceirosIds)
      .eq('status', 'ativa')

    indicadosMap = (indicados ?? []).reduce<Record<string, number>>((acc, i) => {
      acc[i.parceiro_id] = (acc[i.parceiro_id] ?? 0) + 1
      return acc
    }, {})

    const { data: comissoes } = await supabase
      .from('comissoes_parceiro')
      .select('parceiro_id, valor_comissao')
      .in('parceiro_id', parceirosIds)

    comissoesMap = (comissoes ?? []).reduce<Record<string, number>>((acc, c) => {
      acc[c.parceiro_id] = (acc[c.parceiro_id] ?? 0) + Number(c.valor_comissao)
      return acc
    }, {})
  }

  const parceiros = (data ?? []).map((p) => ({
    ...p,
    // Remove o join de indicacoes_parceiro usado só para filtro
    indicacoes_parceiro: undefined,
    total_indicados_ativos: indicadosMap[p.id] ?? 0,
    total_comissoes_geradas: comissoesMap[p.id] ?? 0,
  })) as unknown as Parceiro[]

  return { parceiros, total: count ?? 0 }
}

export async function obterParceiro(id: string): Promise<Parceiro> {
  const { data, error } = await supabase
    .from('parceiros')
    .select(
      `
      *,
      organizacao:organizacoes_saas(nome, email_contato, plano, status),
      usuario:usuarios(nome, sobrenome, email)
      `,
    )
    .eq('id', id)
    .single()

  if (error) throw new Error(`Parceiro não encontrado: ${error.message}`)

  // Contar indicados ativos
  const { count: indicadosAtivos } = await supabase
    .from('indicacoes_parceiro')
    .select('*', { count: 'exact', head: true })
    .eq('parceiro_id', id)
    .eq('status', 'ativa')

  // Somar comissões geradas
  const { data: comissoes } = await supabase
    .from('comissoes_parceiro')
    .select('valor_comissao')
    .eq('parceiro_id', id)

  const totalComissoes = (comissoes ?? []).reduce(
    (acc, c) => acc + Number(c.valor_comissao),
    0,
  )

  return {
    ...data,
    total_indicados_ativos: indicadosAtivos ?? 0,
    total_comissoes_geradas: totalComissoes,
  } as Parceiro
}

// AIDEV-NOTE: Gera codigo RENOVE-XXXXXX com retry para colisao de UNIQUE constraint
async function gerarCodigoIndicacao(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let tentativas = 0

  while (tentativas < 3) {
    const random = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('')
    const codigo = `RENOVE-${random}`

    const { data } = await supabase
      .from('parceiros')
      .select('id')
      .eq('codigo_indicacao', codigo)
      .maybeSingle()

    if (!data) return codigo
    tentativas++
  }

  throw new Error('Não foi possível gerar um código único. Tente novamente.')
}

export async function criarParceiro(payload: CriarParceiroData): Promise<Parceiro> {
  // Verificar se org já é parceira
  const { data: parceiroExistente } = await supabase
    .from('parceiros')
    .select('id')
    .eq('organizacao_id', payload.organizacao_id)
    .maybeSingle()

  if (parceiroExistente) {
    throw new Error('Esta organização já possui um parceiro cadastrado.')
  }

  // Verificar se usuário já é parceiro em outra org
  const { data: usuarioExistente } = await supabase
    .from('parceiros')
    .select('id')
    .eq('usuario_id', payload.usuario_id)
    .maybeSingle()

  if (usuarioExistente) {
    throw new Error('Este usuário já é parceiro em outra organização.')
  }

  const codigoIndicacao = await gerarCodigoIndicacao()

  const { data, error } = await supabase
    .from('parceiros')
    .insert({
      organizacao_id: payload.organizacao_id,
      usuario_id: payload.usuario_id,
      codigo_indicacao: codigoIndicacao,
      percentual_comissao: payload.percentual_comissao ?? null,
      status: 'ativo',
    })
    .select(
      `
      *,
      organizacao:organizacoes_saas(nome, email_contato, plano, status),
      usuario:usuarios(nome, sobrenome, email)
      `,
    )
    .single()

  if (error) throw new Error(`Erro ao cadastrar parceiro: ${error.message}`)
  return data as Parceiro
}

export async function atualizarParceiro(
  id: string,
  data: AtualizarParceiroData,
): Promise<Parceiro> {
  const updates: Record<string, unknown> = {
    ...data,
    atualizado_em: new Date().toISOString(),
  }

  // AIDEV-NOTE: Ao suspender, registrar data; ao reativar, limpar data de suspensao
  if (data.status === 'suspenso') {
    updates.suspenso_em = new Date().toISOString()
  } else if (data.status === 'ativo') {
    updates.suspenso_em = null
    updates.motivo_suspensao = null
  }

  const { data: atualizado, error } = await supabase
    .from('parceiros')
    .update(updates)
    .eq('id', id)
    .select(
      `
      *,
      organizacao:organizacoes_saas(nome, email_contato, plano, status),
      usuario:usuarios(nome, sobrenome, email)
      `,
    )
    .single()

  if (error) throw new Error(`Erro ao atualizar parceiro: ${error.message}`)
  return atualizado as Parceiro
}

export async function aplicarGratuidade(
  payload: AplicarGratuidadeData,
): Promise<Parceiro> {
  const { data, error } = await supabase
    .from('parceiros')
    .update({
      gratuidade_aplicada_em: new Date().toISOString(),
      gratuidade_valida_ate: payload.gratuidade_valida_ate,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', payload.parceiro_id)
    .select(
      `
      *,
      organizacao:organizacoes_saas(nome, email_contato, plano, status),
      usuario:usuarios(nome, sobrenome, email)
      `,
    )
    .single()

  if (error) throw new Error(`Erro ao aplicar gratuidade: ${error.message}`)
  return data as Parceiro
}

// ─────────────────────────────────────────────────────────────────────────────
// INDICAÇÕES
// ─────────────────────────────────────────────────────────────────────────────

export async function listarIndicacoesParceiro(
  parceiroId: string,
): Promise<IndicacaoParceiro[]> {
  const { data, error } = await supabase
    .from('indicacoes_parceiro')
    .select(
      `
      *,
      organizacao:organizacoes_saas(nome, plano, status, criado_em)
      `,
    )
    .eq('parceiro_id', parceiroId)
    .order('criado_em', { ascending: false })

  if (error) throw new Error(`Erro ao listar indicações: ${error.message}`)
  return (data ?? []) as unknown as IndicacaoParceiro[]
}

export async function validarCodigoParceiro(codigo: string): Promise<{
  valido: boolean
  parceiro?: { id: string; nome_empresa: string; percentual_comissao: number | null }
}> {
  const { data, error } = await supabase
    .from('parceiros')
    .select(
      `
      id,
      percentual_comissao,
      organizacao:organizacoes_saas(nome)
      `,
    )
    .eq('codigo_indicacao', codigo.toUpperCase())
    .eq('status', 'ativo')
    .maybeSingle()

  if (error || !data) return { valido: false }

  const org = data.organizacao as unknown as { nome: string } | null

  return {
    valido: true,
    parceiro: {
      id: data.id,
      nome_empresa: org?.nome ?? '',
      percentual_comissao: data.percentual_comissao,
    },
  }
}

export async function criarIndicacao(payload: {
  parceiro_id: string
  organizacao_id: string
  percentual_comissao_snapshot: number
  origem: 'link' | 'codigo_manual' | 'pre_cadastro'
}): Promise<IndicacaoParceiro> {
  const { data, error } = await supabase
    .from('indicacoes_parceiro')
    .insert({
      parceiro_id: payload.parceiro_id,
      organizacao_id: payload.organizacao_id,
      percentual_comissao_snapshot: payload.percentual_comissao_snapshot,
      origem: payload.origem,
      status: 'ativa',
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao registrar indicação: ${error.message}`)
  return data as IndicacaoParceiro
}

// ─────────────────────────────────────────────────────────────────────────────
// COMISSÕES
// ─────────────────────────────────────────────────────────────────────────────

export async function listarComissoesParceiro(
  parceiroId: string,
  params?: { page?: number; limit?: number },
): Promise<{ comissoes: ComissaoParceiro[]; total: number }> {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('comissoes_parceiro')
    .select(
      `
      *,
      indicacao:indicacoes_parceiro(
        organizacao_id,
        organizacao:organizacoes_saas(nome)
      )
      `,
      { count: 'exact' },
    )
    .eq('parceiro_id', parceiroId)
    .order('periodo_ano', { ascending: false })
    .order('periodo_mes', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Erro ao listar comissões: ${error.message}`)
  return { comissoes: (data ?? []) as unknown as ComissaoParceiro[], total: count ?? 0 }
}

// AIDEV-NOTE: tabela assinaturas NAO tem campo de valor — JOIN com planos para obter preco
// AIDEV-NOTE: orgs com cortesia=true NAO geram comissao (decisao de negocio confirmada)
// AIDEV-NOTE: UNIQUE(indicacao_id, periodo_mes, periodo_ano) garante idempotencia via ON CONFLICT DO NOTHING
export async function gerarComissoesMes(
  payload: GerarComissoesData,
): Promise<{ geradas: number; ignoradas: number }> {
  // 1. Buscar indicações ativas do(s) parceiro(s)
  let indicacoesQuery = supabase
    .from('indicacoes_parceiro')
    .select('id, parceiro_id, organizacao_id, percentual_comissao_snapshot')
    .eq('status', 'ativa')

  if (payload.parceiro_id) {
    indicacoesQuery = indicacoesQuery.eq('parceiro_id', payload.parceiro_id)
  }

  const { data: indicacoes, error: errIndicacoes } = await indicacoesQuery

  if (errIndicacoes) throw new Error(`Erro ao buscar indicações: ${errIndicacoes.message}`)
  if (!indicacoes || indicacoes.length === 0) return { geradas: 0, ignoradas: 0 }

  let geradas = 0
  let ignoradas = 0

  for (const indicacao of indicacoes) {
    // 2. Buscar assinatura ativa da org indicada (JOIN com planos para obter preço)
    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select(
        `
        id,
        periodo,
        cortesia,
        plano:planos(preco_mensal, preco_anual)
        `,
      )
      .eq('organizacao_id', indicacao.organizacao_id)
      .in('status', ['ativa', 'trial'])
      .not('cortesia', 'eq', true) // orgs em cortesia NAO geram comissao
      .maybeSingle()

    if (!assinatura) {
      ignoradas++
      continue
    }

    const plano = assinatura.plano as unknown as {
      preco_mensal: number
      preco_anual: number
    } | null

    if (!plano) {
      ignoradas++
      continue
    }

    // 3. Calcular valor base (normalizar anual para mensal)
    const valorBase =
      assinatura.periodo === 'anual'
        ? Number(plano.preco_anual) / 12
        : Number(plano.preco_mensal)

    // 4. Calcular comissão
    const valorComissao =
      (valorBase * indicacao.percentual_comissao_snapshot) / 100

    // 5. INSERT com ON CONFLICT DO NOTHING para idempotencia
    const { error: errInsert } = await supabase.from('comissoes_parceiro').insert({
      parceiro_id: indicacao.parceiro_id,
      indicacao_id: indicacao.id,
      periodo_mes: payload.periodo_mes,
      periodo_ano: payload.periodo_ano,
      valor_assinatura: valorBase,
      percentual_aplicado: indicacao.percentual_comissao_snapshot,
      valor_comissao: valorComissao,
      status: 'pendente',
    })

    // Se houve conflito (comissao ja existia), errInsert sera null pois usamos ON CONFLICT DO NOTHING
    // Mas o erro real de BD vai aparecer aqui — distinguir pelo codigo
    if (errInsert) {
      if (errInsert.code === '23505') {
        // UNIQUE violation = comissao ja existia = idempotente
        ignoradas++
      } else {
        throw new Error(`Erro ao gerar comissão: ${errInsert.message}`)
      }
    } else {
      geradas++
    }
  }

  return { geradas, ignoradas }
}

export async function marcarComissaoPaga(comissaoId: string): Promise<ComissaoParceiro> {
  const { data, error } = await supabase
    .from('comissoes_parceiro')
    .update({
      status: 'pago',
      pago_em: new Date().toISOString(),
    })
    .eq('id', comissaoId)
    .select()
    .single()

  if (error) throw new Error(`Erro ao marcar comissão como paga: ${error.message}`)
  return data as ComissaoParceiro
}

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZAÇÕES DISPONÍVEIS (para NovoParceirModal)
// ─────────────────────────────────────────────────────────────────────────────

export async function listarOrganizacoesDisponiveis(
  busca?: string,
): Promise<Array<{ id: string; nome: string; email_contato: string | null; status: string }>> {
  // 1. Buscar IDs de orgs que já são parceiras
  const { data: parceirosExistentes } = await supabase
    .from('parceiros')
    .select('organizacao_id')

  const idsExcluidos = (parceirosExistentes ?? []).map((p) => p.organizacao_id)

  // 2. Buscar orgs ativas que ainda não são parceiras
  let query = supabase
    .from('organizacoes_saas')
    .select('id, nome, email_contato, status')
    .eq('status', 'ativa')
    .order('nome', { ascending: true })
    .limit(30)

  // AIDEV-NOTE: Evitar NOT IN vazio que gera SQL inválido
  if (idsExcluidos.length > 0) {
    query = query.not('id', 'in', `(${idsExcluidos.join(',')})`)
  }

  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,email_contato.ilike.%${busca}%`)
  }

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar organizações: ${error.message}`)
  return (data ?? []) as Array<{ id: string; nome: string; email_contato: string | null; status: string }>
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG DO PROGRAMA
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG_DEFAULT: Omit<ConfigProgramaParceiro, 'id'> = {
  percentual_padrao: 10,
  regras_gratuidade: { ativo: false },
  base_url_indicacao: null,
  observacoes: null,
}

export async function obterConfigPrograma(): Promise<ConfigProgramaParceiro> {
  const { data, error } = await supabase
    .from('config_programa_parceiros')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Erro ao obter configuração: ${error.message}`)

  if (!data) {
    // Retornar config default se ainda não existe registro
    return { id: '', ...CONFIG_DEFAULT } as ConfigProgramaParceiro
  }

  return data as ConfigProgramaParceiro
}

export async function atualizarConfigPrograma(
  data: AtualizarConfigProgramaData,
): Promise<ConfigProgramaParceiro> {
  // Verificar se já existe registro
  const { data: existente } = await supabase
    .from('config_programa_parceiros')
    .select('id')
    .limit(1)
    .maybeSingle()

  let result

  if (existente?.id) {
    // UPDATE
    const { data: atualizado, error } = await supabase
      .from('config_programa_parceiros')
      .update({
        ...data,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', existente.id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao salvar configuração: ${error.message}`)
    result = atualizado
  } else {
    // INSERT (primeiro registro)
    const { data: criado, error } = await supabase
      .from('config_programa_parceiros')
      .insert(data)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar configuração: ${error.message}`)
    result = criado
  }

  return result as ConfigProgramaParceiro
}
