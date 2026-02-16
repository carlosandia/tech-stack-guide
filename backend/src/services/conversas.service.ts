/**
 * AIDEV-NOTE: Service do modulo de Conversas (PRD-09)
 *
 * Regras de Visibilidade:
 * - Super Admin: NAO acessa este modulo
 * - Admin: Ve todas conversas do tenant
 * - Member: Ve apenas suas proprias conversas (usuario_id = user_id)
 */

import { supabaseAdmin as supabase } from '../config/supabase'
import type { UserRole } from '../schemas/common'
import type {
  Conversa,
  ConversaComContato,
  ListarConversasQuery,
  ListarConversasResponse,
  CriarConversa,
  AlterarStatusConversa,
  BuscarOuCriarConversa,
  StatusConversa,
} from '../schemas/conversas'

class ConversasService {
  // =====================================================
  // Listagem
  // =====================================================

  /**
   * Lista conversas com filtros e paginacao
   */
  async listar(
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    filtros: ListarConversasQuery
  ): Promise<ListarConversasResponse> {
    const { canal, status, busca, page, limit, order_by, order_dir } = filtros
    const offset = (page - 1) * limit

    // Query base
    let query = supabase
      .from('conversas')
      .select(`
        *,
        contato:contatos(id, nome, email, telefone, foto_url)
      `, { count: 'exact' })
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .neq('tipo', 'canal') // AIDEV-NOTE: Excluir conversas de canal (@newsletter)

    // AIDEV-NOTE: Member ve apenas suas proprias conversas
    if (role === 'member') {
      query = query.eq('usuario_id', usuarioId)
    }

    // Filtros
    if (canal) {
      query = query.eq('canal', canal)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (busca) {
      // Busca no nome do contato (via join) ou chat_id
      query = query.or(`chat_id.ilike.%${busca}%,contato.nome.ilike.%${busca}%`)
    }

    // Ordenacao
    query = query.order(order_by, { ascending: order_dir === 'asc' })

    // Paginacao
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erro ao listar conversas: ${error.message}`)
    }

    // Buscar ultima mensagem de cada conversa
    const conversasComUltimaMensagem: ConversaComContato[] = await Promise.all(
      (data || []).map(async (conversa) => {
        const { data: ultimaMensagem } = await supabase
          .from('mensagens')
          .select('id, tipo, body, from_me, criado_em')
          .eq('conversa_id', conversa.id)
          .is('deletado_em', null)
          .order('criado_em', { ascending: false })
          .limit(1)
          .single()

        return {
          ...conversa,
          ultima_mensagem: ultimaMensagem || null,
        } as ConversaComContato
      })
    )

    const total = count || 0

    return {
      conversas: conversasComUltimaMensagem,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    }
  }

  // =====================================================
  // Buscar por ID
  // =====================================================

  /**
   * Busca conversa por ID
   */
  async buscarPorId(
    id: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole
  ): Promise<ConversaComContato | null> {
    let query = supabase
      .from('conversas')
      .select(`
        *,
        contato:contatos(id, nome, email, telefone, foto_url)
      `)
      .eq('id', id)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)

    // AIDEV-NOTE: Member ve apenas suas proprias conversas
    if (role === 'member') {
      query = query.eq('usuario_id', usuarioId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return null
    }

    return data as ConversaComContato
  }

  // =====================================================
  // Buscar ou Criar (para webhooks)
  // =====================================================

  /**
   * Busca conversa existente ou cria nova
   * AIDEV-NOTE: Usado pelos handlers de webhook WAHA e Instagram
   */
  async buscarOuCriarPorChatId(
    dados: BuscarOuCriarConversa
  ): Promise<Conversa> {
    const {
      organizacao_id,
      chat_id,
      canal,
      sessao_whatsapp_id,
      conexao_instagram_id,
      contato_id,
      usuario_id,
      nome,
      foto_url,
    } = dados

    // Busca conversa existente
    let query = supabase
      .from('conversas')
      .select('*')
      .eq('organizacao_id', organizacao_id)
      .eq('chat_id', chat_id)
      .is('deletado_em', null)

    if (canal === 'whatsapp' && sessao_whatsapp_id) {
      query = query.eq('sessao_whatsapp_id', sessao_whatsapp_id)
    } else if (canal === 'instagram' && conexao_instagram_id) {
      query = query.eq('conexao_instagram_id', conexao_instagram_id)
    }

    const { data: existente } = await query.single()

    if (existente) {
      return existente as Conversa
    }

    // Cria nova conversa
    const novaConversa = {
      organizacao_id,
      contato_id,
      usuario_id,
      sessao_whatsapp_id: sessao_whatsapp_id || null,
      conexao_instagram_id: conexao_instagram_id || null,
      chat_id,
      canal,
      tipo: 'individual',
      nome: nome || null,
      foto_url: foto_url || null,
      status: 'aberta' as StatusConversa,
      total_mensagens: 0,
      mensagens_nao_lidas: 0,
      primeira_mensagem_em: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('conversas')
      .insert(novaConversa)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar conversa: ${error.message}`)
    }

