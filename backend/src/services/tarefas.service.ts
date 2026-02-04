/**
 * AIDEV-NOTE: Service para o modulo de Tarefas (PRD-10)
 *
 * Regras de Visibilidade CRITICAS:
 * - Admin: Ve todas tarefas do tenant, pode filtrar por responsavel
 * - Member: Ve APENAS suas proprias tarefas (owner_id = user_id)
 * - Todas tarefas retornadas devem ter oportunidade_id NOT NULL
 *
 * Super Admin NAO usa este modulo (gerencia plataforma, nao vendas)
 */

import { supabaseAdmin as supabase } from '../config/supabase'
import type {
  Tarefa,
  TarefaComDetalhes,
  ListarTarefasQuery,
  ListarTarefasResponse,
  TarefasMetricasFiltros,
  TarefasMetricas,
  CriarTarefa,
  AtualizarTarefa,
} from '../schemas/tarefas'

// =====================================================
// Service
// =====================================================

class TarefasService {
  /**
   * Lista tarefas com filtros e paginacao
   * AIDEV-NOTE: Aplica filtro automatico por owner_id para Member
   */
  async listar(
    organizacaoId: string,
    usuarioId: string,
    role: string,
    filtros: ListarTarefasQuery
  ): Promise<ListarTarefasResponse> {
    const {
      pipeline_id,
      etapa_id,
      status,
      prioridade,
      owner_id,
      data_inicio,
      data_fim,
      busca,
      page,
      limit,
      order_by,
      order_dir,
    } = filtros

    // AIDEV-NOTE: Query base com joins para dados da oportunidade e owner
    let query = supabase
      .from('tarefas')
      .select(`
        *,
        oportunidades (
          id,
          codigo,
          titulo,
          funil_id,
          etapa_id,
          funis (id, nome),
          etapas_funil (id, nome)
        ),
        owner:usuarios!owner_id (id, nome, email),
        criado_por:usuarios!criado_por_id (id, nome, email)
      `, { count: 'exact' })
      .eq('organizacao_id', organizacaoId)
      .not('oportunidade_id', 'is', null) // PRD-10: Apenas tarefas com oportunidade
      .is('deletado_em', null)

    // AIDEV-NOTE: REGRA CRITICA - Member ve apenas suas proprias tarefas
    if (role === 'member') {
      query = query.eq('owner_id', usuarioId)
    } else if (owner_id) {
      // Admin pode filtrar por responsavel
      query = query.eq('owner_id', owner_id)
    }

    // Filtro por pipeline (via oportunidade)
    if (pipeline_id) {
      query = query.eq('oportunidades.funil_id', pipeline_id)
    }

    // Filtro por etapa (via oportunidade)
    if (etapa_id) {
      query = query.eq('oportunidades.etapa_id', etapa_id)
    }

    // Filtro por status
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status]
      query = query.in('status', statusArray)
    }

    // Filtro por prioridade
    if (prioridade) {
      const prioridadeArray = Array.isArray(prioridade) ? prioridade : [prioridade]
      query = query.in('prioridade', prioridadeArray)
    }

    // Filtro por periodo (data de vencimento)
    if (data_inicio) {
      query = query.gte('data_vencimento', data_inicio)
    }
    if (data_fim) {
      query = query.lte('data_vencimento', data_fim)
    }

    // Busca por titulo
    if (busca) {
      query = query.ilike('titulo', `%${busca}%`)
    }

    // Ordenacao
    const ascending = order_dir === 'asc'
    query = query.order(order_by, { ascending, nullsFirst: false })

    // Paginacao
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao listar tarefas: ${error.message}`)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      data: (data || []) as TarefaComDetalhes[],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    }
  }

  /**
   * Obtem metricas agregadas de tarefas
   * AIDEV-NOTE: Aplica filtro automatico por owner_id para Member
   */
  async obterMetricas(
    organizacaoId: string,
    usuarioId: string,
    role: string,
    filtros: TarefasMetricasFiltros
  ): Promise<TarefasMetricas> {
    const { pipeline_id, etapa_id, owner_id, data_inicio, data_fim } = filtros

    // Para metricas, fazemos queries separadas para cada metrica

    // Base filter
    const baseFilter = {
      organizacao_id: organizacaoId,
      ...(role === 'member' ? { owner_id: usuarioId } : owner_id ? { owner_id } : {}),
    }

    // 1. Em aberto (pendente ou em_andamento)
    const { count: emAberto } = await supabase
      .from('tarefas')
      .select('*', { count: 'exact', head: true })
      .eq('organizacao_id', organizacaoId)
      .not('oportunidade_id', 'is', null)
      .is('deletado_em', null)
      .in('status', ['pendente', 'em_andamento'])
      .match(role === 'member' ? { owner_id: usuarioId } : owner_id ? { owner_id } : {})

    // 2. Atrasadas (pendente e data_vencimento < now)
    const { count: atrasadas } = await supabase
      .from('tarefas')
      .select('*', { count: 'exact', head: true })
      .eq('organizacao_id', organizacaoId)
      .not('oportunidade_id', 'is', null)
      .is('deletado_em', null)
      .eq('status', 'pendente')
      .lt('data_vencimento', new Date().toISOString())
      .match(role === 'member' ? { owner_id: usuarioId } : owner_id ? { owner_id } : {})

    // 3. Concluidas (no periodo, se especificado)
    let concluidasQuery = supabase
      .from('tarefas')
      .select('*', { count: 'exact', head: true })
      .eq('organizacao_id', organizacaoId)
      .not('oportunidade_id', 'is', null)
      .is('deletado_em', null)
      .eq('status', 'concluida')
      .match(role === 'member' ? { owner_id: usuarioId } : owner_id ? { owner_id } : {})

    if (data_inicio) {
      concluidasQuery = concluidasQuery.gte('data_conclusao', data_inicio)
    }
    if (data_fim) {
      concluidasQuery = concluidasQuery.lte('data_conclusao', data_fim)
    }

    const { count: concluidas } = await concluidasQuery

    // 4. Tempo medio de conclusao (em dias)
    // AIDEV-NOTE: Calcula media de (data_conclusao - criado_em) para tarefas concluidas
    const { data: tempoMedioData } = await supabase
      .rpc('calcular_tempo_medio_tarefas', {
        p_organizacao_id: organizacaoId,
        p_owner_id: role === 'member' ? usuarioId : owner_id || null,
      })

    let tempoMedioDias: number | null = null
    if (tempoMedioData && typeof tempoMedioData === 'number') {
      tempoMedioDias = Math.round(tempoMedioData * 100) / 100
    } else {
      // Fallback: calcular manualmente se a funcao RPC nao existir
      const { data: tarefasConcluidas } = await supabase
        .from('tarefas')
        .select('criado_em, data_conclusao')
        .eq('organizacao_id', organizacaoId)
        .not('oportunidade_id', 'is', null)
        .is('deletado_em', null)
        .eq('status', 'concluida')
        .not('data_conclusao', 'is', null)
        .match(role === 'member' ? { owner_id: usuarioId } : owner_id ? { owner_id } : {})
        .limit(1000) // Limitar para performance

      if (tarefasConcluidas && tarefasConcluidas.length > 0) {
        const totalDias = tarefasConcluidas.reduce((acc, t) => {
          const criado = new Date(t.criado_em).getTime()
          const concluido = new Date(t.data_conclusao!).getTime()
          const diffDias = (concluido - criado) / (1000 * 60 * 60 * 24)
          return acc + diffDias
        }, 0)
        tempoMedioDias = Math.round((totalDias / tarefasConcluidas.length) * 100) / 100
      }
    }

    return {
      em_aberto: emAberto || 0,
      atrasadas: atrasadas || 0,
      concluidas: concluidas || 0,
      tempo_medio_dias: tempoMedioDias,
    }
  }

  /**
   * Marca tarefa como concluida
   * AIDEV-NOTE: Valida permissao - Member so pode concluir suas proprias tarefas
   */
  async concluir(
    tarefaId: string,
    organizacaoId: string,
    usuarioId: string,
    role: string,
    observacao?: string
  ): Promise<Tarefa> {
    // Busca tarefa
    const { data: tarefa, error: fetchError } = await supabase
      .from('tarefas')
      .select('*')
      .eq('id', tarefaId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (fetchError || !tarefa) {
      throw new Error('Tarefa nao encontrada')
    }

    // AIDEV-NOTE: REGRA CRITICA - Member so pode concluir suas proprias tarefas
    if (role === 'member' && tarefa.owner_id !== usuarioId) {
      throw new Error('Voce nao tem permissao para concluir esta tarefa')
    }

    // Verifica se ja esta concluida ou cancelada
    if (tarefa.status === 'concluida') {
      throw new Error('Esta tarefa ja foi concluida')
    }
    if (tarefa.status === 'cancelada') {
      throw new Error('Nao e possivel concluir uma tarefa cancelada')
    }

    // Prepara dados de atualizacao
    const updateData: Partial<Tarefa> = {
      status: 'concluida',
      data_conclusao: new Date().toISOString(),
    }

    // Adiciona observacao a descricao se fornecida
    if (observacao) {
      const descricaoAtual = tarefa.descricao || ''
      const separator = descricaoAtual ? '\n\n---\n\n' : ''
      updateData.descricao = `${descricaoAtual}${separator}[Conclusao] ${observacao}`
    }

    // Atualiza tarefa
    const { data: tarefaAtualizada, error: updateError } = await supabase
      .from('tarefas')
      .update(updateData)
      .eq('id', tarefaId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Erro ao concluir tarefa: ${updateError.message}`)
    }

    return tarefaAtualizada as Tarefa
  }

  /**
   * Busca tarefa por ID
   */
  async buscarPorId(
    tarefaId: string,
    organizacaoId: string,
    usuarioId: string,
    role: string
  ): Promise<TarefaComDetalhes | null> {
    let query = supabase
      .from('tarefas')
      .select(`
        *,
        oportunidades (
          id,
          codigo,
          titulo,
          funil_id,
          etapa_id,
          funis (id, nome),
          etapas_funil (id, nome)
        ),
        owner:usuarios!owner_id (id, nome, email),
        criado_por:usuarios!criado_por_id (id, nome, email)
      `)
      .eq('id', tarefaId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)

    // Member so pode ver suas proprias tarefas
    if (role === 'member') {
      query = query.eq('owner_id', usuarioId)
    }

    const { data, error } = await query.single()

    if (error) {
      return null
    }

    return data as TarefaComDetalhes
  }

  /**
   * Cria uma nova tarefa (uso interno - PRD-07)
   * AIDEV-NOTE: Chamado quando oportunidade entra em etapa com template
   */
  async criar(
    organizacaoId: string,
    criadorId: string,
    dados: CriarTarefa
  ): Promise<Tarefa> {
    const { data, error } = await supabase
      .from('tarefas')
      .insert({
        organizacao_id: organizacaoId,
        criado_por_id: criadorId,
        ...dados,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar tarefa: ${error.message}`)
    }

    return data as Tarefa
  }

  /**
   * Atualiza uma tarefa (uso interno)
   */
  async atualizar(
    tarefaId: string,
    organizacaoId: string,
    usuarioId: string,
    role: string,
    dados: AtualizarTarefa
  ): Promise<Tarefa> {
    // Busca tarefa para validar permissao
    const { data: tarefa, error: fetchError } = await supabase
      .from('tarefas')
      .select('*')
      .eq('id', tarefaId)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (fetchError || !tarefa) {
      throw new Error('Tarefa nao encontrada')
    }

    // Member so pode atualizar suas proprias tarefas
    if (role === 'member' && tarefa.owner_id !== usuarioId) {
      throw new Error('Voce nao tem permissao para atualizar esta tarefa')
    }

    const { data, error } = await supabase
      .from('tarefas')
      .update(dados)
      .eq('id', tarefaId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar tarefa: ${error.message}`)
    }

    return data as Tarefa
  }

  /**
   * Cria tarefas a partir de templates quando oportunidade entra em etapa
   * AIDEV-NOTE: Usado pelo servico de oportunidades (PRD-07)
   */
  async criarTarefasDeTemplates(
    organizacaoId: string,
    oportunidadeId: string,
    etapaId: string,
    ownerId: string,
    criadorId: string
  ): Promise<Tarefa[]> {
    // Busca templates vinculados a etapa
    const { data: vinculacoes, error: vinculacoesError } = await supabase
      .from('funis_etapas_tarefas')
      .select(`
        *,
        tarefas_templates (*)
      `)
      .eq('etapa_id', etapaId)
      .is('deletado_em', null)

    if (vinculacoesError) {
      console.error('Erro ao buscar templates de tarefas:', vinculacoesError)
      return []
    }

    if (!vinculacoes || vinculacoes.length === 0) {
      return []
    }

    const tarefasCriadas: Tarefa[] = []

    for (const vinculo of vinculacoes) {
      const template = vinculo.tarefas_templates

      if (!template || !template.ativo) {
        continue
      }

      // Calcula data de vencimento baseada em dias_prazo do template
      let dataVencimento: string | undefined
      if (template.dias_prazo) {
        const data = new Date()
        data.setDate(data.getDate() + template.dias_prazo)
        dataVencimento = data.toISOString()
      }

      try {
        const tarefa = await this.criar(organizacaoId, criadorId, {
          oportunidade_id: oportunidadeId,
          titulo: template.titulo,
          descricao: template.descricao,
          tipo: template.tipo,
          canal: template.canal,
          owner_id: ownerId,
          data_vencimento: dataVencimento,
          prioridade: template.prioridade || 'media',
          tarefa_template_id: template.id,
          etapa_origem_id: etapaId,
        })
        tarefasCriadas.push(tarefa)
      } catch (err) {
        console.error(`Erro ao criar tarefa do template ${template.id}:`, err)
      }
    }

    return tarefasCriadas
  }
}

export default new TarefasService()
