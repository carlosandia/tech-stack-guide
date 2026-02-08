/**
 * AIDEV-NOTE: Service para Caixa de Entrada de Email (PRD-11)
 *
 * Responsabilidades:
 * - Sincronizacao de emails (Gmail API / IMAP)
 * - CRUD de emails, rascunhos, assinaturas
 * - Vinculacao automatica com contatos
 * - Envio via email.service.ts existente
 */

import { google } from 'googleapis'
import { supabaseAdmin as supabase } from '../config/supabase.js'
import { env } from '../config/env.js'
import { decrypt } from '../utils/crypto.js'
import { logger } from '../utils/logger.js'
import type {
  ListarEmailsQuery,
  AtualizarEmail,
  AcaoLote,
  EnviarEmailPayload,
  ResponderEmailPayload,
  EncaminharEmailPayload,
  CriarRascunho,
  SalvarAssinatura,
  PastaEmail,
} from '../schemas/emails.js'

// =====================================================
// Service
// =====================================================

class CaixaEntradaService {
  // =====================================================
  // Listar Emails
  // =====================================================

  async listarEmails(
    organizacaoId: string,
    usuarioId: string,
    query: ListarEmailsQuery
  ) {
    const { page, per_page, pasta, lido, favorito, tem_anexos, contato_id, busca, data_inicio, data_fim, conexao_email_id } = query

    let dbQuery = supabase
      .from('emails_recebidos')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('pasta', pasta)
      .is('deletado_em', null)
      .order('data_email', { ascending: false })

    if (lido !== undefined) dbQuery = dbQuery.eq('lido', lido)
    if (favorito !== undefined) dbQuery = dbQuery.eq('favorito', favorito)
    if (tem_anexos !== undefined) dbQuery = dbQuery.eq('tem_anexos', tem_anexos)
    if (contato_id) dbQuery = dbQuery.eq('contato_id', contato_id)
    if (conexao_email_id) dbQuery = dbQuery.eq('conexao_email_id', conexao_email_id)
    if (data_inicio) dbQuery = dbQuery.gte('data_email', data_inicio)
    if (data_fim) dbQuery = dbQuery.lte('data_email', data_fim)

    if (busca) {
      dbQuery = dbQuery.or(`assunto.ilike.%${busca}%,de_email.ilike.%${busca}%,de_nome.ilike.%${busca}%,preview.ilike.%${busca}%`)
    }

    // Paginacao
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    dbQuery = dbQuery.range(from, to)

    const { data, count, error } = await dbQuery

    if (error) throw new Error(`Erro ao listar emails: ${error.message}`)

    return {
      data: data || [],
      total: count || 0,
      page,
      per_page,
      total_pages: Math.ceil((count || 0) / per_page),
    }
  }

  // =====================================================
  // Detalhe do Email
  // =====================================================

  async obterEmail(organizacaoId: string, usuarioId: string, emailId: string) {
    const { data, error } = await supabase
      .from('emails_recebidos')
      .select('*')
      .eq('id', emailId)
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    if (error || !data) throw new Error('Email nao encontrado')

    // Marca como lido automaticamente
    if (!data.lido) {
      await supabase
        .from('emails_recebidos')
        .update({ lido: true })
        .eq('id', emailId)
    }

    return data
  }

  // =====================================================
  // Atualizar Email
  // =====================================================

