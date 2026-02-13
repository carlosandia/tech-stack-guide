/**
 * AIDEV-NOTE: Service layer para módulo de Conversas (PRD-09)
 * Usa Supabase client direto (respeita RLS via get_user_tenant_id)
 * Envio real de mensagens via WAHA (waha-proxy edge function)
 * Inclui ações sincronizadas com WhatsApp: apagar, limpar, arquivar, etc.
 */

import { supabase } from '@/lib/supabase'

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
// Types
// =====================================================

export interface ConversaContato {
  id: string
  nome: string | null
  nome_fantasia?: string | null
  email?: string | null
  telefone?: string | null
  foto_url?: string | null
}

export interface UltimaMensagemPreview {
  id: string
  tipo: string
  body?: string | null
  from_me: boolean
  criado_em: string
}

export interface Conversa {
  id: string
  organizacao_id: string
  contato_id: string
  usuario_id: string
  sessao_whatsapp_id?: string | null
  conexao_instagram_id?: string | null
  chat_id: string
  canal: 'whatsapp' | 'instagram'
  tipo: 'individual' | 'grupo' | 'canal'
  nome?: string | null
  foto_url?: string | null
  status: 'aberta' | 'pendente' | 'fechada'
  total_mensagens: number
  mensagens_nao_lidas: number
  ultima_mensagem_em?: string | null
  primeira_mensagem_em?: string | null
  status_alterado_em?: string | null
  fixada: boolean
  silenciada: boolean
  arquivada: boolean
  criado_em: string
  atualizado_em: string
  contato?: ConversaContato
  ultima_mensagem?: UltimaMensagemPreview | null
}

export interface ListarConversasParams {
  canal?: 'whatsapp' | 'instagram'
  status?: 'aberta' | 'pendente' | 'fechada'
  arquivadas?: boolean
  busca?: string
  page?: number
  limit?: number
}

