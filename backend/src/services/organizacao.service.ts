import { supabaseAdmin } from '../config/supabase.js'
import { logger } from '../utils/logger.js'
import type {
  CriarOrganizacao,
  AtualizarOrganizacao,
  ListarOrganizacoesQuery,
} from '../schemas/admin.js'

/**
 * AIDEV-NOTE: Service para gestao de organizacoes (tenants)
 * Conforme PRD-14 - Painel Super Admin
 *
 * Responsabilidades:
 * - CRUD de organizacoes
 * - Wizard de criacao (3 etapas)
 * - Suspensao/reativacao
 * - Impersonacao
 */

interface OrganizacaoComAdmin {
  id: string
  nome: string
  segmento: string
  email: string
  website: string | null
  telefone: string | null
  status: string
  plano_id: string | null
  criado_em: string
  admin?: {
    id: string
    nome: string
    sobrenome: string
    email: string
    status: string
    ultimo_login: string | null
  }
  plano?: {
    id: string
    nome: string
  }
}

interface ListagemResult {
  organizacoes: OrganizacaoComAdmin[]
  total: number
  pagina: number
  limite: number
  total_paginas: number
}

class OrganizacaoService {
  /**
   * Lista organizacoes com filtros e paginacao
   */
  async listar(query: ListarOrganizacoesQuery): Promise<ListagemResult> {
    const { page, limit, busca, status, plano, segmento, ordenar_por, ordem } = query
    const offset = (page - 1) * limit

    // Query base
    let queryBuilder = supabaseAdmin
      .from('organizacoes_saas')
      .select(`
        id,
        nome,
        segmento,
        email,
        website,
        telefone,
        status,
        plano_id,
        criado_em,
        planos:plano_id (id, nome)
      `, { count: 'exact' })

    // Filtros
    if (busca) {
      queryBuilder = queryBuilder.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`)
    }

    if (status && status !== 'todas') {
      queryBuilder = queryBuilder.eq('status', status)
    }

    if (plano) {
      queryBuilder = queryBuilder.eq('plano_id', plano)
    }

    if (segmento) {
      queryBuilder = queryBuilder.eq('segmento', segmento)
    }

    // Ordenacao
    queryBuilder = queryBuilder.order(ordenar_por, { ascending: ordem === 'asc' })

    // Paginacao
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data: organizacoes, error, count } = await queryBuilder

    if (error) {
      logger.error('Erro ao listar organizacoes:', error)
      throw new Error('Erro ao listar organizacoes')
    }

    // Buscar admins de cada organizacao
    const orgsComAdmin = await Promise.all(
      (organizacoes || []).map(async (org) => {
        const { data: admin } = await supabaseAdmin
          .from('usuarios')
          .select('id, nome, sobrenome, email, status, ultimo_login')
          .eq('organizacao_id', org.id)
          .eq('role', 'admin')
          .single()

        // AIDEV-NOTE: Supabase pode retornar array ou objeto dependendo da relacao
        const planoData = Array.isArray(org.planos) ? org.planos[0] : org.planos
        return {
          ...org,
          admin: admin || undefined,
          plano: planoData as { id: string; nome: string } | undefined,
        } as OrganizacaoComAdmin
      })
    )

    return {
      organizacoes: orgsComAdmin,
      total: count || 0,
      pagina: page,
      limite: limit,
      total_paginas: Math.ceil((count || 0) / limit),
    }
  }

  /**
   * Obtem detalhes de uma organizacao
   */
  async obter(id: string): Promise<OrganizacaoComAdmin> {
    const { data: org, error } = await supabaseAdmin
      .from('organizacoes_saas')
      .select(`
        *,
        planos:plano_id (id, nome, preco_mensal, limite_usuarios, limite_oportunidades, limite_storage_mb)
      `)
      .eq('id', id)
      .single()

    if (error || !org) {
      throw new Error('Organizacao nao encontrada')
    }

    // Buscar admin
    const { data: admin } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, sobrenome, email, status, ultimo_login')
      .eq('organizacao_id', id)
      .eq('role', 'admin')
      .single()

    return {
      ...org,
      admin: admin || undefined,
      plano: org.planos as { id: string; nome: string } | undefined,
    }
  }

  /**
   * Cria nova organizacao (wizard completo)
   */
  async criar(dados: CriarOrganizacao, superAdminId: string): Promise<{ organizacao_id: string; admin_id: string }> {
    // 1. Verificar se email do admin ja existe
    const { data: emailExiste } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', dados.admin_email)
      .single()

    if (emailExiste) {
      throw new Error('Email do administrador ja esta em uso')
    }

    // 2. Buscar plano Trial padrao
    const { data: planoTrial } = await supabaseAdmin
      .from('planos')
      .select('id')
      .eq('nome', 'Trial')
      .single()

    // 3. Criar organizacao
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizacoes_saas')
      .insert({
        nome: dados.nome,
        segmento: dados.segmento,
        email: dados.email,
        website: dados.website || null,
        telefone: dados.telefone || null,
        endereco: dados.endereco || null,
        plano_id: planoTrial?.id || null,
        status: 'trial',
      })
      .select('id')
      .single()

    if (orgError || !org) {
      logger.error('Erro ao criar organizacao:', orgError)
      throw new Error('Erro ao criar organizacao')
    }

    // 4. Salvar expectativas
    await supabaseAdmin
      .from('organizacoes_expectativas')
      .insert({
        organizacao_id: org.id,
        numero_usuarios: dados.numero_usuarios,
        volume_leads_mes: dados.volume_leads_mes,
        principal_objetivo: dados.principal_objetivo,
        como_conheceu: dados.como_conheceu || null,
        observacoes: dados.observacoes || null,
      })

    // 5. Criar usuario Admin no Supabase Auth
    let authUserId: string

    if (dados.enviar_convite) {
      // Criar usuario e enviar convite por email
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        dados.admin_email,
        {
          data: {
            nome: dados.admin_nome,
            sobrenome: dados.admin_sobrenome,
            role: 'admin',
            tenant_id: org.id,
          },
          redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`,
        }
      )

