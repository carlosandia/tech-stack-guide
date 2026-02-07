/**
 * AIDEV-NOTE: Service API para abas de detalhes da oportunidade
 * Tarefas, Documentos, E-mails, Reuniões
 * Separado do negocios.api.ts para manter arquivos focados
 */

import { supabase } from '@/lib/supabase'

// =====================================================
// Helpers reutilizáveis
// =====================================================

let _cachedOrgId: string | null = null
let _cachedUserId: string | null = null
let _cachedUserRole: string | null = null

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

async function getUserRole(): Promise<string> {
  if (_cachedUserRole) return _cachedUserRole
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')
  const { data } = await supabase
    .from('usuarios')
    .select('role')
    .eq('auth_id', user.id)
    .maybeSingle()
  _cachedUserRole = data?.role || 'member'
  return _cachedUserRole
}

supabase.auth.onAuthStateChange(() => {
  _cachedOrgId = null
  _cachedUserId = null
  _cachedUserRole = null
})

// =====================================================
// Types
// =====================================================

export interface Tarefa {
  id: string
  titulo: string
  descricao?: string | null
  tipo: string
  canal?: string | null
  status: string
  prioridade: string | null
  data_vencimento?: string | null
  data_conclusao?: string | null
  owner_id?: string | null
  criado_por_id?: string | null
  tarefa_template_id?: string | null
  etapa_origem_id?: string | null
  criado_em: string
  owner?: { id: string; nome: string } | null
}

export interface Documento {
  id: string
  nome_arquivo: string
  tipo_arquivo: string | null
  tamanho_bytes: number | null
  storage_path: string
  url_download?: string | null
  criado_em: string
  usuario_id: string
  usuario?: { id: string; nome: string } | null
}

export interface EmailOportunidade {
  id: string
  destinatario: string
  assunto: string | null
  corpo: string | null
  anexos?: unknown[] | null
  status: string
  erro_mensagem?: string | null
  enviado_em?: string | null
  criado_em: string
  usuario_id: string
  usuario?: { id: string; nome: string } | null
}

export interface Reuniao {
  id: string
  titulo: string
  descricao?: string | null
  local?: string | null
  data_inicio: string
  data_fim?: string | null
  status: string
  motivo_noshow?: string | null
  motivo_noshow_id?: string | null
  reuniao_reagendada_id?: string | null
  google_event_id?: string | null
  sincronizado_google?: boolean | null
  criado_em: string
  usuario_id: string
  usuario?: { id: string; nome: string } | null
}

export interface MotivoNoShow {
  id: string
  nome: string
  ativo: boolean
}

// =====================================================
// API Tarefas da Oportunidade
// =====================================================

