/**
 * AIDEV-NOTE: Service layer para módulo Caixa de Entrada de Email (PRD-11)
 * Usa Supabase client direto (respeita RLS via get_user_tenant_id)
 * Mesmo padrão arquitetural de conversas e contatos.
 */

import { supabase } from '@/lib/supabase'
import type {
  EmailRecebido,
  EmailRascunho,
  EmailAssinatura,
  ListarEmailsParams,
  ListarEmailsResult,
  AtualizarEmailPayload,
  AcaoLotePayload,
  SalvarRascunhoPayload,
  ConexaoEmail,
} from '../types/email.types'

// =====================================================
// Helpers - Cache de IDs (mesmo padrão dos outros módulos)
// =====================================================

let _cachedOrgId: string | null = null
let _cachedUserId: string | null = null

async function getOrganizacaoId(): Promise<string> {
  if (_cachedOrgId) return _cachedOrgId

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data } = await supabase
    .from('usuarios')
    .select('organizacao_id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!data?.organizacao_id) throw new Error('Organização não encontrada')
  _cachedOrgId = data.organizacao_id
  return _cachedOrgId
}

async function getUsuarioId(): Promise<string> {
  if (_cachedUserId) return _cachedUserId

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!data?.id) throw new Error('Usuário não encontrado')
  _cachedUserId = data.id
  return _cachedUserId
}

// Reset cache on auth state change
supabase.auth.onAuthStateChange(() => {
  _cachedOrgId = null
  _cachedUserId = null
})

// =====================================================
// API de Emails
// =====================================================

