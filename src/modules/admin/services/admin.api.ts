import { supabase } from '@/lib/supabase'
import type { Json } from '@/integrations/supabase/types'

/**
 * AIDEV-NOTE: API client para Super Admin - Supabase direto
 * Migrado de axios/Express para queries Supabase
 * Conforme PRD-14 - Painel Super Admin
 */

// =======================
// TIPOS
// =======================

export interface Organizacao {
  id: string
  nome: string
  segmento: string | null
  email: string
  website: string | null
  telefone: string | null
  status: 'ativa' | 'suspensa' | 'trial' | 'cancelada'
  plano: string // Nome do plano (não é FK)
  criado_em: string
  cortesia?: boolean
  cortesia_motivo?: string | null
  admin?: {
    id: string
    nome: string
    sobrenome: string | null
    email: string
    status: string
    ultimo_login: string | null
  }
}

export interface ListaOrganizacoesResponse {
  organizacoes: Organizacao[]
  total: number
  pagina: number
  limite: number
  total_paginas: number
}

export interface CriarOrganizacaoPayload {
  nome: string
  segmento: string
  segmento_outro?: string
  email?: string
  website?: string
  telefone?: string
  endereco?: {
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
  }
  plano_id: string
  cortesia?: boolean
  cortesia_motivo?: string
  admin_nome: string
  admin_sobrenome: string
  admin_email: string
  admin_telefone?: string
  enviar_convite: boolean
  senha_inicial?: string
}

export interface Plano {
  id: string
  nome: string
  descricao: string | null
  preco_mensal: number
  preco_anual: number | null
  moeda: string
  limite_usuarios: number
  limite_oportunidades: number | null
  limite_storage_mb: number
  limite_contatos: number | null
  stripe_price_id_mensal: string | null
  stripe_price_id_anual: string | null
  ativo: boolean
  visivel: boolean
  ordem: number
  popular: boolean
}

export interface Modulo {
  id: string
  slug: string
  nome: string
  descricao: string
  icone: string
  obrigatorio: boolean
  ordem: number
  requer: string[]
  ativo?: boolean
  configuracoes?: Record<string, unknown>
}

export interface ConfigGlobal {
  id: string
  plataforma: string
  configuracoes: Record<string, unknown>
  configurado: boolean
  ultimo_teste: string | null
  ultimo_erro: string | null
}

export interface MetricasResumo {
  tenants: {
    total: number
    ativos: number
    trial: number
    suspensos: number
    novos_7d: number
    novos_30d: number
  }
  usuarios: {
    total: number
    ativos_hoje: number
    ativos_7d: number
  }
  financeiro: {
    mrr: number
    variacao_mrr: number
  }
  distribuicao_planos: Array<{
    plano: string
    quantidade: number
    percentual: number
  }>
  alertas: Array<{
    tipo: 'warning' | 'info' | 'error'
    mensagem: string
    quantidade: number
  }>
}

export interface LimitesUso {
  usuarios: { usado: number; limite: number | null; percentual: number | null }
  oportunidades: { usado: number; limite: number | null; percentual: number | null }
  storage: { usado_mb: number; limite_mb: number | null; percentual: number | null }
  contatos: { usado: number; limite: number | null; percentual: number | null }
}

// =======================
// ORGANIZACOES
// =======================