  async atualizarEmail(
    organizacaoId: string,
    usuarioId: string,
    emailId: string,
    payload: Record<string, any>
  ) {
    const { data, error } = await supabase
      .from('emails_recebidos')
      .update(payload)
      .eq('id', emailId)
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar email: ${error.message}`)
    return data
  }

  // =====================================================
  // Deletar (mover para lixeira)
  // =====================================================

  async deletarEmail(organizacaoId: string, usuarioId: string, emailId: string) {
    // Verifica se ja esta na lixeira
    const { data: email } = await supabase
      .from('emails_recebidos')
      .select('pasta')
      .eq('id', emailId)
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .single()

    if (!email) throw new Error('Email nao encontrado')

    if (email.pasta === 'trash') {
      // Se ja esta na lixeira, soft delete
      await supabase
        .from('emails_recebidos')
        .update({ deletado_em: new Date().toISOString() })
        .eq('id', emailId)
    } else {
      // Move para lixeira
      await supabase
        .from('emails_recebidos')
        .update({ pasta: 'trash' })
        .eq('id', emailId)
    }
  }

  // =====================================================
  // Acoes em Lote
  // =====================================================

  async executarLote(
    organizacaoId: string,
    usuarioId: string,
    payload: AcaoLote
  ) {
    const { ids, acao } = payload
    let updateData: Record<string, any> = {}

    switch (acao) {
      case 'marcar_lido':
        updateData = { lido: true }
        break
      case 'marcar_nao_lido':
        updateData = { lido: false }
        break
      case 'arquivar':
        updateData = { pasta: 'archived' }
        break
      case 'mover_lixeira':
        updateData = { pasta: 'trash' }
        break
      case 'favoritar':
        updateData = { favorito: true }
        break
      case 'desfavoritar':
        updateData = { favorito: false }
        break
      case 'restaurar':
        updateData = { pasta: 'inbox' }
        break
    }

    const { error } = await supabase
      .from('emails_recebidos')
      .update(updateData)
      .in('id', ids)
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)

    if (error) throw new Error(`Erro na acao em lote: ${error.message}`)

    return { processados: ids.length, acao }
  }

  // =====================================================
  // Contadores (nao-lidos)
  // =====================================================

  async contarNaoLidos(organizacaoId: string, usuarioId: string) {
    const { count, error } = await supabase
      .from('emails_recebidos')
      .select('id', { count: 'exact', head: true })
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('pasta', 'inbox')
      .eq('lido', false)
      .is('deletado_em', null)

    if (error) throw new Error(`Erro ao contar nao lidos: ${error.message}`)

    return { nao_lidos: count || 0 }
  }

  // =====================================================
  // Enviar Email (usa email.service.ts existente)
  // =====================================================

  async enviarEmail(
    organizacaoId: string,
    usuarioId: string,
    payload: EnviarEmailPayload
  ) {
    // Busca conexao ativa do usuario
    const conexaoFilter = payload.conexao_email_id
      ? supabase.from('conexoes_email').select('*').eq('id', payload.conexao_email_id)
      : supabase.from('conexoes_email').select('*').eq('organizacao_id', organizacaoId).eq('usuario_id', usuarioId).eq('status', 'active').is('deletado_em', null)

    const { data: conexao, error: connError } = await conexaoFilter.single()

    if (connError || !conexao) {
      throw new Error('Nenhuma conexao de email ativa encontrada. Configure uma conexao primeiro.')
    }

    // Monta envio usando nodemailer (igual ao email.service)
    const nodemailer = await import('nodemailer')
    let transporter: any

    if (conexao.tipo === 'gmail_oauth') {
      const accessToken = decrypt(conexao.access_token_encrypted!)
      const refreshToken = conexao.refresh_token_encrypted ? decrypt(conexao.refresh_token_encrypted) : undefined

      transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: conexao.email,
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          refreshToken,
          accessToken,
        },
      })
    } else {
      const smtpPass = decrypt(conexao.smtp_pass_encrypted!)
      transporter = nodemailer.default.createTransport({
        host: conexao.smtp_host,
        port: conexao.smtp_port || 587,
        secure: conexao.smtp_tls && conexao.smtp_port === 465,
        auth: {
          user: conexao.smtp_user || conexao.email,
          pass: smtpPass,
        },
      })
    }

    // Busca assinatura do usuario
    const { data: assinatura } = await supabase
      .from('emails_assinaturas')
      .select('assinatura_html, incluir_em_novos')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .single()

    let corpoFinal = payload.corpo_html
    if (assinatura?.assinatura_html && assinatura.incluir_em_novos) {
      corpoFinal += `<br/><br/>--<br/>${assinatura.assinatura_html}`
    }

    // Envia
    const result = await transporter.sendMail({
      from: `${conexao.nome_remetente || conexao.email} <${conexao.email}>`,
      to: payload.para_email,
      cc: payload.cc_email || undefined,
      bcc: payload.bcc_email || undefined,
      subject: payload.assunto,
      html: corpoFinal,
    })

    // Salva na pasta enviados
    const messageId = result.messageId || `sent-${Date.now()}`

    await supabase.from('emails_recebidos').insert({
      organizacao_id: organizacaoId,
      usuario_id: usuarioId,
      conexao_email_id: conexao.id,
      message_id: messageId,
      de_email: conexao.email,
      de_nome: conexao.nome_remetente || conexao.email,
      para_email: payload.para_email,
      cc_email: payload.cc_email || null,
      bcc_email: payload.bcc_email || null,
      assunto: payload.assunto,
      corpo_html: corpoFinal,
      corpo_texto: corpoFinal.replace(/<[^>]*>/g, ''),
      preview: corpoFinal.replace(/<[^>]*>/g, '').substring(0, 200),
      pasta: 'sent',
      lido: true,
      data_email: new Date().toISOString(),
    })

    // Atualiza contadores
    await supabase
      .from('conexoes_email')
      .update({
        total_emails_enviados: (conexao.total_emails_enviados || 0) + 1,
        ultimo_envio: new Date().toISOString(),
      })
      .eq('id', conexao.id)

    // Cria tracking
    await supabase.from('emails_tracking').insert({
      organizacao_id: organizacaoId,
      message_id: messageId,
      tipo: 'enviado',
      contador: 1,
    })

    // Vincula com contato se existir
    await this.vincularContato(organizacaoId, payload.para_email)

    return { message_id: messageId, enviado: true }
  }

  // =====================================================
  // Responder Email
  // =====================================================

  async responderEmail(
    organizacaoId: string,
    usuarioId: string,
    emailId: string,
    payload: ResponderEmailPayload
  ) {
    const emailOriginal = await this.obterEmail(organizacaoId, usuarioId, emailId)

    return this.enviarEmail(organizacaoId, usuarioId, {
      para_email: emailOriginal.de_email,
      cc_email: payload.cc_email,
      bcc_email: payload.bcc_email,
      assunto: emailOriginal.assunto?.startsWith('Re:')
        ? emailOriginal.assunto
        : `Re: ${emailOriginal.assunto || ''}`,
      corpo_html: payload.corpo_html,
    })
  }

  // =====================================================
  // Encaminhar Email
  // =====================================================

  async encaminharEmail(
    organizacaoId: string,
    usuarioId: string,
    emailId: string,
    payload: EncaminharEmailPayload
  ) {
    const emailOriginal = await this.obterEmail(organizacaoId, usuarioId, emailId)

    const corpoEncaminhado = `
      ${payload.corpo_html || ''}
      <br/><br/>
      <hr/>
      <p><strong>---------- Mensagem encaminhada ----------</strong></p>
      <p><strong>De:</strong> ${emailOriginal.de_nome || ''} &lt;${emailOriginal.de_email}&gt;</p>
      <p><strong>Data:</strong> ${emailOriginal.data_email}</p>
      <p><strong>Assunto:</strong> ${emailOriginal.assunto || ''}</p>
      <br/>
      ${emailOriginal.corpo_html || emailOriginal.corpo_texto || ''}
    `

    return this.enviarEmail(organizacaoId, usuarioId, {
      para_email: payload.para_email,
      cc_email: payload.cc_email,
      bcc_email: payload.bcc_email,
      assunto: emailOriginal.assunto?.startsWith('Fwd:')
        ? emailOriginal.assunto
        : `Fwd: ${emailOriginal.assunto || ''}`,
      corpo_html: corpoEncaminhado,
    })
  }

  // =====================================================
  // Rascunhos
  // =====================================================

  async listarRascunhos(organizacaoId: string, usuarioId: string) {
    const { data, error } = await supabase
      .from('emails_rascunhos')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .is('deletado_em', null)
      .order('atualizado_em', { ascending: false })

    if (error) throw new Error(`Erro ao listar rascunhos: ${error.message}`)
    return data || []
  }

  async salvarRascunho(
    organizacaoId: string,
    usuarioId: string,
    payload: CriarRascunho
  ) {
    if (payload.id) {
      // Atualiza rascunho existente
      const { id, ...updateData } = payload
      const { data, error } = await supabase
        .from('emails_rascunhos')
        .update(updateData)
        .eq('id', id)
        .eq('organizacao_id', organizacaoId)
        .eq('usuario_id', usuarioId)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar rascunho: ${error.message}`)
      return data
    } else {
      // Cria novo rascunho
      const { data, error } = await supabase
        .from('emails_rascunhos')
        .insert({
          ...payload,
          organizacao_id: organizacaoId,
          usuario_id: usuarioId,
        })
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar rascunho: ${error.message}`)
      return data
    }
  }

  async deletarRascunho(organizacaoId: string, usuarioId: string, rascunhoId: string) {
    const { error } = await supabase
      .from('emails_rascunhos')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', rascunhoId)
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)

    if (error) throw new Error(`Erro ao deletar rascunho: ${error.message}`)
  }

  // =====================================================
  // Assinatura
  // =====================================================

  async obterAssinatura(organizacaoId: string, usuarioId: string) {
    const { data } = await supabase
      .from('emails_assinaturas')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .single()

    return data || { assinatura_html: null, incluir_em_respostas: true, incluir_em_novos: true }
  }

  async salvarAssinatura(
    organizacaoId: string,
    usuarioId: string,
    payload: SalvarAssinatura
  ) {
    // Upsert pela constraint UNIQUE
    const { data: existente } = await supabase
      .from('emails_assinaturas')
      .select('id')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .single()

    if (existente) {
      const { data, error } = await supabase
        .from('emails_assinaturas')
        .update(payload)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar assinatura: ${error.message}`)
      return data
    } else {
      const { data, error } = await supabase
        .from('emails_assinaturas')
        .insert({
          ...payload,
          organizacao_id: organizacaoId,
          usuario_id: usuarioId,
        })
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar assinatura: ${error.message}`)
      return data
    }
  }

  // =====================================================
  // Sincronizacao
  // =====================================================

  async obterStatusSync(organizacaoId: string, usuarioId: string) {
    const { data } = await supabase
      .from('emails_sync_estado')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .order('ultimo_sync', { ascending: false })

    return data || []
  }

  async forcarSync(organizacaoId: string, usuarioId: string) {
    // Busca conexoes ativas do usuario
    const { data: conexoes } = await supabase
      .from('conexoes_email')
      .select('*')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('status', 'active')
      .is('deletado_em', null)

    if (!conexoes || conexoes.length === 0) {
      throw new Error('Nenhuma conexao de email ativa encontrada')
    }

    const resultados = []

    for (const conexao of conexoes) {
      try {
        // Atualiza estado para sincronizando
        await this.atualizarEstadoSync(organizacaoId, usuarioId, conexao.id, 'sincronizando')

        if (conexao.tipo === 'gmail_oauth') {
          await this.syncGmail(organizacaoId, usuarioId, conexao)
        } else {
          // IMAP sync placeholder - sera implementado quando imapflow for instalado
          logger.warn('Sync IMAP ainda nao implementado')
        }

        await this.atualizarEstadoSync(organizacaoId, usuarioId, conexao.id, 'ok')
        resultados.push({ conexao_id: conexao.id, status: 'ok' })
      } catch (err: any) {
        logger.error(`Erro sync email conexao ${conexao.id}:`, err)
        await this.atualizarEstadoSync(organizacaoId, usuarioId, conexao.id, 'erro', err.message)
        resultados.push({ conexao_id: conexao.id, status: 'erro', erro: err.message })
      }
    }

    return { resultados }
  }

  // =====================================================
  // Gmail Sync
  // =====================================================

  private async syncGmail(organizacaoId: string, usuarioId: string, conexao: any) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth nao configurado')
    }

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET
    )

    const accessToken = decrypt(conexao.access_token_encrypted)
    const refreshToken = conexao.refresh_token_encrypted ? decrypt(conexao.refresh_token_encrypted) : undefined

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Busca estado de sync anterior
    const { data: syncEstado } = await supabase
      .from('emails_sync_estado')
      .select('ultimo_history_id')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('conexao_email_id', conexao.id)
      .single()

    let messages: any[] = []

    if (syncEstado?.ultimo_history_id) {
      // Sync incremental via history
      try {
        const historyRes = await gmail.users.history.list({
          userId: 'me',
          startHistoryId: syncEstado.ultimo_history_id,
          historyTypes: ['messageAdded'],
        })

        const messagesAdded = historyRes.data.history?.flatMap(
          h => h.messagesAdded?.map(m => m.message) || []
        ) || []

        messages = messagesAdded.filter(Boolean)
      } catch (e: any) {
        // Se o historyId for invalido, faz sync full
        if (e.code === 404) {
          messages = await this.fetchGmailMessages(gmail, 100)
        } else {
          throw e
        }
      }
    } else {
      // Sync inicial: ultimos 100
      messages = await this.fetchGmailMessages(gmail, 100)
    }

    // Processa cada mensagem
    let processados = 0
    for (const msg of messages) {
      if (!msg?.id) continue
      try {
        const fullMsg = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        })

        await this.processarMensagemGmail(organizacaoId, usuarioId, conexao.id, fullMsg.data)
        processados++
      } catch (e: any) {
        logger.warn(`Erro ao processar mensagem ${msg.id}: ${e.message}`)
      }
    }

    // Atualiza historyId
    const profile = await gmail.users.getProfile({ userId: 'me' })
    if (profile.data.historyId) {
      await supabase
        .from('emails_sync_estado')
        .upsert({
          organizacao_id: organizacaoId,
          usuario_id: usuarioId,
          conexao_email_id: conexao.id,
          ultimo_history_id: profile.data.historyId,
          ultimo_sync: new Date().toISOString(),
          status: 'ok',
          tentativas_erro: 0,
        }, {
          onConflict: 'organizacao_id,usuario_id,conexao_email_id',
          ignoreDuplicates: false,
        })
    }

    logger.info(`Gmail sync: ${processados} emails processados para usuario ${usuarioId}`)
  }

  private async fetchGmailMessages(gmail: any, maxResults: number) {
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX'],
    })
    return res.data.messages || []
  }

  private async processarMensagemGmail(
    organizacaoId: string,
    usuarioId: string,
    conexaoEmailId: string,
    message: any
  ) {
    const headers = message.payload?.headers || []
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

    const messageId = getHeader('Message-ID') || message.id
    const threadId = message.threadId
    const subject = getHeader('Subject')
    const from = getHeader('From')
    const to = getHeader('To')
    const cc = getHeader('Cc')
    const date = getHeader('Date')

    // Parse from
    const fromMatch = from.match(/^(?:"?(.+?)"?\s)?<?([^\s>]+@[^\s>]+)>?$/)
    const deNome = fromMatch?.[1] || ''
    const deEmail = fromMatch?.[2] || from

    // Extrai body
    const { textBody, htmlBody } = this.extrairCorpoGmail(message.payload)

    // Verifica anexos
    const anexos = this.extrairAnexosInfoGmail(message.payload)

    // Verifica labels para pasta
    const labels = message.labelIds || []
    let pasta: PastaEmail = 'inbox'
    if (labels.includes('SENT')) pasta = 'sent'
    else if (labels.includes('DRAFT')) pasta = 'drafts'
    else if (labels.includes('TRASH')) pasta = 'trash'
    else if (labels.includes('SPAM')) pasta = 'trash'

    const lido = !labels.includes('UNREAD')

    // Upsert (deduplicacao por message_id)
    const { error } = await supabase
      .from('emails_recebidos')
      .upsert({
        organizacao_id: organizacaoId,
        usuario_id: usuarioId,
        conexao_email_id: conexaoEmailId,
        message_id: messageId,
        thread_id: threadId,
        provider_id: message.id,
        de_email: deEmail,
        de_nome: deNome,
        para_email: to,
        cc_email: cc || null,
        assunto: subject,
        preview: (textBody || '').substring(0, 200),
        corpo_texto: textBody,
        corpo_html: htmlBody,
        tem_anexos: anexos.length > 0,
        anexos_info: anexos,
        pasta,
        lido,
        data_email: date ? new Date(date).toISOString() : new Date().toISOString(),
        sincronizado_em: new Date().toISOString(),
      }, {
        onConflict: 'organizacao_id,usuario_id,message_id',
        ignoreDuplicates: true,
      })

    if (error) {
      logger.warn(`Erro ao salvar email ${messageId}: ${error.message}`)
    }

    // Tenta vincular com contato
    await this.vincularContato(organizacaoId, deEmail)
  }

  private extrairCorpoGmail(payload: any): { textBody: string; htmlBody: string } {
    let textBody = ''
    let htmlBody = ''

    if (!payload) return { textBody, htmlBody }

    const processarPart = (part: any) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        textBody = Buffer.from(part.body.data, 'base64url').toString('utf-8')
      }
      if (part.mimeType === 'text/html' && part.body?.data) {
        htmlBody = Buffer.from(part.body.data, 'base64url').toString('utf-8')
      }
      if (part.parts) {
        part.parts.forEach(processarPart)
      }
    }

    processarPart(payload)
    return { textBody, htmlBody }
  }

  private extrairAnexosInfoGmail(payload: any): any[] {
    const anexos: any[] = []

    const processarPart = (part: any) => {
      if (part.filename && part.filename.length > 0) {
        anexos.push({
          nome: part.filename,
          tipo: part.mimeType,
          tamanho: part.body?.size || 0,
          attachmentId: part.body?.attachmentId,
        })
      }
      if (part.parts) {
        part.parts.forEach(processarPart)
      }
    }

    if (payload) processarPart(payload)
    return anexos
  }

  // =====================================================
  // Download de Anexo
  // =====================================================

  async downloadAnexo(
    organizacaoId: string,
    usuarioId: string,
    emailId: string,
    anexoId: string
  ) {
    // Busca o email
    const { data: email } = await supabase
      .from('emails_recebidos')
      .select('conexao_email_id, provider_id, anexos_info')
      .eq('id', emailId)
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .single()

    if (!email) throw new Error('Email nao encontrado')

    // Busca a conexao
    const { data: conexao } = await supabase
      .from('conexoes_email')
      .select('*')
      .eq('id', email.conexao_email_id)
      .single()

    if (!conexao || conexao.tipo !== 'gmail_oauth') {
      throw new Error('Download de anexo disponivel apenas para Gmail OAuth')
    }

    const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET)
    oauth2Client.setCredentials({
      access_token: decrypt(conexao.access_token_encrypted!),
      refresh_token: conexao.refresh_token_encrypted ? decrypt(conexao.refresh_token_encrypted) : undefined,
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: email.provider_id!,
      id: anexoId,
    })

    // Busca info do anexo
    const anexoInfo = (email.anexos_info as any[])?.find((a: any) => a.attachmentId === anexoId)

    return {
      data: Buffer.from(attachment.data.data!, 'base64url'),
      mimeType: anexoInfo?.tipo || 'application/octet-stream',
      filename: anexoInfo?.nome || 'attachment',
    }
  }

  // =====================================================
  // Helpers
  // =====================================================

  private async vincularContato(organizacaoId: string, email: string) {
    try {
      const { data: contato } = await supabase
        .from('contatos')
        .select('id')
        .eq('organizacao_id', organizacaoId)
        .eq('email', email)
        .is('deletado_em', null)
        .limit(1)
        .single()

      if (contato) {
        // Atualiza emails que nao tem contato vinculado
        await supabase
          .from('emails_recebidos')
          .update({ contato_id: contato.id })
          .eq('organizacao_id', organizacaoId)
          .or(`de_email.eq.${email},para_email.eq.${email}`)
          .is('contato_id', null)
      }
    } catch {
      // Ignora se contato nao encontrado
    }
  }

  private async atualizarEstadoSync(
    organizacaoId: string,
    usuarioId: string,
    conexaoEmailId: string,
    status: string,
    erroMensagem?: string
  ) {
    const { data: existente } = await supabase
      .from('emails_sync_estado')
      .select('id, tentativas_erro')
      .eq('organizacao_id', organizacaoId)
      .eq('usuario_id', usuarioId)
      .eq('conexao_email_id', conexaoEmailId)
      .single()

    if (existente) {
      await supabase
        .from('emails_sync_estado')
        .update({
          status,
          ultimo_sync: new Date().toISOString(),
          erro_mensagem: erroMensagem || null,
          tentativas_erro: status === 'erro' ? (existente.tentativas_erro || 0) + 1 : 0,
        })
        .eq('id', existente.id)
    } else {
      await supabase
        .from('emails_sync_estado')
        .insert({
          organizacao_id: organizacaoId,
          usuario_id: usuarioId,
          conexao_email_id: conexaoEmailId,
          status,
          ultimo_sync: new Date().toISOString(),
          erro_mensagem: erroMensagem || null,
        })
    }
  }
}

export default new CaixaEntradaService()