export const detalhesApi = {
  // ---------- TAREFAS ----------

  listarTarefas: async (oportunidadeId: string): Promise<Tarefa[]> => {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('oportunidade_id', oportunidadeId)
      .is('deletado_em', null)
      .order('status', { ascending: true })
      .order('data_vencimento', { ascending: true, nullsFirst: false })
      .order('criado_em', { ascending: false })

    if (error) throw new Error(error.message)

    const tarefas = data || []

    // Enriquecer com owner
    const ownerIds = [...new Set(tarefas.filter(t => t.owner_id).map(t => t.owner_id!))]
    let ownersMap: Record<string, { id: string; nome: string }> = {}

    if (ownerIds.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', ownerIds)

      if (usuarios) {
        for (const u of usuarios) {
          ownersMap[u.id] = { id: u.id, nome: u.nome }
        }
      }
    }

    return tarefas.map(t => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao,
      tipo: t.tipo,
      canal: t.canal,
      status: t.status,
      prioridade: t.prioridade,
      data_vencimento: t.data_vencimento,
      data_conclusao: t.data_conclusao,
      owner_id: t.owner_id,
      criado_por_id: t.criado_por_id,
      tarefa_template_id: t.tarefa_template_id,
      etapa_origem_id: t.etapa_origem_id,
      criado_em: t.criado_em,
      owner: t.owner_id ? ownersMap[t.owner_id] || null : null,
    }))
  },

  criarTarefa: async (oportunidadeId: string, payload: {
    titulo: string
    descricao?: string
    tipo?: string
    prioridade?: string
    data_vencimento?: string
    owner_id?: string
  }): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { error } = await supabase
      .from('tarefas')
      .insert({
        organizacao_id: organizacaoId,
        oportunidade_id: oportunidadeId,
        titulo: payload.titulo,
        descricao: payload.descricao || null,
        tipo: payload.tipo || 'tarefa',
        prioridade: payload.prioridade || 'media',
        data_vencimento: payload.data_vencimento || null,
        owner_id: payload.owner_id || userId,
        criado_por_id: userId,
        status: 'pendente',
      } as any)

    if (error) throw new Error(error.message)
  },

  atualizarStatusTarefa: async (tarefaId: string, status: string): Promise<void> => {
    const updateData: Record<string, unknown> = { status }
    if (status === 'concluida') {
      updateData.data_conclusao = new Date().toISOString()
    } else {
      updateData.data_conclusao = null
    }

    const { error } = await supabase
      .from('tarefas')
      .update(updateData as any)
      .eq('id', tarefaId)

    if (error) throw new Error(error.message)
  },

  excluirTarefa: async (tarefaId: string): Promise<void> => {
    const { error } = await supabase
      .from('tarefas')
      .update({ deletado_em: new Date().toISOString() } as any)
      .eq('id', tarefaId)

    if (error) throw new Error(error.message)
  },

  // ---------- DOCUMENTOS ----------

  listarDocumentos: async (oportunidadeId: string): Promise<Documento[]> => {
    const { data, error } = await supabase
      .from('documentos_oportunidades')
      .select('*')
      .eq('oportunidade_id', oportunidadeId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(error.message)

    const docs = data || []

    // Enriquecer com usuario
    const userIds = [...new Set(docs.map(d => d.usuario_id))]
    let usersMap: Record<string, { id: string; nome: string }> = {}

    if (userIds.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', userIds)

      if (usuarios) {
        for (const u of usuarios) {
          usersMap[u.id] = { id: u.id, nome: u.nome }
        }
      }
    }

    return docs.map(d => ({
      id: d.id,
      nome_arquivo: d.nome_arquivo,
      tipo_arquivo: d.tipo_arquivo,
      tamanho_bytes: d.tamanho_bytes,
      storage_path: d.storage_path,
      url_download: d.url_download,
      criado_em: d.criado_em,
      usuario_id: d.usuario_id,
      usuario: usersMap[d.usuario_id] || null,
    }))
  },

  uploadDocumento: async (oportunidadeId: string, file: File): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const storagePath = `${organizacaoId}/${oportunidadeId}/${fileName}`

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documentos-oportunidades')
      .upload(storagePath, file)

    if (uploadError) throw new Error(uploadError.message)

    // Salvar registro no banco
    const { error: dbError } = await supabase
      .from('documentos_oportunidades')
      .insert({
        organizacao_id: organizacaoId,
        oportunidade_id: oportunidadeId,
        usuario_id: userId,
        nome_arquivo: file.name,
        tipo_arquivo: file.type || 'application/octet-stream',
        tamanho_bytes: file.size,
        storage_path: storagePath,
      } as any)

    if (dbError) throw new Error(dbError.message)
  },

  getDocumentoUrl: async (storagePath: string): Promise<string> => {
    const { data } = await supabase.storage
      .from('documentos-oportunidades')
      .createSignedUrl(storagePath, 3600) // URL válida por 1 hora

    if (!data?.signedUrl) throw new Error('Erro ao gerar URL de download')
    return data.signedUrl
  },

  excluirDocumento: async (documentoId: string, storagePath: string): Promise<void> => {
    // Soft delete no banco
    const { error: dbError } = await supabase
      .from('documentos_oportunidades')
      .update({ deletado_em: new Date().toISOString() } as any)
      .eq('id', documentoId)

    if (dbError) throw new Error(dbError.message)

    // Remover do storage
    await supabase.storage
      .from('documentos-oportunidades')
      .remove([storagePath])
  },

  // ---------- E-MAILS ----------

  listarEmails: async (oportunidadeId: string): Promise<EmailOportunidade[]> => {
    const { data, error } = await supabase
      .from('emails_oportunidades')
      .select('*')
      .eq('oportunidade_id', oportunidadeId)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(error.message)

    const emails = data || []

    const userIds = [...new Set(emails.map(e => e.usuario_id))]
    let usersMap: Record<string, { id: string; nome: string }> = {}

    if (userIds.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', userIds)

      if (usuarios) {
        for (const u of usuarios) {
          usersMap[u.id] = { id: u.id, nome: u.nome }
        }
      }
    }

    return emails.map(e => ({
      id: e.id,
      destinatario: e.destinatario,
      assunto: e.assunto,
      corpo: e.corpo,
      anexos: e.anexos as unknown[] | null,
      status: e.status,
      erro_mensagem: e.erro_mensagem,
      enviado_em: e.enviado_em,
      criado_em: e.criado_em,
      usuario_id: e.usuario_id,
      usuario: usersMap[e.usuario_id] || null,
    }))
  },

  criarEmail: async (oportunidadeId: string, payload: {
    destinatario: string
    assunto: string
    corpo: string
  }): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { error } = await supabase
      .from('emails_oportunidades')
      .insert({
        organizacao_id: organizacaoId,
        oportunidade_id: oportunidadeId,
        usuario_id: userId,
        destinatario: payload.destinatario,
        assunto: payload.assunto,
        corpo: payload.corpo,
        status: 'rascunho',
      } as any)

    if (error) throw new Error(error.message)
  },

  // ---------- REUNIÕES ----------

  listarReunioes: async (oportunidadeId: string): Promise<Reuniao[]> => {
    const { data, error } = await supabase
      .from('reunioes_oportunidades')
      .select('*')
      .eq('oportunidade_id', oportunidadeId)
      .is('deletado_em', null)
      .order('data_inicio', { ascending: false })

    if (error) throw new Error(error.message)

    const reunioes = data || []

    const userIds = [...new Set(reunioes.map(r => r.usuario_id))]
    let usersMap: Record<string, { id: string; nome: string }> = {}

    if (userIds.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', userIds)

      if (usuarios) {
        for (const u of usuarios) {
          usersMap[u.id] = { id: u.id, nome: u.nome }
        }
      }
    }

    return reunioes.map(r => ({
      id: r.id,
      titulo: r.titulo,
      descricao: r.descricao,
      local: r.local,
      data_inicio: r.data_inicio,
      data_fim: r.data_fim,
      status: r.status,
      motivo_noshow: r.motivo_noshow,
      motivo_noshow_id: r.motivo_noshow_id,
      reuniao_reagendada_id: r.reuniao_reagendada_id,
      google_event_id: r.google_event_id,
      sincronizado_google: r.sincronizado_google,
      criado_em: r.criado_em,
      usuario_id: r.usuario_id,
      usuario: usersMap[r.usuario_id] || null,
    }))
  },

  criarReuniao: async (oportunidadeId: string, payload: {
    titulo: string
    descricao?: string
    local?: string
    data_inicio: string
    data_fim?: string
  }): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { error } = await supabase
      .from('reunioes_oportunidades')
      .insert({
        organizacao_id: organizacaoId,
        oportunidade_id: oportunidadeId,
        usuario_id: userId,
        titulo: payload.titulo,
        descricao: payload.descricao || null,
        local: payload.local || null,
        data_inicio: payload.data_inicio,
        data_fim: payload.data_fim || null,
        status: 'agendada',
      } as any)

    if (error) throw new Error(error.message)
  },

  atualizarStatusReuniao: async (reuniaoId: string, status: string, extras?: {
    motivo_noshow?: string
    motivo_noshow_id?: string
  }): Promise<void> => {
    const updateData: Record<string, unknown> = { status }
    if (extras?.motivo_noshow) updateData.motivo_noshow = extras.motivo_noshow
    if (extras?.motivo_noshow_id) updateData.motivo_noshow_id = extras.motivo_noshow_id

    const { error } = await supabase
      .from('reunioes_oportunidades')
      .update(updateData as any)
      .eq('id', reuniaoId)

    if (error) throw new Error(error.message)
  },

  excluirReuniao: async (reuniaoId: string): Promise<void> => {
    const { error } = await supabase
      .from('reunioes_oportunidades')
      .update({ deletado_em: new Date().toISOString() } as any)
      .eq('id', reuniaoId)

    if (error) throw new Error(error.message)
  },

  listarMotivosNoShow: async (): Promise<MotivoNoShow[]> => {
    const { data, error } = await supabase
      .from('motivos_noshow')
      .select('id, nome, ativo')
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('ordem', { ascending: true })

    if (error) throw new Error(error.message)
    return (data || []) as MotivoNoShow[]
  },

  // ---------- ROLE CHECK (para isolamento member/admin) ----------
  getUserRole,
  getUsuarioId,
}