    return data as Conversa
  }

  // =====================================================
  // Criar Conversa (manual)
  // =====================================================

  /**
   * Cria nova conversa manualmente (usuario inicia)
   */
  async criar(
    organizacaoId: string,
    usuarioId: string,
    dados: CriarConversa
  ): Promise<Conversa> {
    // Se tem contato_id, usa. Se tem telefone, busca ou cria contato
    let contatoId = dados.contato_id

    if (!contatoId && dados.telefone) {
      // Busca contato pelo telefone
      const { data: contato } = await supabase
        .from('contatos')
        .select('id')
        .eq('organizacao_id', organizacaoId)
        .eq('telefone', dados.telefone)
        .is('deletado_em', null)
        .single()

      if (contato) {
        contatoId = contato.id
      } else {
        // Cria novo contato
        const { data: novoContato, error } = await supabase
          .from('contatos')
          .insert({
            organizacao_id: organizacaoId,
            nome: dados.telefone,
            telefone: dados.telefone,
            tipo: 'pessoa',
          })
          .select()
          .single()

        if (error) {
          throw new Error(`Erro ao criar contato: ${error.message}`)
        }

        contatoId = novoContato.id
      }
    }

    if (!contatoId) {
      throw new Error('contato_id ou telefone obrigatorio')
    }

    // Formata chat_id
    const chatId = dados.canal === 'whatsapp'
      ? `${dados.telefone?.replace(/\D/g, '')}@c.us`
      : dados.contato_id || ''

    // Busca sessao WhatsApp do usuario
    let sessaoWhatsappId: string | null = null
    if (dados.canal === 'whatsapp') {
      const { data: sessao } = await supabase
        .from('sessoes_whatsapp')
        .select('id')
        .eq('organizacao_id', organizacaoId)
        .eq('usuario_id', usuarioId)
        .eq('status', 'connected')
        .is('deletado_em', null)
        .single()

      if (!sessao) {
        throw new Error('Nenhuma sessao WhatsApp conectada')
      }
      sessaoWhatsappId = sessao.id
    }

    // Cria conversa
    const novaConversa = {
      organizacao_id: organizacaoId,
      contato_id: contatoId,
      usuario_id: usuarioId,
      sessao_whatsapp_id: sessaoWhatsappId,
      chat_id: chatId,
      canal: dados.canal,
      tipo: 'individual',
      status: 'aberta' as StatusConversa,
      total_mensagens: 0,
      mensagens_nao_lidas: 0,
      primeira_mensagem_em: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('conversas')
      .insert(novaConversa)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar conversa: ${error.message}`)
    }

    return data as Conversa
  }

  // =====================================================
  // Alterar Status
  // =====================================================

  /**
   * Altera status da conversa
   */
  async alterarStatus(
    id: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole,
    dados: AlterarStatusConversa
  ): Promise<Conversa> {
    // Verifica permissao
    const conversa = await this.buscarPorId(id, organizacaoId, usuarioId, role)

    if (!conversa) {
      throw new Error('Conversa nao encontrada ou sem permissao')
    }

    const { data, error } = await supabase
      .from('conversas')
      .update({
        status: dados.status,
        status_alterado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao alterar status: ${error.message}`)
    }

    return data as Conversa
  }

  // =====================================================
  // Atualizar Contadores
  // =====================================================

  /**
   * Atualiza contadores da conversa
   * AIDEV-NOTE: Chamado apos inserir nova mensagem
   */
  async atualizarContadores(
    conversaId: string,
    incrementoTotal: number = 1,
    incrementoNaoLidas: number = 0
  ): Promise<void> {
    const { data: conversa } = await supabase
      .from('conversas')
      .select('total_mensagens, mensagens_nao_lidas')
      .eq('id', conversaId)
      .single()

    if (!conversa) return

    await supabase
      .from('conversas')
      .update({
        total_mensagens: (conversa.total_mensagens || 0) + incrementoTotal,
        mensagens_nao_lidas: (conversa.mensagens_nao_lidas || 0) + incrementoNaoLidas,
        ultima_mensagem_em: new Date().toISOString(),
      })
      .eq('id', conversaId)
  }

  // =====================================================
  // Marcar como Lida
  // =====================================================

  /**
   * Zera contador de mensagens nao lidas
   */
  async marcarComoLida(
    conversaId: string,
    organizacaoId: string,
    usuarioId: string,
    role: UserRole
  ): Promise<void> {
    // Verifica permissao
    const conversa = await this.buscarPorId(conversaId, organizacaoId, usuarioId, role)

    if (!conversa) {
      throw new Error('Conversa nao encontrada ou sem permissao')
    }

    await supabase
      .from('conversas')
      .update({ mensagens_nao_lidas: 0 })
      .eq('id', conversaId)
  }

  // =====================================================
  // Reabrir Conversa (ao receber mensagem)
  // =====================================================

  /**
   * Reabre conversa se estava fechada
   * AIDEV-NOTE: Chamado pelos handlers de webhook ao receber mensagem
   */
  async reabrirSeNecessario(conversaId: string): Promise<void> {
    const { data: conversa } = await supabase
      .from('conversas')
      .select('status')
      .eq('id', conversaId)
      .single()

    if (conversa && conversa.status === 'fechada') {
      await supabase
        .from('conversas')
        .update({
          status: 'aberta',
          status_alterado_em: new Date().toISOString(),
        })
        .eq('id', conversaId)
    }
  }
}

export default new ConversasService()