export const emailsApi = {
  /**
   * Listar emails com filtros e paginação
   */
  listar: async (params: ListarEmailsParams = {}): Promise<ListarEmailsResult> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()
    const page = params.page || 1
    const perPage = params.per_page || 20
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    let query = supabase
      .from('emails_recebidos')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)
      .is('deletado_em', null)
      .eq('pasta', params.pasta || 'inbox')
      .order('data_email', { ascending: false })
      .range(from, to)

    if (params.lido !== undefined) {
      query = query.eq('lido', params.lido)
    }
    if (params.favorito !== undefined) {
      query = query.eq('favorito', params.favorito)
    }
    if (params.tem_anexos !== undefined) {
      query = query.eq('tem_anexos', params.tem_anexos)
    }
    if (params.contato_id) {
      query = query.eq('contato_id', params.contato_id)
    }
    if (params.conexao_email_id) {
      query = query.eq('conexao_email_id', params.conexao_email_id)
    }
    if (params.busca) {
      query = query.or(`assunto.ilike.%${params.busca}%,de_email.ilike.%${params.busca}%,de_nome.ilike.%${params.busca}%,preview.ilike.%${params.busca}%`)
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    const total = count || 0
    return {
      data: (data || []) as EmailRecebido[],
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    }
  },

  /**
   * Obter email por ID
   */
  obter: async (id: string): Promise<EmailRecebido> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('emails_recebidos')
      .select('*')
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Email não encontrado')

    return data as EmailRecebido
  },

  /**
   * Atualizar email (lido, favorito, pasta, contato)
   */
  atualizar: async (id: string, payload: AtualizarEmailPayload): Promise<EmailRecebido> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('emails_recebidos')
      .update(payload)
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as EmailRecebido
  },

  /**
   * Mover email para lixeira (soft delete)
   */
  deletar: async (id: string): Promise<void> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { error } = await supabase
      .from('emails_recebidos')
      .update({ pasta: 'trash' })
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)

    if (error) throw new Error(error.message)
  },

  /**
   * Ações em lote
   */
  acaoLote: async (payload: AcaoLotePayload): Promise<{ total: number }> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const updateMap: Record<string, AtualizarEmailPayload> = {
      marcar_lido: { lido: true },
      marcar_nao_lido: { lido: false },
      arquivar: { pasta: 'archived' },
      mover_lixeira: { pasta: 'trash' },
      favoritar: { favorito: true },
      desfavoritar: { favorito: false },
      restaurar: { pasta: 'inbox' },
    }

    const update = updateMap[payload.acao]
    if (!update) throw new Error('Ação inválida')

    const { error } = await supabase
      .from('emails_recebidos')
      .update(update)
      .in('id', payload.ids)
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)

    if (error) throw new Error(error.message)
    return { total: payload.ids.length }
  },

  /**
   * Contar emails não lidos
   */
  contarNaoLidos: async (): Promise<{ inbox: number; total: number }> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { count, error } = await supabase
      .from('emails_recebidos')
      .select('*', { count: 'exact', head: true })
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)
      .eq('pasta', 'inbox')
      .eq('lido', false)
      .is('deletado_em', null)

    if (error) throw new Error(error.message)
    return { inbox: count || 0, total: count || 0 }
  },

  // =====================================================
  // Rascunhos
  // =====================================================

  listarRascunhos: async (): Promise<EmailRascunho[]> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('emails_rascunhos')
      .select('*')
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)
      .is('deletado_em', null)
      .order('atualizado_em', { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []) as EmailRascunho[]
  },

  salvarRascunho: async (payload: SalvarRascunhoPayload): Promise<EmailRascunho> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    if (payload.id) {
      const { data, error } = await supabase
        .from('emails_rascunhos')
        .update({
          para_email: payload.para_email,
          cc_email: payload.cc_email,
          bcc_email: payload.bcc_email,
          assunto: payload.assunto,
          corpo_html: payload.corpo_html,
        })
        .eq('id', payload.id)
        .eq('organizacao_id', orgId)
        .eq('usuario_id', userId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as EmailRascunho
    }

    const { data, error } = await supabase
      .from('emails_rascunhos')
      .insert({
        organizacao_id: orgId,
        usuario_id: userId,
        tipo: payload.tipo || 'novo',
        email_original_id: payload.email_original_id,
        para_email: payload.para_email,
        cc_email: payload.cc_email,
        bcc_email: payload.bcc_email,
        assunto: payload.assunto,
        corpo_html: payload.corpo_html,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as EmailRascunho
  },

  deletarRascunho: async (id: string): Promise<void> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { error } = await supabase
      .from('emails_rascunhos')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Assinatura
  // =====================================================

  obterAssinatura: async (): Promise<EmailAssinatura | null> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('emails_assinaturas')
      .select('*')
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data as EmailAssinatura | null
  },

  salvarAssinatura: async (payload: {
    assinatura_html: string | null
    incluir_em_respostas?: boolean
    incluir_em_novos?: boolean
  }): Promise<EmailAssinatura> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // Tenta upsert
    const { data: existing } = await supabase
      .from('emails_assinaturas')
      .select('id')
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('emails_assinaturas')
        .update({
          assinatura_html: payload.assinatura_html,
          incluir_em_respostas: payload.incluir_em_respostas ?? true,
          incluir_em_novos: payload.incluir_em_novos ?? true,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as EmailAssinatura
    }

    const { data, error } = await supabase
      .from('emails_assinaturas')
      .insert({
        organizacao_id: orgId,
        usuario_id: userId,
        assinatura_html: payload.assinatura_html,
        incluir_em_respostas: payload.incluir_em_respostas ?? true,
        incluir_em_novos: payload.incluir_em_novos ?? true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as EmailAssinatura
  },

  // =====================================================
  // Conexões de Email
  // =====================================================

  listarConexoes: async (): Promise<ConexaoEmail[]> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('conexoes_email')
      .select('id, email, nome_remetente, tipo, status')
      .eq('organizacao_id', orgId)
      .eq('usuario_id', userId)
      .is('deletado_em', null)
      .eq('status', 'ativo')

    if (error) throw new Error(error.message)
    return (data || []) as ConexaoEmail[]
  },
}

export default emailsApi
