import { supabaseAdmin } from '../config/supabase.js'
import { logger } from '../utils/logger.js'
import type { CriarPlano, AtualizarPlano, DefinirModulosPlano } from '../schemas/admin.js'

/**
 * AIDEV-NOTE: Service para gestao de planos
 * Conforme PRD-14 - Painel Super Admin
 */

interface Plano {
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
  criado_em: string
}

interface PlanoComModulos extends Plano {
  modulos: Array<{
    id: string
    slug: string
    nome: string
    configuracoes: Record<string, unknown>
  }>
}

class PlanoService {
  /**
   * Lista todos os planos
   */
  async listar(): Promise<Plano[]> {
    const { data, error } = await supabaseAdmin
      .from('planos')
      .select('*')
      .order('ordem', { ascending: true })

    if (error) {
      logger.error('Erro ao listar planos:', error)
      throw new Error('Erro ao listar planos')
    }

    return data || []
  }

  /**
   * Obtem detalhes de um plano com modulos
   */
  async obter(id: string): Promise<PlanoComModulos> {
    const { data: plano, error } = await supabaseAdmin
      .from('planos')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !plano) {
      throw new Error('Plano nao encontrado')
    }

    // Buscar modulos vinculados
    const { data: modulosVinculados } = await supabaseAdmin
      .from('planos_modulos')
      .select(`
        configuracoes,
        modulos:modulo_id (id, slug, nome)
      `)
      .eq('plano_id', id)

    const modulos = (modulosVinculados || []).map((pm) => {
      // AIDEV-NOTE: Supabase pode retornar array ou objeto dependendo da relacao
      const moduloData = Array.isArray(pm.modulos) ? pm.modulos[0] : pm.modulos
      return {
        ...(moduloData as { id: string; slug: string; nome: string }),
        configuracoes: (pm.configuracoes as Record<string, unknown>) || {},
      }
    })

