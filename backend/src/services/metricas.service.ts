import { supabaseAdmin } from '../config/supabase.js'
import { logger } from '../utils/logger.js'

/**
 * AIDEV-NOTE: Service para metricas da plataforma
 * Conforme PRD-14 - Painel Super Admin
 *
 * Fornece metricas agregadas para o dashboard do Super Admin
 */

interface MetricasResumo {
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
    variacao_mrr: number // percentual vs mes anterior
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

interface MetricasTenant {
  organizacao_id: string
  nome: string
  receita: {
    valor_vendas: number
    mrr: number
    ticket_medio: number
  }
  quantidade: {
    vendas_fechadas: number
    novos_negocios: number
    taxa_conversao: number
  }
  atividades: {
    reunioes_realizadas: number
    ligacoes_feitas: number
    emails_enviados: number
    tarefas_concluidas: number
  }
  leads: {
    novos_contatos: number
    mqls_gerados: number
    sqls_gerados: number
  }
  tempo: {
    tempo_medio_fechamento_dias: number
    velocidade_pipeline_dia: number
  }
}

class MetricasService {
  /**
   * Obtem resumo geral da plataforma
   */
  async obterResumo(periodo: '7d' | '30d' | '90d' | '12m' = '30d'): Promise<MetricasResumo> {
    const agora = new Date()
    const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : periodo === '90d' ? 90 : 365

    const dataInicio = new Date(agora)
    dataInicio.setDate(dataInicio.getDate() - dias)

    const data7d = new Date(agora)
    data7d.setDate(data7d.getDate() - 7)

    const data30d = new Date(agora)
    data30d.setDate(data30d.getDate() - 30)

    // Total de tenants por status
    const { data: tenantsStatus, error: tenantsError } = await supabaseAdmin
      .from('organizacoes_saas')
      .select('status')

    if (tenantsError) {
      logger.error('Erro ao buscar tenants:', tenantsError)
    }

    const tenants = tenantsStatus || []
    const totalTenants = tenants.length
    const tenantsPorStatus = tenants.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Novos tenants nos ultimos 7 e 30 dias
    const { count: novos7d } = await supabaseAdmin
      .from('organizacoes_saas')
      .select('*', { count: 'exact', head: true })
      .gte('criado_em', data7d.toISOString())

    const { count: novos30d } = await supabaseAdmin
      .from('organizacoes_saas')
      .select('*', { count: 'exact', head: true })
      .gte('criado_em', data30d.toISOString())

    // Total de usuarios
    const { count: totalUsuarios } = await supabaseAdmin
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .is('deletado_em', null)

    // Usuarios ativos hoje (com login nas ultimas 24h)
    const ontem = new Date(agora)
    ontem.setDate(ontem.getDate() - 1)

    const { count: ativosHoje } = await supabaseAdmin
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .gte('ultimo_login', ontem.toISOString())

    // Usuarios ativos nos ultimos 7 dias
    const { count: ativos7d } = await supabaseAdmin
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .gte('ultimo_login', data7d.toISOString())

    // MRR (baseado nos planos ativos)
    const { data: assinaturas } = await supabaseAdmin
      .from('assinaturas')
      .select(`
        planos:plano_id (preco_mensal)
      `)
      .eq('status', 'ativo')

    const mrr = (assinaturas || []).reduce((total, a) => {
      // AIDEV-NOTE: Supabase pode retornar array ou objeto dependendo da relacao
      const planoData = Array.isArray(a.planos) ? a.planos[0] : a.planos
      const plano = planoData as { preco_mensal: number } | null
      return total + (plano?.preco_mensal || 0)
    }, 0)

    // Distribuicao por plano
    const { data: distribuicao } = await supabaseAdmin
      .from('organizacoes_saas')
      .select(`
        planos:plano_id (nome)
      `)
      .not('plano_id', 'is', null)

    const planoCount: Record<string, number> = {}
    for (const org of distribuicao || []) {
      // AIDEV-NOTE: Supabase pode retornar array ou objeto dependendo da relacao
      const planoData = Array.isArray(org.planos) ? org.planos[0] : org.planos
      const plano = planoData as { nome: string } | null
      const nome = plano?.nome || 'Sem plano'
      planoCount[nome] = (planoCount[nome] || 0) + 1
    }

    const distribuicaoPlanos = Object.entries(planoCount).map(([plano, quantidade]) => ({
      plano,
      quantidade,
      percentual: totalTenants > 0 ? (quantidade / totalTenants) * 100 : 0,
    }))

    // Alertas
    const alertas: MetricasResumo['alertas'] = []

    // Trials expirando em 3 dias
    const dataExpiracao = new Date(agora)
    dataExpiracao.setDate(dataExpiracao.getDate() + 3)

    const { count: trialsExpirando } = await supabaseAdmin
      .from('assinaturas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'trial')
      .lte('trial_fim', dataExpiracao.toISOString())
      .gte('trial_fim', agora.toISOString())

    if (trialsExpirando && trialsExpirando > 0) {
      alertas.push({
        tipo: 'warning',
        mensagem: `${trialsExpirando} tenants com trial expirando em 3 dias`,
        quantidade: trialsExpirando,
      })
    }

    // Pagamentos pendentes
    const { count: pagamentosPendentes } = await supabaseAdmin
      .from('assinaturas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')

    if (pagamentosPendentes && pagamentosPendentes > 0) {
      alertas.push({
        tipo: 'error',
        mensagem: `${pagamentosPendentes} pagamentos falharam - acao necessaria`,
        quantidade: pagamentosPendentes,
      })
    }

    // Novos tenants aguardando primeiro login
    const { count: semLogin } = await supabaseAdmin
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')
      .is('ultimo_login', null)
      .gte('criado_em', data30d.toISOString())

    if (semLogin && semLogin > 0) {
      alertas.push({
        tipo: 'info',
        mensagem: `${semLogin} novos tenants aguardando primeiro login`,
        quantidade: semLogin,
      })
    }

    return {
      tenants: {
        total: totalTenants,
        ativos: tenantsPorStatus['ativa'] || 0,
        trial: tenantsPorStatus['trial'] || 0,
        suspensos: tenantsPorStatus['suspensa'] || 0,
        novos_7d: novos7d || 0,
        novos_30d: novos30d || 0,
      },
      usuarios: {
        total: totalUsuarios || 0,
        ativos_hoje: ativosHoje || 0,
        ativos_7d: ativos7d || 0,
      },
      financeiro: {
        mrr,
        variacao_mrr: 0, // Calcular comparando com mes anterior
      },
      distribuicao_planos: distribuicaoPlanos,
      alertas,
    }
  }

  /**
   * Obtem metricas de um tenant especifico
   * NOTA: Metricas completas serao implementadas quando PRD-06 e PRD-07 estiverem prontos
   */
  async obterMetricasTenant(
    orgId: string,
    periodo: { inicio: Date; fim: Date }
  ): Promise<MetricasTenant> {
    // Buscar organizacao
    const { data: org, error } = await supabaseAdmin
      .from('organizacoes_saas')
      .select('id, nome')
      .eq('id', orgId)
      .single()

    if (error || !org) {
      throw new Error('Organizacao nao encontrada')
    }

    // Por enquanto, retorna valores zerados
    // Sera implementado quando tabelas de contatos, oportunidades, tarefas existirem

    return {
      organizacao_id: org.id,
      nome: org.nome,
      receita: {
        valor_vendas: 0,
        mrr: 0,
        ticket_medio: 0,
      },
      quantidade: {
        vendas_fechadas: 0,
        novos_negocios: 0,
        taxa_conversao: 0,
      },
      atividades: {
        reunioes_realizadas: 0,
        ligacoes_feitas: 0,
        emails_enviados: 0,
        tarefas_concluidas: 0,
      },
      leads: {
        novos_contatos: 0,
        mqls_gerados: 0,
        sqls_gerados: 0,
      },
      tempo: {
        tempo_medio_fechamento_dias: 0,
        velocidade_pipeline_dia: 0,
      },
    }
  }

  /**
   * Obtem evolucao de metricas ao longo do tempo
   */
  async obterEvolucao(
    orgId: string,
    metrica: 'vendas' | 'leads' | 'mrr',
    meses: number = 6
  ): Promise<Array<{ mes: string; valor: number }>> {
    const resultado: Array<{ mes: string; valor: number }> = []
    const agora = new Date()

    for (let i = meses - 1; i >= 0; i--) {
      const data = new Date(agora)
      data.setMonth(data.getMonth() - i)

      const mes = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

      // Por enquanto retorna valores placeholder
      // Sera implementado quando tabelas de dados existirem
      resultado.push({
        mes,
        valor: 0,
      })
    }

    return resultado
  }

  /**
   * Obtem metricas financeiras agregadas
   */
  async obterFinanceiro(periodo: '7d' | '30d' | '90d' | '12m' = '30d') {
    const agora = new Date()
    const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : periodo === '90d' ? 90 : 365

    const dataInicio = new Date(agora)
    dataInicio.setDate(dataInicio.getDate() - dias)

    const mesAnteriorInicio = new Date(dataInicio)
    mesAnteriorInicio.setMonth(mesAnteriorInicio.getMonth() - 1)

    // MRR atual
    const { data: assinaturasAtuais } = await supabaseAdmin
      .from('assinaturas')
      .select(`
        planos:plano_id (preco_mensal)
      `)
      .eq('status', 'ativo')

    const mrrAtual = (assinaturasAtuais || []).reduce((total, a) => {
      // AIDEV-NOTE: Supabase pode retornar array ou objeto dependendo da relacao
      const planoData = Array.isArray(a.planos) ? a.planos[0] : a.planos
      const plano = planoData as { preco_mensal: number } | null
      return total + (plano?.preco_mensal || 0)
    }, 0)

    // Churn (assinaturas canceladas no periodo)
    const { count: cancelados } = await supabaseAdmin
      .from('assinaturas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelado')
      .gte('cancelado_em', dataInicio.toISOString())

    // Total de assinaturas no inicio do periodo (aproximacao)
    const { count: totalInicio } = await supabaseAdmin
      .from('assinaturas')
      .select('*', { count: 'exact', head: true })
      .lte('criado_em', dataInicio.toISOString())
      .or('status.eq.ativo,status.eq.cancelado')

    const churnRate = totalInicio && totalInicio > 0
      ? ((cancelados || 0) / totalInicio) * 100
      : 0

    // Novos clientes pagantes no periodo
    const { count: novosClientes } = await supabaseAdmin
      .from('assinaturas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo')
      .gte('criado_em', dataInicio.toISOString())

    return {
      mrr: mrrAtual,
      churn_rate: Number(churnRate.toFixed(2)),
      novos_clientes: novosClientes || 0,
      cancelamentos: cancelados || 0,
    }
  }
}

export const metricasService = new MetricasService()