export interface ListarConversasResponse {
  conversas: Conversa[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface Mensagem {
  id: string
  organizacao_id: string
  conversa_id: string
  message_id: string
  from_me: boolean
  from_number?: string | null
  to_number?: string | null
  participant?: string | null
  tipo: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact' | 'poll' | 'reaction'
  body?: string | null
  caption?: string | null
  has_media: boolean
  media_url?: string | null
  media_mimetype?: string | null
  media_filename?: string | null
  media_size?: number | null
  media_duration?: number | null
  location_latitude?: number | null
  location_longitude?: number | null
  location_name?: string | null
  location_address?: string | null
  vcard?: string | null
  poll_question?: string | null
  poll_options?: Array<{ text: string; votes: number }> | null
  poll_allow_multiple?: boolean | null
  reaction_emoji?: string | null
  reaction_message_id?: string | null
  reply_to_message_id?: string | null
  fixada: boolean
  ack: number
  ack_name?: string | null
  timestamp_externo?: number | null
  criado_em: string
  atualizado_em: string
  raw_data?: Record<string, unknown> | null
}

export interface ListarMensagensParams {
  page?: number
  limit?: number
  antes_de?: string
  order_dir?: 'asc' | 'desc'
}

export interface ListarMensagensResponse {
  mensagens: Mensagem[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface MensagemPronta {
  id: string
  organizacao_id: string
  usuario_id?: string | null
  atalho: string
  titulo: string
  conteudo: string
  tipo: 'pessoal' | 'global'
  ativo: boolean
  vezes_usado: number
  criado_em: string
  atualizado_em: string
}

export interface NotaContato {
  id: string
  organizacao_id: string
  contato_id: string
  usuario_id: string
  conteudo: string
  criado_em: string
  atualizado_em: string
  usuario?: { id: string; nome: string }
}

// =====================================================
// Helper: get session data for WAHA actions
// =====================================================

async function getConversaWahaSession(conversaId: string) {
  const { data: conversa } = await supabase
    .from('conversas')
    .select('chat_id, sessao_whatsapp_id, canal')
    .eq('id', conversaId)
    .maybeSingle()

  if (!conversa?.sessao_whatsapp_id || conversa?.canal !== 'whatsapp') return null

  const { data: sessao } = await supabase
    .from('sessoes_whatsapp')
    .select('session_name')
    .eq('id', conversa.sessao_whatsapp_id)
    .maybeSingle()

  if (!sessao?.session_name) return null

  return { chatId: conversa.chat_id, sessionName: sessao.session_name }
}

// =====================================================
// API Functions (Supabase direto)
// =====================================================

export const conversasApi = {
  // --- Conversas ---

  async listar(params?: ListarConversasParams): Promise<ListarConversasResponse> {
    const organizacaoId = await getOrganizacaoId()
    const page = params?.page || 1
    const limit = params?.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('conversas')
      .select(`
        *,
        contato:contatos!conversas_contato_id_fkey(id, nome, nome_fantasia, email, telefone)
      `, { count: 'exact' })
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .eq('arquivada', params?.arquivadas ? true : false)
      .order('fixada', { ascending: false })
      .order('ultima_mensagem_em', { ascending: false, nullsFirst: false })
      .range(from, to)

    if (params?.canal) {
      query = query.eq('canal', params.canal)
    }
    if (params?.status) {
      query = query.eq('status', params.status)
    }
    if (params?.busca) {
      query = query.or(`nome.ilike.%${params.busca}%,chat_id.ilike.%${params.busca}%`)
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    const conversas = (data || []) as unknown as Conversa[]

    // Fetch ultima mensagem preview para cada conversa
    if (conversas.length > 0) {
      const conversaIds = conversas.map(c => c.id)
      
      const { data: ultimasMensagens } = await supabase
        .from('mensagens')
        .select('id, conversa_id, tipo, body, from_me, criado_em')
        .in('conversa_id', conversaIds)
        .is('deletado_em', null)
        .order('criado_em', { ascending: false })

      if (ultimasMensagens) {
        const ultimaMap = new Map<string, UltimaMensagemPreview>()
        for (const msg of ultimasMensagens) {
          if (!ultimaMap.has(msg.conversa_id)) {
            // Skip text messages with null body (WAHA webhook duplicates)
            if (msg.tipo === 'text' && !msg.body) continue
            ultimaMap.set(msg.conversa_id, {
              id: msg.id,
              tipo: msg.tipo,
              body: msg.body,
              from_me: msg.from_me,
              criado_em: msg.criado_em,
            })
          }
        }
        
        for (const conversa of conversas) {
          conversa.ultima_mensagem = ultimaMap.get(conversa.id) || null
        }
      }
    }

    const total = count || 0

    return {
      conversas,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    }
  },

  async buscarPorId(id: string): Promise<Conversa> {
    const { data, error } = await supabase
      .from('conversas')
      .select(`
        *,
        contato:contatos!conversas_contato_id_fkey(id, nome, nome_fantasia, email, telefone)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Conversa não encontrada')

    return data as unknown as Conversa
  },

  async criar(dados: { contato_id?: string; telefone?: string; canal: 'whatsapp' | 'instagram'; mensagem_inicial: string }): Promise<Conversa> {
    const organizacaoId = await getOrganizacaoId()
    const usuarioId = await getUsuarioId()

    // Resolve or create contact
    let contatoId = dados.contato_id
    let telefoneContato = dados.telefone
    if (!contatoId && dados.telefone) {
      const { data: contato } = await supabase
        .from('contatos')
        .select('id, telefone')
        .eq('organizacao_id', organizacaoId)
        .eq('telefone', dados.telefone)
        .is('deletado_em', null)
        .maybeSingle()

      if (contato) {
        contatoId = contato.id
        telefoneContato = contato.telefone || dados.telefone
      } else {
        const { data: novoContato, error: contatoError } = await supabase
          .from('contatos')
          .insert({
            organizacao_id: organizacaoId,
            nome: dados.telefone,
            telefone: dados.telefone,
            tipo: 'pessoa',
            origem: dados.canal,
            criado_por: usuarioId,
          })
          .select('id')
          .single()

        if (contatoError) throw new Error(contatoError.message)
        contatoId = novoContato.id
      }
    }

    if (!contatoId) throw new Error('Contato não encontrado')

    // Try to find active WAHA session for WhatsApp
    let sessaoWhatsappId: string | null = null
    let wahaChatId: string | null = null
    let wahaMessageId: string | null = null
    let ack = 0

    if (dados.canal === 'whatsapp' && telefoneContato) {
      // Find active session
      const { data: sessao } = await supabase
        .from('sessoes_whatsapp')
        .select('id, session_name')
        .eq('organizacao_id', organizacaoId)
        .eq('status', 'connected')
        .limit(1)
        .maybeSingle()

      if (sessao) {
        sessaoWhatsappId = sessao.id
        // Format phone for WhatsApp chat_id: remove + and non-digits, append @c.us
        const phoneClean = telefoneContato.replace(/\D/g, '')
        wahaChatId = `${phoneClean}@c.us`

        // Send message via WAHA
        try {
          const { data: wahaResult, error: wahaError } = await supabase.functions.invoke('waha-proxy', {
            body: {
              action: 'enviar_mensagem',
              session_name: sessao.session_name,
              chat_id: wahaChatId,
              text: dados.mensagem_inicial,
            },
          })

          if (wahaError) {
            console.error('[conversas.api] Erro ao enviar via WAHA na criação:', wahaError)
          } else if (wahaResult?.error) {
            console.error('[conversas.api] WAHA retornou erro na criação:', wahaResult.error)
          } else {
            wahaMessageId = wahaResult?.message_id || null
            ack = 1
            console.log('[conversas.api] Mensagem inicial enviada via WAHA, messageId:', wahaMessageId)
          }
        } catch (e) {
          console.error('[conversas.api] Exceção ao enviar via WAHA:', e)
        }
      }
    }

    const chatId = wahaChatId || `${dados.canal}_${contatoId}_${Date.now()}`
    const { data: conversa, error } = await supabase
      .from('conversas')
      .insert({
        organizacao_id: organizacaoId,
        contato_id: contatoId,
        usuario_id: usuarioId,
        sessao_whatsapp_id: sessaoWhatsappId,
        chat_id: chatId,
        canal: dados.canal,
        tipo: 'individual',
        status: 'aberta',
        total_mensagens: 1,
        mensagens_nao_lidas: 0,
        ultima_mensagem_em: new Date().toISOString(),
        primeira_mensagem_em: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    await supabase
      .from('mensagens')
      .insert({
        organizacao_id: organizacaoId,
        conversa_id: conversa.id,
        message_id: wahaMessageId || `local_${Date.now()}`,
        from_me: true,
        tipo: 'text',
        body: dados.mensagem_inicial,
        has_media: false,
        ack,
      })

    return conversa as unknown as Conversa
  },

  async alterarStatus(id: string, status: 'aberta' | 'pendente' | 'fechada'): Promise<Conversa> {
    const { data, error } = await supabase
      .from('conversas')
      .update({
        status,
        status_alterado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as Conversa
  },

  async marcarComoLida(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversas')
      .update({ mensagens_nao_lidas: 0 })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Ações de Conversa (sincronizadas com WhatsApp)
  // =====================================================

  /** Apagar mensagem individual (soft delete local + WAHA se paraTodos) */
  async apagarMensagem(conversaId: string, mensagemId: string, messageWahaId: string, paraTodos: boolean): Promise<void> {
    // Se paraTodos, enviar para WAHA (non-blocking)
    if (paraTodos) {
      const session = await getConversaWahaSession(conversaId)
      if (session) {
        try {
          await supabase.functions.invoke('waha-proxy', {
            body: {
              action: 'apagar_mensagem',
              session_name: session.sessionName,
              chat_id: session.chatId,
              message_id: messageWahaId,
            },
          })
        } catch (e) {
          console.warn('[conversasApi] WAHA apagar_mensagem falhou (CRM continua):', e)
        }
      }
    }

    // Soft delete local
    const { error } = await supabase
      .from('mensagens')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', mensagemId)

    if (error) throw new Error(error.message)
  },

  /** Limpar conversa (apagar todas mensagens) */
  async limparConversa(conversaId: string): Promise<void> {
    const session = await getConversaWahaSession(conversaId)
    if (session) {
      try {
        await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'limpar_conversa',
            session_name: session.sessionName,
            chat_id: session.chatId,
          },
        })
      } catch (e) {
        console.warn('[conversasApi] WAHA limpar_conversa falhou (CRM continua):', e)
      }
    }

    // Soft delete all messages locally
    const { error } = await supabase
      .from('mensagens')
      .update({ deletado_em: new Date().toISOString() })
      .eq('conversa_id', conversaId)
      .is('deletado_em', null)

    if (error) throw new Error(error.message)

    await supabase
      .from('conversas')
      .update({ total_mensagens: 0, mensagens_nao_lidas: 0 })
      .eq('id', conversaId)
  },

  /** Apagar conversa (WA + soft delete local) */
  async apagarConversa(conversaId: string): Promise<void> {
    const session = await getConversaWahaSession(conversaId)
    if (session) {
      try {
        await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'apagar_conversa',
            session_name: session.sessionName,
            chat_id: session.chatId,
          },
        })
      } catch (e) {
        console.warn('[conversasApi] WAHA apagar_conversa falhou (CRM continua):', e)
      }
    }

    const { error } = await supabase
      .from('conversas')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', conversaId)

    if (error) throw new Error(error.message)
  },

  /** Arquivar conversa (WA + flag local) */
  async arquivarConversa(conversaId: string): Promise<void> {
    const session = await getConversaWahaSession(conversaId)
    if (session) {
      try {
        await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'arquivar_conversa',
            session_name: session.sessionName,
            chat_id: session.chatId,
          },
        })
      } catch (e) {
        console.warn('[conversasApi] WAHA arquivar_conversa falhou (CRM continua):', e)
      }
    }

    const { error } = await supabase
      .from('conversas')
      .update({ arquivada: true })
      .eq('id', conversaId)

    if (error) throw new Error(error.message)
  },

  /** Desarquivar conversa (WA + flag local) */
  async desarquivarConversa(conversaId: string): Promise<void> {
    const session = await getConversaWahaSession(conversaId)
    if (session) {
      try {
        await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'desarquivar_conversa',
            session_name: session.sessionName,
            chat_id: session.chatId,
          },
        })
      } catch (e) {
        console.warn('[conversasApi] WAHA desarquivar_conversa falhou (CRM continua):', e)
      }
    }

    const { error } = await supabase
      .from('conversas')
      .update({ arquivada: false })
      .eq('id', conversaId)

    if (error) throw new Error(error.message)
  },

  /** Fixar/desfixar conversa (apenas CRM) */
  async fixarConversa(conversaId: string, fixar: boolean): Promise<void> {
    const { error } = await supabase
      .from('conversas')
      .update({ fixada: fixar })
      .eq('id', conversaId)

    if (error) throw new Error(error.message)
  },

  /** Marcar como não lida (WA + badge local) */
  async marcarNaoLida(conversaId: string): Promise<void> {
    const session = await getConversaWahaSession(conversaId)
    if (session) {
      try {
        await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'marcar_nao_lida',
            session_name: session.sessionName,
            chat_id: session.chatId,
          },
        })
      } catch (e) {
        console.warn('[conversasApi] WAHA marcar_nao_lida falhou (CRM continua):', e)
      }
    }

    // Set unread to at least 1
    const { error } = await supabase
      .from('conversas')
      .update({ mensagens_nao_lidas: 1 })
      .eq('id', conversaId)

    if (error) throw new Error(error.message)
  },

  /** Silenciar/dessilenciar conversa (apenas CRM) */
  async silenciarConversa(conversaId: string, silenciar: boolean): Promise<void> {
    const { error } = await supabase
      .from('conversas')
      .update({ silenciada: silenciar })
      .eq('id', conversaId)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Ações de Mensagem (fixar, reagir, encaminhar)
  // =====================================================

  /** Fixar mensagem no chat via WAHA + marcar no banco */
  async fixarMensagem(conversaId: string, mensagemId: string, messageWahaId: string): Promise<void> {
    const session = await getConversaWahaSession(conversaId)
    if (session) {
      const { data, error } = await supabase.functions.invoke('waha-proxy', {
        body: {
          action: 'fixar_mensagem',
          session_name: session.sessionName,
          chat_id: session.chatId,
          message_id: messageWahaId,
        },
      })
      if (error) {
        console.warn('[conversasApi] WAHA fixar_mensagem falhou:', error)
      }
      if (data?.waha_unsupported) {
        console.warn('[conversasApi] Fixar não suportado pelo engine NOWEB, salvando localmente')
      }
    }

    // Desafixar qualquer mensagem previamente fixada nesta conversa
    await supabase
      .from('mensagens')
      .update({ fixada: false })
      .eq('conversa_id', conversaId)
      .eq('fixada', true)

    // Fixar a mensagem selecionada
    await supabase
      .from('mensagens')
      .update({ fixada: true })
      .eq('id', mensagemId)
  },

  /** Desafixar mensagem no chat via WAHA + desmarcar no banco */
  async desafixarMensagem(conversaId: string, mensagemId: string, messageWahaId: string): Promise<void> {
    const session = await getConversaWahaSession(conversaId)
    if (session) {
      const { error } = await supabase.functions.invoke('waha-proxy', {
        body: {
          action: 'desafixar_mensagem',
          session_name: session.sessionName,
          chat_id: session.chatId,
          message_id: messageWahaId,
        },
      })
      if (error) {
        console.warn('[conversasApi] WAHA desafixar_mensagem falhou:', error)
      }
    }

    await supabase
      .from('mensagens')
      .update({ fixada: false })
      .eq('id', mensagemId)
  },

  /** Reagir a uma mensagem via WAHA */
  async reagirMensagem(conversaId: string, messageWahaId: string, emoji: string): Promise<void> {
    const session = await getConversaWahaSession(conversaId)
    if (session) {
      const { data, error } = await supabase.functions.invoke('waha-proxy', {
        body: {
          action: 'reagir_mensagem',
          session_name: session.sessionName,
          chat_id: session.chatId,
          message_id: messageWahaId,
          emoji,
        },
      })
      if (error) {
        console.warn('[conversasApi] WAHA reagir_mensagem falhou:', error)
        throw new Error('Erro ao reagir à mensagem')
      }
      if (data?.waha_unsupported) {
        throw new Error('Reação não suportada pelo engine NOWEB')
      }
    }
  },

  /** Encaminhar mensagem para outra conversa via WAHA */
  async encaminharMensagem(conversaId: string, messageWahaId: string, destinoChatId: string): Promise<void> {
    const session = await getConversaWahaSession(conversaId)
    if (session) {
      try {
        await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'encaminhar_mensagem',
            session_name: session.sessionName,
            chat_id: session.chatId,
            message_id: messageWahaId,
            destino_chat_id: destinoChatId,
          },
        })
      } catch (e) {
        console.warn('[conversasApi] WAHA encaminhar_mensagem falhou:', e)
        throw new Error('Erro ao encaminhar mensagem')
      }
    }
  },

  async listarMensagens(conversaId: string, params?: ListarMensagensParams): Promise<ListarMensagensResponse> {
    const page = params?.page || 1
    const limit = params?.limit || 50
    const from = (page - 1) * limit
    const to = from + limit - 1
    const orderDir = params?.order_dir || 'desc'

    let query = supabase
      .from('mensagens')
      .select('*', { count: 'exact' })
      .eq('conversa_id', conversaId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: orderDir === 'asc' })
      .range(from, to)

    if (params?.antes_de) {
      query = query.lt('criado_em', params.antes_de)
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    const total = count || 0

    return {
      mensagens: (data || []) as Mensagem[],
      total,
      page,
      limit,
      has_more: from + limit < total,
    }
  },

  /**
   * Envia mensagem de texto. Se a conversa tem sessão WhatsApp ativa,
   * envia via WAHA API. Caso contrário, salva apenas localmente.
   */
  async enviarTexto(conversaId: string, texto: string, replyTo?: string, isTemplate?: boolean): Promise<Mensagem> {
    const organizacaoId = await getOrganizacaoId()

    // Buscar dados da conversa para determinar se é WhatsApp
    const { data: conversa } = await supabase
      .from('conversas')
      .select('chat_id, sessao_whatsapp_id, canal')
      .eq('id', conversaId)
      .maybeSingle()

    let wahaMessageId: string | null = null

    // Se é uma conversa WhatsApp com sessão, enviar via WAHA
    if (conversa?.sessao_whatsapp_id && conversa?.canal === 'whatsapp') {
      // Buscar session_name da sessão
      const { data: sessao } = await supabase
        .from('sessoes_whatsapp')
        .select('session_name')
        .eq('id', conversa.sessao_whatsapp_id)
        .maybeSingle()

      if (sessao?.session_name) {
        const { data: wahaResult, error: wahaError } = await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'enviar_mensagem',
            session_name: sessao.session_name,
            chat_id: conversa.chat_id,
            text: texto,
            reply_to: replyTo || undefined,
          },
        })

        if (wahaError) {
          console.error('[conversas.api] Erro ao enviar via WAHA:', wahaError)
          throw new Error('Erro ao enviar mensagem pelo WhatsApp')
        }

        if (wahaResult?.error) {
          console.error('[conversas.api] WAHA retornou erro:', wahaResult.error)
          throw new Error(wahaResult.error)
        }

        wahaMessageId = wahaResult?.message_id || null
        console.log('[conversas.api] Mensagem enviada via WAHA, messageId:', wahaMessageId)
      }
    }

    // Salvar mensagem no banco
    const { data, error } = await supabase
      .from('mensagens')
      .insert({
        organizacao_id: organizacaoId,
        conversa_id: conversaId,
        message_id: wahaMessageId || `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        from_me: true,
        tipo: 'text',
        body: texto,
        has_media: false,
        ack: wahaMessageId ? 1 : 0,
        reply_to_message_id: replyTo || null,
        ...(isTemplate ? { raw_data: { is_template: true } } : {}),
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    // Atualizar conversa metadata
    await supabase
      .from('conversas')
      .update({
        ultima_mensagem_em: new Date().toISOString(),
        total_mensagens: (await supabase.from('mensagens').select('id', { count: 'exact', head: true }).eq('conversa_id', conversaId).is('deletado_em', null)).count || 0,
      })
      .eq('id', conversaId)

    return data as Mensagem
  },

  /**
   * Envia mídia. Se é WhatsApp com sessão, envia via WAHA API.
   */
  async enviarMedia(conversaId: string, dados: { tipo: string; media_url: string; caption?: string; filename?: string; mimetype?: string }): Promise<Mensagem> {
    const organizacaoId = await getOrganizacaoId()

    // Buscar dados da conversa
    const { data: conversa } = await supabase
      .from('conversas')
      .select('chat_id, sessao_whatsapp_id, canal')
      .eq('id', conversaId)
      .maybeSingle()

    let wahaMessageId: string | null = null

    // Se é WhatsApp com sessão, enviar via WAHA
    if (conversa?.sessao_whatsapp_id && conversa?.canal === 'whatsapp') {
      const { data: sessao } = await supabase
        .from('sessoes_whatsapp')
        .select('session_name')
        .eq('id', conversa.sessao_whatsapp_id)
        .maybeSingle()

      if (sessao?.session_name) {
        const { data: wahaResult, error: wahaError } = await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'enviar_media',
            session_name: sessao.session_name,
            chat_id: conversa.chat_id,
            media_url: dados.media_url,
            media_type: dados.tipo,
            caption: dados.caption,
            filename: dados.filename,
            mimetype: dados.mimetype,
          },
        })

        if (wahaError) {
          console.error('[conversas.api] Erro ao enviar mídia via WAHA:', wahaError)
          throw new Error('Erro ao enviar mídia pelo WhatsApp')
        }

        if (wahaResult?.error) {
          throw new Error(wahaResult.error)
        }

        wahaMessageId = wahaResult?.message_id || null
      }
    }

    const { data, error } = await supabase
      .from('mensagens')
      .insert({
        organizacao_id: organizacaoId,
        conversa_id: conversaId,
        message_id: wahaMessageId || `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        from_me: true,
        tipo: dados.tipo,
        caption: dados.caption || null,
        has_media: true,
        media_url: dados.media_url,
        media_filename: dados.filename || null,
        media_mimetype: dados.mimetype || null,
        ack: wahaMessageId ? 1 : 0,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data as Mensagem
  },

  /**
   * Envia contato vCard. Se é WhatsApp com sessão, envia via WAHA API.
   */
  async enviarContato(conversaId: string, dados: { contact_name: string; vcard: string }): Promise<Mensagem> {
    const organizacaoId = await getOrganizacaoId()

    const { data: conversa } = await supabase
      .from('conversas')
      .select('chat_id, sessao_whatsapp_id, canal')
      .eq('id', conversaId)
      .maybeSingle()

    let wahaMessageId: string | null = null

    if (conversa?.sessao_whatsapp_id && conversa?.canal === 'whatsapp') {
      const { data: sessao } = await supabase
        .from('sessoes_whatsapp')
        .select('session_name')
        .eq('id', conversa.sessao_whatsapp_id)
        .maybeSingle()

      if (sessao?.session_name) {
        const { data: wahaResult, error: wahaError } = await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'enviar_contato',
            session_name: sessao.session_name,
            chat_id: conversa.chat_id,
            contact_name: dados.contact_name,
            vcard: dados.vcard,
          },
        })

        if (wahaError) throw new Error('Erro ao enviar contato pelo WhatsApp')
        if (wahaResult?.error) throw new Error(wahaResult.error)
        wahaMessageId = wahaResult?.message_id || null
      }
    }

    const { data, error } = await supabase
      .from('mensagens')
      .insert({
        organizacao_id: organizacaoId,
        conversa_id: conversaId,
        message_id: wahaMessageId || `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        from_me: true,
        tipo: 'contact',
        vcard: dados.vcard,
        body: `Contato: ${dados.contact_name}`,
        has_media: false,
        ack: wahaMessageId ? 1 : 0,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    await supabase
      .from('conversas')
      .update({ ultima_mensagem_em: new Date().toISOString() })
      .eq('id', conversaId)

    return data as Mensagem
  },

  /**
   * Envia enquete (poll). Se é WhatsApp com sessão, envia via WAHA API.
   */
  async enviarEnquete(conversaId: string, dados: { poll_name: string; poll_options: string[]; poll_allow_multiple: boolean }): Promise<Mensagem> {
    const organizacaoId = await getOrganizacaoId()

    const { data: conversa } = await supabase
      .from('conversas')
      .select('chat_id, sessao_whatsapp_id, canal')
      .eq('id', conversaId)
      .maybeSingle()

    let wahaMessageId: string | null = null

    if (conversa?.sessao_whatsapp_id && conversa?.canal === 'whatsapp') {
      const { data: sessao } = await supabase
        .from('sessoes_whatsapp')
        .select('session_name')
        .eq('id', conversa.sessao_whatsapp_id)
        .maybeSingle()

      if (sessao?.session_name) {
        const { data: wahaResult, error: wahaError } = await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'enviar_enquete',
            session_name: sessao.session_name,
            chat_id: conversa.chat_id,
            poll_name: dados.poll_name,
            poll_options: dados.poll_options,
            poll_allow_multiple: dados.poll_allow_multiple,
          },
        })

        if (wahaError) throw new Error('Erro ao enviar enquete pelo WhatsApp')
        if (wahaResult?.error) throw new Error(wahaResult.error)
        wahaMessageId = wahaResult?.message_id || null
      }
    }

    const pollOptions = dados.poll_options.map(opt => ({ text: opt, votes: 0 }))

    const { data, error } = await supabase
      .from('mensagens')
      .insert({
        organizacao_id: organizacaoId,
        conversa_id: conversaId,
        message_id: wahaMessageId || `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        from_me: true,
        tipo: 'poll',
        poll_question: dados.poll_name,
        poll_options: pollOptions,
        poll_allow_multiple: dados.poll_allow_multiple,
        body: `📊 ${dados.poll_name}`,
        has_media: false,
        ack: wahaMessageId ? 1 : 0,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    await supabase
      .from('conversas')
      .update({ ultima_mensagem_em: new Date().toISOString() })
      .eq('id', conversaId)

    return data as Mensagem
  },

  /**
   * Consulta votos de uma enquete via WAHA API
   */
  async consultarVotosEnquete(conversaId: string, messageId: string): Promise<{ poll_options?: Array<{ text: string; votes: number }>; engine_limitation?: boolean } | null> {
    const { data: conversa } = await supabase
      .from('conversas')
      .select('sessao_whatsapp_id, canal')
      .eq('id', conversaId)
      .maybeSingle()

    if (!conversa?.sessao_whatsapp_id || conversa?.canal !== 'whatsapp') return null

    const { data: sessao } = await supabase
      .from('sessoes_whatsapp')
      .select('session_name')
      .eq('id', conversa.sessao_whatsapp_id)
      .maybeSingle()

    if (!sessao?.session_name) return null

    const { data, error } = await supabase.functions.invoke('waha-proxy', {
      body: {
        action: 'consultar_votos_enquete',
        session_name: sessao.session_name,
        message_id: messageId,
        conversa_id: conversaId,
      },
    })

    if (error) {
      console.error('[conversasApi] Erro ao consultar votos:', error)
      return null
    }

    return data
  },

  // --- Mensagens Prontas ---

  async listarProntas(params?: { busca?: string }): Promise<{ mensagens_prontas: MensagemPronta[]; total: number }> {
    const organizacaoId = await getOrganizacaoId()

    let query = supabase
      .from('mensagens_prontas')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', organizacaoId)
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('titulo')

    if (params?.busca) {
      query = query.or(`titulo.ilike.%${params.busca}%,atalho.ilike.%${params.busca}%,conteudo.ilike.%${params.busca}%`)
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    return {
      mensagens_prontas: (data || []) as MensagemPronta[],
      total: count || 0,
    }
  },

  async criarPronta(dados: { atalho: string; titulo: string; conteudo: string; tipo?: 'pessoal' | 'global' }): Promise<MensagemPronta> {
    const organizacaoId = await getOrganizacaoId()
    const usuarioId = await getUsuarioId()

    const { data, error } = await supabase
      .from('mensagens_prontas')
      .insert({
        organizacao_id: organizacaoId,
        usuario_id: dados.tipo === 'pessoal' ? usuarioId : null,
        atalho: dados.atalho,
        titulo: dados.titulo,
        conteudo: dados.conteudo,
        tipo: dados.tipo || 'pessoal',
        ativo: true,
        vezes_usado: 0,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data as MensagemPronta
  },

  async excluirPronta(id: string): Promise<void> {
    const { error } = await supabase
      .from('mensagens_prontas')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  // --- Notas do Contato ---

  async listarNotas(contatoId: string): Promise<{ notas: NotaContato[]; total: number }> {
    const { data, error, count } = await supabase
      .from('notas_contato')
      .select(`
        *,
        usuario:usuarios!notas_contato_usuario_id_fkey(id, nome)
      `, { count: 'exact' })
      .eq('contato_id', contatoId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(error.message)

    return {
      notas: (data || []) as unknown as NotaContato[],
      total: count || 0,
    }
  },

  async criarNota(contatoId: string, conteudo: string): Promise<NotaContato> {
    const organizacaoId = await getOrganizacaoId()
    const usuarioId = await getUsuarioId()

    const { data, error } = await supabase
      .from('notas_contato')
      .insert({
        organizacao_id: organizacaoId,
        contato_id: contatoId,
        usuario_id: usuarioId,
        conteudo,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data as unknown as NotaContato
  },

  // --- Busca de Contatos (para nova conversa) ---

  async buscarContatos(busca: string): Promise<ConversaContato[]> {
    const organizacaoId = await getOrganizacaoId()

    let query = supabase
      .from('contatos')
      .select('id, nome, nome_fantasia, email, telefone')
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)

    if (busca.length >= 2) {
      query = query.or(`nome.ilike.%${busca}%,nome_fantasia.ilike.%${busca}%,email.ilike.%${busca}%,telefone.ilike.%${busca}%`)
    }

    const { data, error } = await query
      .order('atualizado_em', { ascending: false })
      .limit(busca.length >= 2 ? 10 : 8)

    if (error) throw new Error(error.message)
    return (data || []) as ConversaContato[]
  },
}

export default conversasApi