export async function listarOrganizacoes(params?: {
  page?: number
  limit?: number
  busca?: string
  status?: string
  plano?: string
  segmento?: string
}): Promise<ListaOrganizacoesResponse> {
  const page = params?.page || 1
  const limit = params?.limit || 10
  const offset = (page - 1) * limit

   // Query otimizada com JOIN para evitar N+1
   let query = supabase
    .from('organizacoes_saas')
     .select(`
       *,
       admin:usuarios(
         id, nome, sobrenome, email, status, ultimo_login, role
       ),
       assinaturas(
         cortesia, cortesia_motivo, status
       )
     `, { count: 'exact' })
    .is('deletado_em', null)
    .order('criado_em', { ascending: false })

  // Filtros
  if (params?.status && params.status !== 'todas') {
    query = query.eq('status', params.status)
  }
  if (params?.busca) {
    query = query.or(`nome.ilike.%${params.busca}%,email.ilike.%${params.busca}%`)
  }
  if (params?.segmento) {
    query = query.eq('segmento', params.segmento)
  }
  if (params?.plano) {
    query = query.eq('plano', params.plano)
  }

  // Paginação
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Erro ao listar organizações:', error)
    throw new Error(error.message)
  }

   // Mapear dados e filtrar admin (role = 'admin') no cliente
   const organizacoes: Organizacao[] = (data || []).map((org) => {
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const adminUser = (org.admin as any[])?.find((u: any) => u.role === 'admin')
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const assinaturaAtiva = (org.assinaturas as any[])?.find((a: any) => a.status === 'ativa') || (org.assinaturas as any[])?.[0]
     return {
       id: org.id,
       nome: org.nome,
       segmento: org.segmento,
       email: org.email,
       website: org.website,
       telefone: org.telefone,
       status: org.status as Organizacao['status'],
       plano: org.plano,
       criado_em: org.criado_em,
       cortesia: assinaturaAtiva?.cortesia ?? false,
       cortesia_motivo: assinaturaAtiva?.cortesia_motivo ?? null,
       admin: adminUser ? {
         id: adminUser.id,
         nome: adminUser.nome,
         sobrenome: adminUser.sobrenome,
         email: adminUser.email,
         status: adminUser.status,
         ultimo_login: adminUser.ultimo_login,
       } : undefined,
     }
   })

  return {
    organizacoes,
    total: count || 0,
    pagina: page,
    limite: limit,
    total_paginas: Math.ceil((count || 0) / limit),
  }
}

