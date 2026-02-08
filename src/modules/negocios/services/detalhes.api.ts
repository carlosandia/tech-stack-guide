/**
 * AIDEV-NOTE: Service API para abas de detalhes da oportunidade
 * Tarefas, Documentos, E-mails, Reuniões
 * Separado do negocios.api.ts para manter arquivos focados
 */

import { supabase } from '@/lib/supabase'

// =====================================================
// Compressão de imagens (client-side)
// =====================================================

const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_DIMENSION = 1920
const COMPRESS_QUALITY = 0.8

async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE_TYPES.includes(file.type)) return file

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size < 500 * 1024) {
        resolve(file)
        return
      }

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return }
          const ext = file.name.replace(/\.[^.]+$/, '')
          resolve(new File([blob], `${ext}.jpg`, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        COMPRESS_QUALITY,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

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

    // Comprimir imagem antes do upload (transparente para não-imagens)
    const processedFile = await compressImage(file)

    const fileExt = processedFile.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const storagePath = `${organizacaoId}/${oportunidadeId}/${fileName}`

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documentos-oportunidades')
      .upload(storagePath, processedFile)

    if (uploadError) throw new Error(uploadError.message)

    // Salvar registro no banco (tamanho após compressão)
    const { error: dbError } = await supabase
      .from('documentos_oportunidades')
      .insert({
        organizacao_id: organizacaoId,
        oportunidade_id: oportunidadeId,
        usuario_id: userId,
        nome_arquivo: file.name, // nome original do usuário
        tipo_arquivo: processedFile.type || 'application/octet-stream',
        tamanho_bytes: processedFile.size, // tamanho comprimido
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
  }, enviar: boolean = false): Promise<{ emailId?: string }> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // Salvar no banco como rascunho ou pendente
    const { data, error } = await supabase
      .from('emails_oportunidades')
      .insert({
        organizacao_id: organizacaoId,
        oportunidade_id: oportunidadeId,
        usuario_id: userId,
        destinatario: payload.destinatario,
        assunto: payload.assunto,
        corpo: payload.corpo,
        status: enviar ? 'pendente' : 'rascunho',
      } as any)
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    // Se deve enviar, chamar Edge Function send-email
    if (enviar && data?.id) {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke('send-email', {
          body: {
            to: payload.destinatario,
            subject: payload.assunto,
            body: payload.corpo,
            body_type: 'html',
          },
        })

        if (fnError) throw new Error(fnError.message || 'Erro ao enviar email')

        if (result?.sucesso) {
          await supabase
            .from('emails_oportunidades')
            .update({
              status: 'enviado',
              enviado_em: new Date().toISOString(),
            } as any)
            .eq('id', data.id)
        } else {
          const erroMsg = result?.mensagem || 'Erro desconhecido'
          await supabase
            .from('emails_oportunidades')
            .update({
              status: 'falhou',
              erro_mensagem: erroMsg,
            } as any)
            .eq('id', data.id)
          throw new Error(erroMsg)
        }
      } catch (err: any) {
        await supabase
          .from('emails_oportunidades')
          .update({
            status: 'falhou',
            erro_mensagem: err.message || 'Erro ao enviar email',
          } as any)
          .eq('id', data.id)
        throw err
      }
    }

    return { emailId: data?.id }
  },

  verificarConexaoEmail: async (): Promise<{ conectado: boolean; email?: string }> => {
    try {
      const userId = await getUsuarioId()
      const { data, error } = await supabase
        .from('conexoes_email')
        .select('id, email, status')
        .eq('usuario_id', userId)
        .is('deletado_em', null)
        .eq('status', 'ativo')
        .maybeSingle()

      if (error || !data) return { conectado: false }
      return { conectado: true, email: data.email }
    } catch {
      return { conectado: false }
    }
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

  // ---------- PRODUTOS DA OPORTUNIDADE ----------

  listarProdutosOportunidade: async (oportunidadeId: string) => {
    const { data, error } = await supabase
      .from('oportunidades_produtos')
      .select('*')
      .eq('oportunidade_id', oportunidadeId)
      .order('criado_em', { ascending: true })

    if (error) throw new Error(error.message)

    const produtos = data || []
    const produtoIds = [...new Set(produtos.map(p => p.produto_id))]

    let produtosMap: Record<string, { nome: string; sku?: string | null }> = {}
    if (produtoIds.length > 0) {
      const { data: prods } = await supabase
        .from('produtos')
        .select('id, nome, sku')
        .in('id', produtoIds)

      if (prods) {
        for (const p of prods) {
          produtosMap[p.id] = { nome: p.nome, sku: p.sku }
        }
      }
    }

    return produtos.map(p => ({
      id: p.id,
      produto_id: p.produto_id,
      quantidade: Number(p.quantidade),
      preco_unitario: Number(p.preco_unitario),
      desconto_percentual: Number(p.desconto_percentual || 0),
      subtotal: Number(p.subtotal),
      criado_em: p.criado_em,
      produto_nome: produtosMap[p.produto_id]?.nome || 'Produto removido',
      produto_sku: produtosMap[p.produto_id]?.sku || null,
    }))
  },

  adicionarProdutoOportunidade: async (
    oportunidadeId: string,
    produtoId: string,
    quantidade: number,
    precoUnitario: number,
    descontoPercentual: number = 0,
  ) => {
    const organizacaoId = await getOrganizacaoId()
    const subtotal = precoUnitario * quantidade * (1 - descontoPercentual / 100)

    const { error } = await supabase
      .from('oportunidades_produtos')
      .insert({
        organizacao_id: organizacaoId,
        oportunidade_id: oportunidadeId,
        produto_id: produtoId,
        quantidade,
        preco_unitario: precoUnitario,
        desconto_percentual: descontoPercentual,
        subtotal,
      } as any)

    if (error) throw new Error(error.message)

    // Recalcular valor total da oportunidade
    await detalhesApi.recalcularValorOportunidade(oportunidadeId)
  },

  atualizarProdutoOportunidade: async (
    id: string,
    payload: { quantidade?: number; preco_unitario?: number; desconto_percentual?: number },
    oportunidadeId: string,
  ) => {
    // Buscar dados atuais para recalcular subtotal
    const { data: atual } = await supabase
      .from('oportunidades_produtos')
      .select('quantidade, preco_unitario, desconto_percentual')
      .eq('id', id)
      .single()

    if (!atual) throw new Error('Produto não encontrado')

    const qtd = payload.quantidade ?? Number(atual.quantidade)
    const preco = payload.preco_unitario ?? Number(atual.preco_unitario)
    const desc = payload.desconto_percentual ?? Number(atual.desconto_percentual)
    const subtotal = preco * qtd * (1 - desc / 100)

    const { error } = await supabase
      .from('oportunidades_produtos')
      .update({ ...payload, subtotal } as any)
      .eq('id', id)

    if (error) throw new Error(error.message)

    await detalhesApi.recalcularValorOportunidade(oportunidadeId)
  },

  removerProdutoOportunidade: async (id: string, oportunidadeId: string) => {
    const { error } = await supabase
      .from('oportunidades_produtos')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)

    await detalhesApi.recalcularValorOportunidade(oportunidadeId)
  },

  recalcularValorOportunidade: async (oportunidadeId: string) => {
    const { data: produtos } = await supabase
      .from('oportunidades_produtos')
      .select('subtotal')
      .eq('oportunidade_id', oportunidadeId)

    const total = (produtos || []).reduce((sum, p) => sum + Number(p.subtotal), 0)

    await supabase
      .from('oportunidades')
      .update({ valor: total } as any)
      .eq('id', oportunidadeId)
  },

  buscarProdutosCatalogo: async (busca: string) => {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, sku, preco, moeda, unidade')
      .eq('ativo', true)
      .is('deletado_em', null)
      .ilike('nome', `%${busca}%`)
      .limit(10)
      .order('nome', { ascending: true })

    if (error) throw new Error(error.message)
    return (data || []) as Array<{
      id: string
      nome: string
      sku: string | null
      preco: number
      moeda: string
      unidade: string | null
    }>
  },

  // ---------- ROLE CHECK (para isolamento member/admin) ----------
  getUserRole,
  getUsuarioId,
}
