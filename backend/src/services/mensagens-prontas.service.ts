/**
 * AIDEV-NOTE: Service de Mensagens Prontas (PRD-09)
 *
 * Quick replies / templates de resposta rapida
 * Podem ser pessoais (do usuario) ou globais (do tenant)
 */

import { supabaseAdmin as supabase } from '../config/supabase'
import type { UserRole } from '../schemas/common'
import type {
  MensagemPronta,
  ListarMensagensProntasQuery,
  ListarMensagensProntasResponse,
  CriarMensagemPronta,
  AtualizarMensagemPronta,
} from '../schemas/mensagens-prontas'

class MensagensProntasService {
  // =====================================================
  // Listagem
  // =====================================================

  /**
   * Lista mensagens prontas (pessoais + globais)
   */
  async listar(
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    filtros: ListarMensagensProntasQuery
  ): Promise<ListarMensagensProntasResponse> {
    const { page, limit, tipo, ativo, busca } = filtros
    const offset = (page - 1) * limit

    let query = supabase
      .from('mensagens_prontas')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)

    // Filtro por tipo
    if (tipo) {
      query = query.eq('tipo', tipo)
    } else {
      // Se nao filtrar por tipo, retorna globais + pessoais do usuario
      query = query.or(`tipo.eq.global,and(tipo.eq.pessoal,usuario_id.eq.${usuarioId})`)
    }

    // Filtro por ativo
    if (ativo !== undefined) {
      query = query.eq('ativo', ativo)
    }

    // Busca por atalho ou titulo
    if (busca) {
      query = query.or(`atalho.ilike.%${busca}%,titulo.ilike.%${busca}%`)
    }

    // Ordenacao e paginacao
    query = query
      .order('vezes_usado', { ascending: false })
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao listar mensagens prontas: ${error.message}`)
    }

    return {
      mensagens_prontas: (data || []) as MensagemPronta[],
      total: count || 0,
      page,
      limit,
    }
  }

  /**
   * Busca mensagem pronta pelo atalho
   */
  async buscarPorAtalho(
    organizacaoId: string,
    usuarioId: string,
    atalho: string
  ): Promise<MensagemPronta | null> {
    // Primeiro tenta encontrar pessoal do usuario
    const { data: pessoal } = await supabase
      .from('mensagens_prontas')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('atalho', atalho)
      .eq('tipo', 'pessoal')
      .eq('ativo', true)
      .is('deletado_em', null)
      .single()

    if (pessoal) {
      return pessoal as MensagemPronta
    }

    // Se nao encontrar, tenta global
    const { data: global } = await supabase
      .from('mensagens_prontas')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('atalho', atalho)
      .eq('tipo', 'global')
      .eq('ativo', true)
      .is('deletado_em', null)
      .single()

    return global as MensagemPronta | null
  }

  /**
   * Busca mensagem pronta por ID
   */
  async buscarPorId(
    id: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole
  ): Promise<MensagemPronta | null> {
    let query = supabase
      .from('mensagens_prontas')
      .select('*')
      .eq('id', id)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)

    // Member so ve suas proprias mensagens pessoais ou globais
    if (role === 'member') {
      query = query.or(`tipo.eq.global,and(tipo.eq.pessoal,usuario_id.eq.${usuarioId})`)
    }

    const { data, error } = await query.single()

    if (error) {
      return null
    }

    return data as MensagemPronta
  }

  // =====================================================
  // CRUD
  // =====================================================

  /**
   * Cria nova mensagem pronta
   */
  async criar(
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    dados: CriarMensagemPronta
  ): Promise<MensagemPronta> {
    // Member so pode criar pessoal
    const tipo = role === 'member' ? 'pessoal' : dados.tipo

    // Verifica unicidade do atalho
    const { data: existente } = await supabase
      .from('mensagens_prontas')
      .select('id')
      .eq('organizacao_id', organizacaoId)
      .eq('atalho', dados.atalho)
      .is('deletado_em', null)
      .or(
        tipo === 'pessoal'
          ? `and(tipo.eq.pessoal,usuario_id.eq.${usuarioId})`
          : 'tipo.eq.global'
      )
      .single()

    if (existente) {
      throw new Error('Ja existe uma mensagem pronta com este atalho')
    }

    const { data, error } = await supabase
      .from('mensagens_prontas')
      .insert({
        organizacao_id: organizacaoId,
        usuario_id: tipo === 'pessoal' ? usuarioId : null,
        atalho: dados.atalho,
        titulo: dados.titulo,
        conteudo: dados.conteudo,
        tipo,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar mensagem pronta: ${error.message}`)
    }

    return data as MensagemPronta
  }

  /**
   * Atualiza mensagem pronta
   */
  async atualizar(
    id: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    dados: AtualizarMensagemPronta
  ): Promise<MensagemPronta> {
    // Verifica se existe e tem permissao
    const existente = await this.buscarPorId(id, organizacaoId, usuarioId, role)

    if (!existente) {
      throw new Error('Mensagem pronta nao encontrada ou sem permissao')
    }

    // Member so pode editar suas proprias pessoais
    if (role === 'member' && (existente.tipo !== 'pessoal' || existente.usuario_id !== usuarioId)) {
      throw new Error('Sem permissao para editar esta mensagem pronta')
    }

    // Se estiver alterando o atalho, verifica unicidade
    if (dados.atalho && dados.atalho !== existente.atalho) {
      const { data: conflito } = await supabase
        .from('mensagens_prontas')
        .select('id')
        .eq('organizacao_id', organizacaoId)
        .eq('atalho', dados.atalho)
        .neq('id', id)
        .is('deletado_em', null)
        .or(
          existente.tipo === 'pessoal'
            ? `and(tipo.eq.pessoal,usuario_id.eq.${usuarioId})`
            : 'tipo.eq.global'
        )
        .single()

      if (conflito) {
        throw new Error('Ja existe uma mensagem pronta com este atalho')
      }
    }

    const { data, error } = await supabase
      .from('mensagens_prontas')
      .update({
        atalho: dados.atalho,
        titulo: dados.titulo,
        conteudo: dados.conteudo,
        ativo: dados.ativo,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar mensagem pronta: ${error.message}`)
    }

    return data as MensagemPronta
  }

  /**
   * Exclui mensagem pronta (soft delete)
   */
  async excluir(
    id: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole
  ): Promise<void> {
    // Verifica se existe e tem permissao
    const existente = await this.buscarPorId(id, organizacaoId, usuarioId, role)

    if (!existente) {
      throw new Error('Mensagem pronta nao encontrada ou sem permissao')
    }

    // Member so pode excluir suas proprias pessoais
    if (role === 'member' && (existente.tipo !== 'pessoal' || existente.usuario_id !== usuarioId)) {
      throw new Error('Sem permissao para excluir esta mensagem pronta')
    }

    const { error } = await supabase
      .from('mensagens_prontas')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir mensagem pronta: ${error.message}`)
    }
  }

  // =====================================================
  // Utilitarios
  // =====================================================

  /**
   * Incrementa contador de uso
   */
  async incrementarUso(id: string): Promise<void> {
    await supabase.rpc('increment_vezes_usado', { mensagem_pronta_id: id })
  }
}

export default new MensagensProntasService()