      if (authError || !authUser.user) {
        // Rollback: deletar organizacao
        await supabaseAdmin.from('organizacoes_saas').delete().eq('id', org.id)
        logger.error('Erro ao criar usuario no Auth:', authError)
        throw new Error('Erro ao enviar convite para o administrador')
      }

      authUserId = authUser.user.id
    } else {
      // Criar usuario com senha
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: dados.admin_email,
        password: dados.senha_inicial!,
        email_confirm: true,
        user_metadata: {
          nome: dados.admin_nome,
          sobrenome: dados.admin_sobrenome,
          role: 'admin',
          tenant_id: org.id,
        },
      })

      if (authError || !authUser.user) {
        // Rollback: deletar organizacao
        await supabaseAdmin.from('organizacoes_saas').delete().eq('id', org.id)
        logger.error('Erro ao criar usuario no Auth:', authError)
        throw new Error('Erro ao criar administrador')
      }

      authUserId = authUser.user.id
    }

    // 6. Criar registro na tabela usuarios (trigger pode ter criado, verificar)
    const { data: usuarioExiste } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('auth_id', authUserId)
      .single()

    let adminId: string

    if (usuarioExiste) {
      // Atualizar com dados da organizacao
      await supabaseAdmin
        .from('usuarios')
        .update({
          organizacao_id: org.id,
          nome: dados.admin_nome,
          sobrenome: dados.admin_sobrenome,
          telefone: dados.admin_telefone || null,
          role: 'admin',
        })
        .eq('auth_id', authUserId)

      adminId = usuarioExiste.id
    } else {
      // Criar manualmente
      const { data: novoUsuario, error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          auth_id: authUserId,
          organizacao_id: org.id,
          nome: dados.admin_nome,
          sobrenome: dados.admin_sobrenome,
          email: dados.admin_email,
          telefone: dados.admin_telefone || null,
          role: 'admin',
          status: dados.enviar_convite ? 'pendente' : 'ativo',
          email_verificado: !dados.enviar_convite,
        })
        .select('id')
        .single()

      if (usuarioError || !novoUsuario) {
        logger.error('Erro ao criar usuario:', usuarioError)
        throw new Error('Erro ao criar administrador')
      }

      adminId = novoUsuario.id
    }

    // 7. Ativar modulos do plano
    if (planoTrial?.id) {
      const { data: modulosPlano } = await supabaseAdmin
        .from('planos_modulos')
        .select('modulo_id, configuracoes')
        .eq('plano_id', planoTrial.id)

      if (modulosPlano && modulosPlano.length > 0) {
        await supabaseAdmin
          .from('organizacoes_modulos')
          .insert(
            modulosPlano.map((pm, idx) => ({
              organizacao_id: org.id,
              modulo_id: pm.modulo_id,
              ativo: true,
              ordem: idx,
              configuracoes: pm.configuracoes || {},
            }))
          )
      }
    }

    // 8. Registrar no audit log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      acao: 'criar_organizacao',
      entidade: 'organizacoes_saas',
      entidade_id: org.id,
      dados_novos: {
        nome: dados.nome,
        admin_email: dados.admin_email,
        plano: 'Trial',
      },
    })

    logger.info(`Organizacao criada: ${org.id} por Super Admin ${superAdminId}`)

    return {
      organizacao_id: org.id,
      admin_id: adminId,
    }
  }

  /**
   * Atualiza organizacao
   */
  async atualizar(id: string, dados: AtualizarOrganizacao, superAdminId: string): Promise<void> {
    // Buscar dados atuais para audit
    const { data: orgAtual } = await supabaseAdmin
      .from('organizacoes_saas')
      .select('*')
      .eq('id', id)
      .single()

    if (!orgAtual) {
      throw new Error('Organizacao nao encontrada')
    }

    const { error } = await supabaseAdmin
      .from('organizacoes_saas')
      .update({
        ...dados,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      logger.error('Erro ao atualizar organizacao:', error)
      throw new Error('Erro ao atualizar organizacao')
    }

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      acao: 'atualizar_organizacao',
      entidade: 'organizacoes_saas',
      entidade_id: id,
      dados_antigos: orgAtual,
      dados_novos: dados,
    })

    logger.info(`Organizacao atualizada: ${id} por Super Admin ${superAdminId}`)
  }

  /**
   * Suspende organizacao
   */
  async suspender(id: string, motivo: string, superAdminId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('organizacoes_saas')
      .update({
        status: 'suspensa',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new Error('Erro ao suspender organizacao')
    }

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      acao: 'suspender_organizacao',
      entidade: 'organizacoes_saas',
      entidade_id: id,
      dados_novos: { motivo },
    })

    logger.info(`Organizacao suspensa: ${id} por Super Admin ${superAdminId}. Motivo: ${motivo}`)
  }

  /**
   * Reativa organizacao
   */
  async reativar(id: string, superAdminId: string): Promise<void> {
    // Verificar status atual
    const { data: org } = await supabaseAdmin
      .from('organizacoes_saas')
      .select('status')
      .eq('id', id)
      .single()

    if (!org) {
      throw new Error('Organizacao nao encontrada')
    }

    const novoStatus = org.status === 'trial' ? 'trial' : 'ativa'

    const { error } = await supabaseAdmin
      .from('organizacoes_saas')
      .update({
        status: novoStatus,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new Error('Erro ao reativar organizacao')
    }

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      acao: 'reativar_organizacao',
      entidade: 'organizacoes_saas',
      entidade_id: id,
    })

    logger.info(`Organizacao reativada: ${id} por Super Admin ${superAdminId}`)
  }

  /**
   * Lista usuarios de uma organizacao
   */
  async listarUsuarios(orgId: string) {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, sobrenome, email, role, status, ultimo_login, criado_em')
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)
      .order('role', { ascending: true })
      .order('nome', { ascending: true })

    if (error) {
      throw new Error('Erro ao listar usuarios')
    }

    // Separar admin e members
    const admin = data?.find(u => u.role === 'admin')
    const members = data?.filter(u => u.role === 'member') || []

    return { admin, members, total: members.length }
  }

  /**
   * Obtem limites de uso da organizacao
   */
  async obterLimites(orgId: string) {
    // Buscar organizacao com plano
    const { data: org } = await supabaseAdmin
      .from('organizacoes_saas')
      .select(`
        id,
        planos:plano_id (
          limite_usuarios,
          limite_oportunidades,
          limite_storage_mb,
          limite_contatos
        )
      `)
      .eq('id', orgId)
      .single()

    if (!org) {
      throw new Error('Organizacao nao encontrada')
    }

    // Supabase pode retornar array ou objeto para relacoes 1:1
    const planosData = org.planos
    const plano = (Array.isArray(planosData) ? planosData[0] : planosData) as {
      limite_usuarios: number
      limite_oportunidades: number | null
      limite_storage_mb: number
      limite_contatos: number | null
    } | null

    // Contar usuarios
    const { count: totalUsuarios } = await supabaseAdmin
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)

    // Contar oportunidades (tabela sera criada no PRD-07)
    // Por enquanto retorna 0
    const totalOportunidades = 0

    // Storage (placeholder - sera implementado depois)
    const storageUsadoMb = 0

    // Contar contatos (tabela sera criada no PRD-06)
    const totalContatos = 0

    return {
      usuarios: {
        usado: totalUsuarios || 0,
        limite: plano?.limite_usuarios || 2,
        percentual: plano ? ((totalUsuarios || 0) / plano.limite_usuarios) * 100 : 0,
      },
      oportunidades: {
        usado: totalOportunidades,
        limite: plano?.limite_oportunidades || null,
        percentual: plano?.limite_oportunidades
          ? (totalOportunidades / plano.limite_oportunidades) * 100
          : null,
      },
      storage: {
        usado_mb: storageUsadoMb,
        limite_mb: plano?.limite_storage_mb || 100,
        percentual: plano ? (storageUsadoMb / plano.limite_storage_mb) * 100 : 0,
      },
      contatos: {
        usado: totalContatos,
        limite: plano?.limite_contatos || null,
        percentual: plano?.limite_contatos
          ? (totalContatos / plano.limite_contatos) * 100
          : null,
      },
    }
  }
}

export const organizacaoService = new OrganizacaoService()