export async function obterOrganizacao(id: string): Promise<Organizacao> {
  const { data, error } = await supabase
    .from('organizacoes_saas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  // Buscar assinatura ativa para dados de cortesia
  const { data: assinaturaData } = await supabase
    .from('assinaturas')
    .select('cortesia, cortesia_motivo, status')
    .eq('organizacao_id', id)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Buscar admin
  const { data: adminData } = await supabase
    .from('usuarios')
    .select('id, nome, sobrenome, email, status, ultimo_login')
    .eq('organizacao_id', id)
    .eq('role', 'admin')
    .maybeSingle()

  return {
    id: data.id,
    nome: data.nome,
    segmento: data.segmento,
    email: data.email,
    website: data.website,
    telefone: data.telefone,
    status: data.status as Organizacao['status'],
    plano: data.plano,
    criado_em: data.criado_em,
    cortesia: assinaturaData?.cortesia ?? false,
    cortesia_motivo: assinaturaData?.cortesia_motivo ?? null,
    admin: adminData ? {
      id: adminData.id,
      nome: adminData.nome,
      sobrenome: adminData.sobrenome,
      email: adminData.email,
      status: adminData.status,
      ultimo_login: adminData.ultimo_login,
    } : undefined,
  }
}

export async function criarOrganizacao(payload: CriarOrganizacaoPayload): Promise<{ organizacao_id: string; admin_id: string }> {
  // Buscar dados do plano selecionado
  const { data: plano, error: planoError } = await supabase
    .from('planos')
    .select('nome, limite_usuarios, limite_oportunidades, limite_storage_mb')
    .eq('id', payload.plano_id)
    .single()

  if (planoError || !plano) {
    throw new Error('Plano não encontrado')
  }

  const planoNome = plano.nome.toLowerCase()
  const isTrial = planoNome === 'trial'

  // Criar organização com dados do plano
  const { data: org, error: orgError } = await supabase
    .from('organizacoes_saas')
    .insert([{
      nome: payload.nome,
      slug: payload.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      segmento: payload.segmento === 'outro' ? payload.segmento_outro : payload.segmento,
      email: payload.email || 'sem-email@placeholder.local',
      website: payload.website ?? null,
      telefone: payload.telefone ?? null,
      plano: planoNome,
      status: isTrial ? 'trial' : 'ativo',
      limite_usuarios: plano.limite_usuarios,
      limite_oportunidades: plano.limite_oportunidades,
      limite_storage_mb: plano.limite_storage_mb,
      endereco_cep: payload.endereco?.cep ?? null,
      endereco_logradouro: payload.endereco?.logradouro ?? null,
      endereco_numero: payload.endereco?.numero ?? null,
      endereco_complemento: payload.endereco?.complemento ?? null,
      endereco_bairro: payload.endereco?.bairro ?? null,
      endereco_cidade: payload.endereco?.cidade ?? null,
      endereco_estado: payload.endereco?.estado ?? null,
    }])
    .select()
    .single()

  if (orgError) throw new Error(orgError.message)

  // Criar usuário admin na tabela usuarios (sem auth.users por enquanto - apenas registro local)
  const { data: adminUser, error: adminError } = await supabase
    .from('usuarios')
    .insert([{
      organizacao_id: org.id,
      nome: payload.admin_nome,
      sobrenome: payload.admin_sobrenome,
      email: payload.admin_email,
      telefone: payload.admin_telefone ?? null,
      role: 'admin',
      status: 'pendente', // Pendente até confirmação de email/convite
    }])
    .select()
    .single()

  if (adminError) {
    // Rollback: deletar organização criada
    await supabase.from('organizacoes_saas').delete().eq('id', org.id)
    throw new Error(`Erro ao criar admin: ${adminError.message}`)
  }

  // Criar assinatura vinculada
  const agora = new Date()
  const { error: assinaturaError } = await supabase
    .from('assinaturas')
    .insert([{
      organizacao_id: org.id,
      plano_id: payload.plano_id,
      status: isTrial ? 'trial' : 'ativo',
      periodo: 'mensal',
      inicio_em: agora.toISOString(),
      cortesia: payload.cortesia ?? false,
      cortesia_motivo: payload.cortesia ? payload.cortesia_motivo : null,
      trial_inicio: isTrial ? agora.toISOString() : null,
      trial_fim: isTrial 
        ? new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() 
        : null,
    }])

  if (assinaturaError) {
    // Rollback: deletar admin e organização
    await supabase.from('usuarios').delete().eq('id', adminUser.id)
    await supabase.from('organizacoes_saas').delete().eq('id', org.id)
    throw new Error(`Erro ao criar assinatura: ${assinaturaError.message}`)
  }

  // Se enviar_convite = true, chamar edge function para criar auth user e enviar email
  if (payload.enviar_convite) {
    try {
      const session = await supabase.auth.getSession()
      const accessToken = session.data.session?.access_token

      const response = await fetch(
        'https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/invite-admin',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email: payload.admin_email,
            nome: payload.admin_nome,
            sobrenome: payload.admin_sobrenome,
            usuario_id: adminUser.id,
            organizacao_id: org.id,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.warn('Erro ao enviar convite:', errorData)
        // Não aborta a criação, apenas loga o erro
      } else {
        console.log('Convite enviado com sucesso para:', payload.admin_email)
      }
    } catch (error) {
      console.warn('Erro ao chamar edge function de convite:', error)
      // Não aborta a criação
    }
  }

  return {
    organizacao_id: org.id,
    admin_id: adminUser.id,
  }
}

export async function atualizarOrganizacao(id: string, data: Partial<Organizacao>): Promise<void> {
  const updateData: Record<string, unknown> = {}
  
  if (data.nome !== undefined) updateData.nome = data.nome
  if (data.segmento !== undefined) updateData.segmento = data.segmento
  if (data.email !== undefined) updateData.email = data.email
  if (data.website !== undefined) updateData.website = data.website
  if (data.telefone !== undefined) updateData.telefone = data.telefone
  if (data.status !== undefined) updateData.status = data.status
  if (data.plano !== undefined) updateData.plano = data.plano

  const { error } = await supabase
    .from('organizacoes_saas')
    .update(updateData)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function suspenderOrganizacao(id: string, _motivo: string): Promise<void> {
  const { error } = await supabase
    .from('organizacoes_saas')
    .update({ status: 'suspensa' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function reativarOrganizacao(id: string): Promise<void> {
  const { error } = await supabase
    .from('organizacoes_saas')
    .update({ status: 'ativa' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function revogarCortesia(id: string): Promise<void> {
  // Atualiza assinatura: remove cortesia e muda status para bloqueada
  const { error } = await supabase
    .from('assinaturas')
    .update({
      cortesia: false,
      cortesia_motivo: null,
      status: 'bloqueada',
    })
    .eq('organizacao_id', id)

  if (error) throw new Error(error.message)

  // Atualiza status da organização
  const { error: orgError } = await supabase
    .from('organizacoes_saas')
    .update({ status: 'suspensa' })
    .eq('id', id)

  if (orgError) throw new Error(orgError.message)
}

export async function impersonarOrganizacao(id: string, _motivo: string): Promise<{ organizacao_id: string; organizacao_nome: string }> {
  const { data, error } = await supabase
    .from('organizacoes_saas')
    .select('id, nome')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  return {
    organizacao_id: data.id,
    organizacao_nome: data.nome,
  }
}

export async function listarUsuariosOrganizacao(id: string): Promise<{
  admin?: { id: string; nome: string; sobrenome: string | null; email: string; status: string; ultimo_login: string | null }
  members: Array<{ id: string; nome: string; sobrenome: string | null; email: string; status: string; ultimo_login: string | null; criado_em: string }>
  total: number
}> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, sobrenome, email, status, ultimo_login, role, criado_em')
    .eq('organizacao_id', id)
    .is('deletado_em', null)
    .order('criado_em', { ascending: true })

  if (error) throw new Error(error.message)

  const admin = data?.find(u => u.role === 'admin')
  const members = data?.filter(u => u.role !== 'admin') || []

  return {
    admin: admin ? {
      id: admin.id,
      nome: admin.nome,
      sobrenome: admin.sobrenome,
      email: admin.email,
      status: admin.status,
      ultimo_login: admin.ultimo_login,
    } : undefined,
    members: members.map(m => ({
      id: m.id,
      nome: m.nome,
      sobrenome: m.sobrenome,
      email: m.email,
      status: m.status,
      ultimo_login: m.ultimo_login,
      criado_em: m.criado_em,
    })),
    total: data?.length || 0,
  }
}

export async function obterLimitesOrganizacao(id: string): Promise<LimitesUso> {
  // Contar usuários
  const { count: usuariosCount } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', id)
    .is('deletado_em', null)

  // Contar oportunidades
  const { count: opCount } = await supabase
    .from('oportunidades')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', id)
    .is('deletado_em', null)

  // Contar contatos
  const { count: contatosCount } = await supabase
    .from('contatos')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', id)
    .is('deletado_em', null)

  // Buscar limites da organização
  const { data: org } = await supabase
    .from('organizacoes_saas')
    .select('limite_usuarios, limite_oportunidades, limite_storage_mb')
    .eq('id', id)
    .single()

  const limiteUsuarios = org?.limite_usuarios ?? 5
  const limiteOp = org?.limite_oportunidades ?? null
  const limiteStorage = org?.limite_storage_mb ?? 500

  const usadoUsuarios = usuariosCount || 0
  const usadoOp = opCount || 0
  const usadoContatos = contatosCount || 0

  return {
    usuarios: {
      usado: usadoUsuarios,
      limite: limiteUsuarios,
      percentual: limiteUsuarios ? (usadoUsuarios / limiteUsuarios) * 100 : null,
    },
    oportunidades: {
      usado: usadoOp,
      limite: limiteOp,
      percentual: limiteOp ? (usadoOp / limiteOp) * 100 : null,
    },
    storage: {
      usado_mb: 0,
      limite_mb: limiteStorage,
      percentual: limiteStorage ? 0 : null,
    },
    contatos: {
      usado: usadoContatos,
      limite: null,
      percentual: null,
    },
  }
}

export async function obterModulosOrganizacao(id: string): Promise<Modulo[]> {
  const { data, error } = await supabase
    .from('modulos')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) throw new Error(error.message)

  // Buscar módulos ativos para a organização
  const { data: modulosAtivos } = await supabase
    .from('organizacoes_modulos')
    .select('modulo_id, ativo, configuracoes')
    .eq('organizacao_id', id)

  const modulosAtivosMap = new Map(
    (modulosAtivos || []).map(m => [m.modulo_id, { ativo: m.ativo ?? false, configuracoes: m.configuracoes as Record<string, unknown> }])
  )

  return (data || []).map(modulo => ({
    id: modulo.id,
    slug: modulo.slug,
    nome: modulo.nome,
    descricao: modulo.descricao || '',
    icone: modulo.icone || 'puzzle',
    obrigatorio: modulo.obrigatorio || false,
    ordem: modulo.ordem || 0,
    requer: (modulo.requer as string[]) || [],
    ativo: modulosAtivosMap.get(modulo.id)?.ativo ?? (modulo.obrigatorio || false),
    configuracoes: modulosAtivosMap.get(modulo.id)?.configuracoes,
  }))
}

export async function atualizarModulosOrganizacao(
  id: string,
  modulos: Array<{ modulo_id: string; ativo: boolean; ordem?: number }>
): Promise<void> {
  for (const modulo of modulos) {
    const { error } = await supabase
      .from('organizacoes_modulos')
      .upsert({
        organizacao_id: id,
        modulo_id: modulo.modulo_id,
        ativo: modulo.ativo,
        ordem: modulo.ordem,
      }, {
        onConflict: 'organizacao_id,modulo_id',
      })

    if (error) throw new Error(error.message)
  }
}

// =======================
// PLANOS
// =======================

export async function listarPlanos(): Promise<Plano[]> {
  const { data, error } = await supabase
    .from('planos')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(p => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    preco_mensal: p.preco_mensal ?? 0,
    preco_anual: p.preco_anual,
    moeda: p.moeda ?? 'BRL',
    limite_usuarios: p.limite_usuarios,
    limite_oportunidades: p.limite_oportunidades,
    limite_storage_mb: p.limite_storage_mb,
    limite_contatos: p.limite_contatos,
    stripe_price_id_mensal: p.stripe_price_id_mensal,
    stripe_price_id_anual: p.stripe_price_id_anual,
    ativo: p.ativo ?? true,
    visivel: p.visivel ?? true,
    ordem: p.ordem ?? 0,
    popular: p.popular ?? false,
  }))
}

export async function obterPlano(id: string): Promise<Plano & { modulos: Modulo[] }> {
  const { data, error } = await supabase
    .from('planos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  // Buscar módulos do plano
  const { data: modulosData } = await supabase
    .from('planos_modulos')
    .select('modulo_id, configuracoes')
    .eq('plano_id', id)

  const moduloIds = (modulosData || []).map(m => m.modulo_id)

  let modulos: Modulo[] = []
  if (moduloIds.length > 0) {
    const { data: modulosInfo } = await supabase
      .from('modulos')
      .select('*')
      .in('id', moduloIds)

    modulos = (modulosInfo || []).map(m => ({
      id: m.id,
      slug: m.slug,
      nome: m.nome,
      descricao: m.descricao || '',
      icone: m.icone || 'puzzle',
      obrigatorio: m.obrigatorio || false,
      ordem: m.ordem || 0,
      requer: (m.requer as string[]) || [],
    }))
  }

  return {
    id: data.id,
    nome: data.nome,
    descricao: data.descricao,
    preco_mensal: data.preco_mensal ?? 0,
    preco_anual: data.preco_anual,
    moeda: data.moeda ?? 'BRL',
    limite_usuarios: data.limite_usuarios,
    limite_oportunidades: data.limite_oportunidades,
    limite_storage_mb: data.limite_storage_mb,
    limite_contatos: data.limite_contatos,
    stripe_price_id_mensal: data.stripe_price_id_mensal,
    stripe_price_id_anual: data.stripe_price_id_anual,
    ativo: data.ativo ?? true,
    visivel: data.visivel ?? true,
    ordem: data.ordem ?? 0,
    popular: data.popular ?? false,
    modulos,
  }
}

export async function criarPlano(plano: Omit<Plano, 'id'>): Promise<string> {
  const { data, error } = await supabase
    .from('planos')
    .insert({
      nome: plano.nome,
      descricao: plano.descricao,
      preco_mensal: plano.preco_mensal,
      preco_anual: plano.preco_anual,
      moeda: plano.moeda,
      limite_usuarios: plano.limite_usuarios,
      limite_oportunidades: plano.limite_oportunidades,
      limite_storage_mb: plano.limite_storage_mb,
      limite_contatos: plano.limite_contatos,
      stripe_price_id_mensal: plano.stripe_price_id_mensal || null,
      stripe_price_id_anual: plano.stripe_price_id_anual || null,
      ativo: plano.ativo,
      visivel: plano.visivel,
      ordem: plano.ordem,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function atualizarPlano(id: string, plano: Partial<Plano>): Promise<void> {
  const { error } = await supabase
    .from('planos')
    .update(plano)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function excluirPlano(id: string): Promise<void> {
  // Verificar se há organizações usando este plano
  const { count, error: countError } = await supabase
    .from('organizacoes_saas')
    .select('*', { count: 'exact', head: true })
    .eq('plano', id)

  if (countError) throw new Error(countError.message)

  if (count && count > 0) {
    throw new Error(`Não é possível excluir: ${count} organizações usam este plano`)
  }

  // Remover módulos vinculados ao plano
  await supabase.from('planos_modulos').delete().eq('plano_id', id)

  // Excluir o plano
  const { error } = await supabase
    .from('planos')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function definirModulosPlano(
  planoId: string,
  modulos: Array<{ modulo_id: string; configuracoes?: Record<string, unknown> }>
): Promise<void> {
  // Remover módulos existentes
  await supabase.from('planos_modulos').delete().eq('plano_id', planoId)

  // Inserir novos
  if (modulos.length > 0) {
    const { error } = await supabase
      .from('planos_modulos')
      .insert(modulos.map(m => ({
        plano_id: planoId,
        modulo_id: m.modulo_id,
        configuracoes: m.configuracoes as Json,
      })))

    if (error) throw new Error(error.message)
  }
}

// =======================
// MODULOS
// =======================

export async function listarModulos(): Promise<Modulo[]> {
  const { data, error } = await supabase
    .from('modulos')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(m => ({
    id: m.id,
    slug: m.slug,
    nome: m.nome,
    descricao: m.descricao || '',
    icone: m.icone || 'puzzle',
    obrigatorio: m.obrigatorio || false,
    ordem: m.ordem || 0,
    requer: (m.requer as string[]) || [],
  }))
}

// =======================
// CONFIGURACOES GLOBAIS
// =======================

export async function listarConfigGlobais(): Promise<ConfigGlobal[]> {
  const { data, error } = await supabase
    .from('configuracoes_globais')
    .select('*')
    .order('plataforma', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(c => ({
    id: c.id,
    plataforma: c.plataforma,
    configuracoes: c.configuracoes as Record<string, unknown>,
    configurado: c.configurado ?? false,
    ultimo_teste: c.ultimo_teste,
    ultimo_erro: c.ultimo_erro,
  }))
}

export async function obterConfigGlobal(plataforma: string): Promise<ConfigGlobal> {
  const { data, error } = await supabase
    .from('configuracoes_globais')
    .select('*')
    .eq('plataforma', plataforma)
    .single()

  if (error) throw new Error(error.message)
  return {
    id: data.id,
    plataforma: data.plataforma,
    configuracoes: data.configuracoes as Record<string, unknown>,
    configurado: data.configurado ?? false,
    ultimo_teste: data.ultimo_teste,
    ultimo_erro: data.ultimo_erro,
  }
}

export async function atualizarConfigGlobal(plataforma: string, configuracoes: Record<string, unknown>): Promise<void> {
  // Primeiro verifica se existe
  const { data: existing } = await supabase
    .from('configuracoes_globais')
    .select('id')
    .eq('plataforma', plataforma)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('configuracoes_globais')
      .update({
        configuracoes: configuracoes as Json,
        atualizado_em: new Date().toISOString(),
      })
      .eq('plataforma', plataforma)

    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('configuracoes_globais')
      .insert({
        plataforma,
        configuracoes: configuracoes as Json,
      })

    if (error) throw new Error(error.message)
  }
}

export async function testarConfigGlobal(_plataforma: string): Promise<{ sucesso: boolean; mensagem: string }> {
  // TODO: Implementar teste real via edge function
  return { sucesso: true, mensagem: 'Teste simulado com sucesso' }
}

// =======================
// METRICAS
// =======================

 export async function obterMetricasResumo(periodo: '7d' | '30d' | '60d' | '90d' = '30d'): Promise<MetricasResumo> {
   // Calcular data de início baseado no período
   const diasMap: Record<string, number> = { '7d': 7, '30d': 30, '60d': 60, '90d': 90 }
   const dias = diasMap[periodo] || 30
   
   const dataInicio = new Date()
   dataInicio.setDate(dataInicio.getDate() - dias)
   const dataInicioISO = dataInicio.toISOString()
 
   // Contar organizações por status
   const { data: orgs, count: totalOrgs } = await supabase
    .from('organizacoes_saas')
    .select('status', { count: 'exact' })
    .is('deletado_em', null)

  const statusCounts = (orgs || []).reduce((acc, org) => {
    acc[org.status] = (acc[org.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

   // Contar novos no período selecionado
   const { count: novosPeriodo } = await supabase
    .from('organizacoes_saas')
    .select('*', { count: 'exact', head: true })
     .gte('criado_em', dataInicioISO)
    .is('deletado_em', null)

   // Contar usuários (total)
  const { count: totalUsuarios } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })
    .is('deletado_em', null)

   // Distribuição por plano (considerando período)
   const { data: planosList } = await supabase
    .from('organizacoes_saas')
    .select('plano')
    .is('deletado_em', null)
     .gte('criado_em', dataInicioISO)

  const planoCounts = (planosList || []).reduce((acc, org) => {
    const planoNome = org.plano || 'Sem plano'
    acc[planoNome] = (acc[planoNome] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const distribuicao: MetricasResumo['distribuicao_planos'] = Object.entries(planoCounts).map(([plano, quantidade]) => ({
    plano,
    quantidade,
    percentual: totalOrgs ? (quantidade / totalOrgs) * 100 : 0,
  }))

  // Alertas
  const alertas: MetricasResumo['alertas'] = []
  if (statusCounts['suspensa'] > 0) {
    alertas.push({
      tipo: 'warning',
      mensagem: `${statusCounts['suspensa']} organização(ões) suspensa(s)`,
      quantidade: statusCounts['suspensa'],
    })
  }
  if (statusCounts['trial'] > 0) {
    alertas.push({
      tipo: 'info',
      mensagem: `${statusCounts['trial']} organização(ões) em período de trial`,
      quantidade: statusCounts['trial'],
    })
  }

  return {
    tenants: {
      total: totalOrgs || 0,
      ativos: statusCounts['ativa'] || 0,
      trial: statusCounts['trial'] || 0,
      suspensos: statusCounts['suspensa'] || 0,
       novos_7d: novosPeriodo || 0,
       novos_30d: novosPeriodo || 0,
    },
    usuarios: {
      total: totalUsuarios || 0,
      ativos_hoje: 0,
      ativos_7d: 0,
    },
    financeiro: {
      mrr: 0,
      variacao_mrr: 0,
    },
    distribuicao_planos: distribuicao,
    alertas,
  }
}

// Export como objeto para uso com useQuery
export const adminApi = {
  // Organizacoes
  listarOrganizacoes,
  obterOrganizacao,
  criarOrganizacao,
  atualizarOrganizacao,
  suspenderOrganizacao,
  reativarOrganizacao,
  impersonarOrganizacao,
  listarUsuariosOrganizacao,
  obterLimitesOrganizacao,
  obterModulosOrganizacao,
  atualizarModulosOrganizacao,
  // Planos
  listarPlanos,
  obterPlano,
  criarPlano,
  atualizarPlano,
  excluirPlano,
  definirModulosPlano,
  // Modulos
  listarModulos,
  // Config Global
  listarConfigGlobais,
  obterConfigGlobal,
  atualizarConfigGlobal,
  testarConfigGlobal,
  // Metricas
  obterMetricasResumo,
}
