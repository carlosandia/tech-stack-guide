/**
 * AIDEV-NOTE: Service layer para módulo Caixa de Entrada de Email (PRD-11)
 * Usa Supabase client direto (respeita RLS via get_user_tenant_id)
 * Mesmo padrão arquitetural de conversas e contatos.
 */

import { supabase } from '@/lib/supabase'
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'
import type {
  EmailRecebido,
  EmailRascunho,
  EmailAssinatura,
  ListarEmailsParams,
  ListarEmailsResult,
  AtualizarEmailPayload,
  AcaoLotePayload,
  SalvarRascunhoPayload,
  EnviarEmailPayload,
  ConexaoEmail,
} from '../types/email.types'

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
   * Excluir email do servidor IMAP + soft delete local
   */
  deletar: async (id: string): Promise<{ deletado_servidor: boolean; mensagem: string }> => {
    const { data, error } = await supabase.functions.invoke('delete-email', {
      body: { email_id: id },
    })

    if (error) throw new Error(error.message || 'Erro ao excluir email')
    if (data && !data.sucesso) throw new Error(data.mensagem || 'Falha ao excluir')

    return { deletado_servidor: data?.deletado_servidor ?? false, mensagem: data?.mensagem ?? 'Excluído' }
  },

  /**
   * Traduzir email via Lovable AI
   */
  traduzirEmail: async (emailId: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('translate-email', {
      body: { email_id: emailId },
    })

    if (error) throw new Error(error.message || 'Erro ao traduzir')
    if (data && !data.sucesso) throw new Error(data.mensagem || 'Falha na tradução')

    return data?.traducao || ''
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
   * Enviar email via Edge Function (SMTP) com suporte a anexos
   */
  enviarEmail: async (payload: EnviarEmailPayload & { anexos?: File[] }): Promise<{ sucesso: boolean; mensagem: string }> => {
    // Upload anexos para Storage se existirem
    let anexosInfo: { filename: string; storage_path: string; mimeType: string; size: number }[] = []

    if (payload.anexos && payload.anexos.length > 0) {
      const orgId = await getOrganizacaoId()
      const userId = await getUsuarioId()
      const timestamp = Date.now()

      for (const file of payload.anexos) {
        const path = `${orgId}/${userId}/${timestamp}/${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('email-anexos')
          .upload(path, file)

        if (uploadError) {
          console.error('Erro upload anexo:', uploadError)
          throw new Error(`Erro ao fazer upload do anexo: ${file.name}`)
        }

        anexosInfo.push({
          filename: file.name,
          storage_path: path,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        })
      }
    }

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: payload.para_email,
        cc: payload.cc_email || undefined,
        bcc: payload.bcc_email || undefined,
        subject: payload.assunto,
        body: payload.corpo_html,
        body_type: 'html',
        anexos: anexosInfo.length > 0 ? anexosInfo : undefined,
      },
    })

    if (error) throw new Error(error.message || 'Erro ao enviar email')
    if (data && !data.sucesso) throw new Error(data.mensagem || 'Falha ao enviar email')

    return data || { sucesso: true, mensagem: 'Email enviado' }
  },

  /**
   * Sincronizar emails via IMAP (busca novos emails do servidor)
   */
  sincronizarEmails: async (): Promise<{ sucesso: boolean; mensagem: string; novos: number; atualizados: number }> => {
    const { data, error } = await supabase.functions.invoke('sync-emails', {})

    if (error) throw new Error(error.message || 'Erro ao sincronizar')
    if (data && !data.sucesso) throw new Error(data.mensagem || 'Falha na sincronização')

    return data || { sucesso: true, mensagem: 'Sincronizado', novos: 0, atualizados: 0 }
  },

  /**
   * Download de anexo (TODO: implementar via edge function com Gmail API)
   */
  downloadAnexo: async (_emailId: string, _anexoId: string): Promise<Blob> => {
    throw new Error('Download de anexos será disponibilizado em breve')
  },

  /**
   * AIDEV-NOTE: Buscar corpo do email sob demanda (lazy loading)
   * Chamada quando o usuário abre um email que não tem corpo_html carregado
   */
  fetchEmailBody: async (emailId: string): Promise<{ corpo_html: string | null; corpo_texto: string | null }> => {
    const { data, error } = await supabase.functions.invoke('fetch-email-body', {
      body: { email_id: emailId },
    })

    if (error) throw new Error(error.message || 'Erro ao buscar corpo do email')
    if (data && !data.sucesso) throw new Error(data.mensagem || 'Falha ao buscar corpo')

    return {
      corpo_html: data?.corpo_html || null,
      corpo_texto: data?.corpo_texto || null,
    }
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
      .limit(50)

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