    return { ...plano, modulos }
  }

  /**
   * Cria novo plano
   */
  async criar(dados: CriarPlano, superAdminId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('planos')
      .insert(dados)
      .select('id')
      .single()

    if (error || !data) {
      logger.error('Erro ao criar plano:', error)
      throw new Error('Erro ao criar plano')
    }

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      acao: 'criar_plano',
      entidade: 'planos',
      entidade_id: data.id,
      dados_novos: dados,
    })

    logger.info(`Plano criado: ${data.id} por Super Admin ${superAdminId}`)
    return data.id
  }

  /**
   * Atualiza plano
   */
  async atualizar(id: string, dados: AtualizarPlano, superAdminId: string): Promise<void> {
    // Buscar dados atuais para audit
    const { data: planoAtual } = await supabaseAdmin
      .from('planos')
      .select('*')
      .eq('id', id)
      .single()

    if (!planoAtual) {
      throw new Error('Plano nao encontrado')
    }

    const { error } = await supabaseAdmin
      .from('planos')
      .update({
        ...dados,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      logger.error('Erro ao atualizar plano:', error)
      throw new Error('Erro ao atualizar plano')
    }

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      acao: 'atualizar_plano',
      entidade: 'planos',
      entidade_id: id,
      dados_antigos: planoAtual,
      dados_novos: dados,
    })

    logger.info(`Plano atualizado: ${id} por Super Admin ${superAdminId}`)
  }

  /**
   * Define modulos de um plano
   */
  async definirModulos(planoId: string, dados: DefinirModulosPlano, superAdminId: string): Promise<void> {
    // Remover vinculos existentes
    await supabaseAdmin
      .from('planos_modulos')
      .delete()
      .eq('plano_id', planoId)

    // Criar novos vinculos
    if (dados.modulos.length > 0) {
      const { error } = await supabaseAdmin
        .from('planos_modulos')
        .insert(
          dados.modulos.map((m) => ({
            plano_id: planoId,
            modulo_id: m.modulo_id,
            configuracoes: m.configuracoes || {},
          }))
        )

      if (error) {
        logger.error('Erro ao vincular modulos:', error)
        throw new Error('Erro ao vincular modulos ao plano')
      }
    }

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      acao: 'definir_modulos_plano',
      entidade: 'planos',
      entidade_id: planoId,
      dados_novos: dados,
    })

    logger.info(`Modulos do plano ${planoId} atualizados por Super Admin ${superAdminId}`)
  }

  /**
   * Lista modulos disponiveis
   */
  async listarModulos() {
    const { data, error } = await supabaseAdmin
      .from('modulos')
      .select('*')
      .order('ordem', { ascending: true })

    if (error) {
      logger.error('Erro ao listar modulos:', error)
      throw new Error('Erro ao listar modulos')
    }

    return data || []
  }

  /**
   * Obtem modulos de uma organizacao
   */
  async obterModulosOrganizacao(orgId: string) {
    const { data, error } = await supabaseAdmin
      .from('organizacoes_modulos')
      .select(`
        id,
        ativo,
        ordem,
        configuracoes,
        modulos:modulo_id (id, slug, nome, descricao, icone, obrigatorio, requer)
      `)
      .eq('organizacao_id', orgId)
      .order('ordem', { ascending: true })

    if (error) {
      logger.error('Erro ao obter modulos da organizacao:', error)
      throw new Error('Erro ao obter modulos')
    }

    return (data || []).map((om) => {
      // AIDEV-NOTE: Supabase pode retornar array ou objeto dependendo da relacao
      const moduloData = Array.isArray(om.modulos) ? om.modulos[0] : om.modulos
      return {
        ...(moduloData as {
          id: string
          slug: string
          nome: string
          descricao: string
          icone: string
          obrigatorio: boolean
          requer: string[]
        }),
        ativo: om.ativo,
        ordem: om.ordem,
        configuracoes: om.configuracoes,
      }
    })
  }

  /**
   * Atualiza modulos de uma organizacao
   */
  async atualizarModulosOrganizacao(
    orgId: string,
    modulos: Array<{ modulo_id: string; ativo: boolean; ordem?: number; configuracoes?: Record<string, unknown> }>,
    superAdminId: string
  ): Promise<void> {
    // Validar dependencias
    const { data: todosModulos } = await supabaseAdmin
      .from('modulos')
      .select('id, slug, obrigatorio, requer')

    const modulosMap = new Map((todosModulos || []).map((m) => [m.id, m]))
    const modulosAtivos = new Set(modulos.filter((m) => m.ativo).map((m) => m.modulo_id))

    for (const m of modulos) {
      if (m.ativo) {
        const modulo = modulosMap.get(m.modulo_id)
        if (modulo?.requer) {
          for (const reqSlug of modulo.requer) {
            const reqModulo = todosModulos?.find((mod) => mod.slug === reqSlug)
            if (reqModulo && !modulosAtivos.has(reqModulo.id)) {
              throw new Error(`Modulo ${modulo.slug} requer ${reqSlug}`)
            }
          }
        }
      }
    }

    // Verificar modulos obrigatorios
    for (const [id, modulo] of modulosMap) {
      if (modulo.obrigatorio && !modulosAtivos.has(id)) {
        throw new Error(`Modulo ${modulo.slug} e obrigatorio`)
      }
    }

    // Atualizar cada modulo
    for (const m of modulos) {
      await supabaseAdmin
        .from('organizacoes_modulos')
        .upsert({
          organizacao_id: orgId,
          modulo_id: m.modulo_id,
          ativo: m.ativo,
          ordem: m.ordem ?? 0,
          configuracoes: m.configuracoes || {},
          atualizado_em: new Date().toISOString(),
        }, {
          onConflict: 'organizacao_id,modulo_id',
        })
    }

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      organizacao_id: orgId,
      acao: 'atualizar_modulos_organizacao',
      entidade: 'organizacoes_modulos',
      entidade_id: orgId,
      dados_novos: { modulos },
    })

    logger.info(`Modulos da organizacao ${orgId} atualizados por Super Admin ${superAdminId}`)
  }
}

export const planoService = new PlanoService()
