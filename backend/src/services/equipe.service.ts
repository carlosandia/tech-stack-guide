/**
 * AIDEV-NOTE: Service para Gestao de Equipes e Membros
 * Conforme PRD-05 - Gestao de Equipe (Admin Only)
 */

import { supabaseAdmin } from '../config/supabase'

const supabase = supabaseAdmin
import type {
  Equipe,
  EquipeComMembros,
  CriarEquipePayload,
  AtualizarEquipePayload,
  AdicionarMembroPayload,
  ListaEquipesResponse,
  UsuarioTenant,
  ConvidarUsuarioPayload,
  AtualizarUsuarioPayload,
  AlterarStatusUsuarioPayload,
  ListaUsuariosResponse,
  PerfilPermissao,
  CriarPerfilPayload,
  AtualizarPerfilPayload,
  ListaPerfisResponse,
} from '../schemas/equipe'

// =====================================================
// EQUIPES
// =====================================================

export async function listarEquipes(
  organizacaoId: string,
  filtros?: {
    busca?: string
    ativa?: boolean
  }
): Promise<ListaEquipesResponse> {
  const { busca, ativa } = filtros || {}

  let query = supabase
    .from('equipes')
    .select(
      `
      *,
      membros:equipes_membros(
        id,
        usuario_id,
        papel,
        adicionado_em,
        usuario:usuarios(id, nome, sobrenome, email, avatar_url)
      )
    `,
      { count: 'exact' }
    )
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (busca) {
    query = query.ilike('nome', `%${busca}%`)
  }

  if (ativa !== undefined) {
    query = query.eq('ativa', ativa)
  }

  const { data, error, count } = await query.order('nome', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar equipes: ${error.message}`)
  }

  // Processar dados para formato esperado
  const equipes = (data || []).map(processarEquipeComMembros)

  return {
    equipes: equipes as EquipeComMembros[],
    total: count || 0,
  }
}

export async function buscarEquipe(
  organizacaoId: string,
  equipeId: string
): Promise<EquipeComMembros | null> {
  const { data, error } = await supabase
    .from('equipes')
    .select(
      `
      *,
      membros:equipes_membros(
        id,
        usuario_id,
        papel,
        adicionado_em,
        usuario:usuarios(id, nome, sobrenome, email, avatar_url)
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('id', equipeId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar equipe: ${error.message}`)
  }

  return processarEquipeComMembros(data) as EquipeComMembros
}

export async function criarEquipe(
  organizacaoId: string,
  payload: CriarEquipePayload,
  criadoPor?: string
): Promise<Equipe> {
  const { data, error } = await supabase
    .from('equipes')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar equipe: ${error.message}`)
  }

  // Se tiver lider, adicionar como membro
  if (payload.lider_id) {
    await adicionarMembroEquipe(data.id, {
      usuario_id: payload.lider_id,
      papel: 'lider',
    })
  }

  return data as Equipe
}

export async function atualizarEquipe(
  organizacaoId: string,
  equipeId: string,
  payload: AtualizarEquipePayload
): Promise<Equipe> {
  const { data, error } = await supabase
    .from('equipes')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', equipeId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar equipe: ${error.message}`)
  }

  return data as Equipe
}

export async function excluirEquipe(
  organizacaoId: string,
  equipeId: string
): Promise<void> {
  // Remover membros primeiro
  await supabase.from('equipes_membros').delete().eq('equipe_id', equipeId)

  // Soft delete da equipe
  const { error } = await supabase
    .from('equipes')
    .update({
      deletado_em: new Date().toISOString(),
      ativa: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', equipeId)

  if (error) {
    throw new Error(`Erro ao excluir equipe: ${error.message}`)
  }
}

// =====================================================
// MEMBROS DA EQUIPE
// =====================================================

export async function adicionarMembroEquipe(
  equipeId: string,
  payload: AdicionarMembroPayload,
  adicionadoPor?: string
): Promise<void> {
  // Verificar se usuario ja esta na equipe
  const { data: existente } = await supabase
    .from('equipes_membros')
    .select('id')
    .eq('equipe_id', equipeId)
    .eq('usuario_id', payload.usuario_id)
    .single()

  if (existente) {
    throw new Error('Usuario ja e membro desta equipe')
  }

  const { error } = await supabase.from('equipes_membros').insert({
    equipe_id: equipeId,
    usuario_id: payload.usuario_id,
    papel: payload.papel || 'membro',
    adicionado_por: adicionadoPor,
  })

  if (error) {
    throw new Error(`Erro ao adicionar membro: ${error.message}`)
  }
}

export async function removerMembroEquipe(
  equipeId: string,
  usuarioId: string
): Promise<void> {
  const { error } = await supabase
    .from('equipes_membros')
    .delete()
    .eq('equipe_id', equipeId)
    .eq('usuario_id', usuarioId)

  if (error) {
    throw new Error(`Erro ao remover membro: ${error.message}`)
  }
}

export async function alterarPapelMembro(
  equipeId: string,
  usuarioId: string,
  papel: 'lider' | 'membro'
): Promise<void> {
  const { error } = await supabase
    .from('equipes_membros')
    .update({ papel })
    .eq('equipe_id', equipeId)
    .eq('usuario_id', usuarioId)

  if (error) {
    throw new Error(`Erro ao alterar papel: ${error.message}`)
  }
}

// =====================================================
// USUARIOS DO TENANT
// =====================================================

export async function listarUsuarios(
  organizacaoId: string,
  filtros?: {
    busca?: string
    status?: string
    equipeId?: string
    papelId?: string
    page?: number
    limit?: number
  }
): Promise<ListaUsuariosResponse> {
  const { busca, status, equipeId, papelId, page = 1, limit = 20 } = filtros || {}
  const offset = (page - 1) * limit

  let query = supabase
    .from('usuarios')
    .select(
      `
      *,
      papel:perfis_permissao(id, nome)
    `,
      { count: 'exact' }
    )
    .eq('organizacao_id', organizacaoId)

  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`)
  }

  if (status && status !== 'todos') {
    query = query.eq('status', status)
  }

  if (papelId) {
    query = query.eq('papel_id', papelId)
  }

  const { data, error, count } = await query
    .order('nome', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Erro ao listar usuarios: ${error.message}`)
  }

  // Se filtrar por equipe, fazer join adicional
  let usuarios = data || []

  if (equipeId) {
    const { data: membrosEquipe } = await supabase
      .from('equipes_membros')
      .select('usuario_id')
      .eq('equipe_id', equipeId)

    const usuariosEquipe = new Set((membrosEquipe || []).map((m) => m.usuario_id))
    usuarios = usuarios.filter((u) => usuariosEquipe.has(u.id))
  }

  return {
    usuarios: usuarios.map((u) => ({
      ...u,
      papel_nome: u.papel?.nome || null,
    })) as UsuarioTenant[],
    total: count || 0,
    page,
    total_paginas: Math.ceil((count || 0) / limit),
  }
}

export async function buscarUsuario(
  organizacaoId: string,
  usuarioId: string
): Promise<UsuarioTenant | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select(
      `
      *,
      papel:perfis_permissao(id, nome)
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('id', usuarioId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar usuario: ${error.message}`)
  }

  return {
    ...data,
    papel_nome: data.papel?.nome || null,
  } as UsuarioTenant
}

export async function convidarUsuario(
  organizacaoId: string,
  payload: ConvidarUsuarioPayload,
  convidadoPor?: string
): Promise<UsuarioTenant> {
  // Verificar se email ja existe na organizacao
  const { data: existente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('organizacao_id', organizacaoId)
    .eq('email', payload.email)
    .single()

  if (existente) {
    throw new Error('Ja existe um usuario com este email na organizacao')
  }

  // Criar usuario com status pendente
  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      organizacao_id: organizacaoId,
      nome: payload.nome,
      sobrenome: payload.sobrenome,
      email: payload.email,
      papel_id: payload.papel_id,
      status: 'pendente',
      criado_por: convidadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao convidar usuario: ${error.message}`)
  }

  // Adicionar em equipes se especificado
  if (payload.equipe_ids && payload.equipe_ids.length > 0) {
    for (const equipeId of payload.equipe_ids) {
      await adicionarMembroEquipe(equipeId, { usuario_id: data.id }, convidadoPor)
    }
  }

  // AIDEV-TODO: Enviar email de convite

  return data as UsuarioTenant
}

export async function atualizarUsuario(
  organizacaoId: string,
  usuarioId: string,
  payload: AtualizarUsuarioPayload
): Promise<UsuarioTenant> {
  const { equipe_ids, ...dadosUsuario } = payload

  const { data, error } = await supabase
    .from('usuarios')
    .update({
      ...dadosUsuario,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', usuarioId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar usuario: ${error.message}`)
  }

  // Atualizar equipes se especificado
  if (equipe_ids !== undefined) {
    // Remover de todas equipes atuais
    await supabase.from('equipes_membros').delete().eq('usuario_id', usuarioId)

    // Adicionar nas novas equipes
    for (const equipeId of equipe_ids) {
      await adicionarMembroEquipe(equipeId, { usuario_id: usuarioId })
    }
  }

  return data as UsuarioTenant
}

export async function alterarStatusUsuario(
  organizacaoId: string,
  usuarioId: string,
  payload: AlterarStatusUsuarioPayload
): Promise<UsuarioTenant> {
  const { data, error } = await supabase
    .from('usuarios')
    .update({
      status: payload.status,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', usuarioId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao alterar status: ${error.message}`)
  }

  return data as UsuarioTenant
}

export async function reenviarConvite(
  organizacaoId: string,
  usuarioId: string
): Promise<void> {
  const usuario = await buscarUsuario(organizacaoId, usuarioId)

  if (!usuario) {
    throw new Error('Usuario nao encontrado')
  }

  if (usuario.status !== 'pendente') {
    throw new Error('Usuario ja aceitou o convite')
  }

  // AIDEV-TODO: Implementar reenvio de email de convite
  console.log(`Reenviando convite para ${usuario.email}`)
}

// =====================================================
// PERFIS DE PERMISSAO
// =====================================================

export async function listarPerfis(
  organizacaoId: string
): Promise<ListaPerfisResponse> {
  const { data, error, count } = await supabase
    .from('perfis_permissao')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .order('nome', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar perfis: ${error.message}`)
  }

  return {
    perfis: data as PerfilPermissao[],
    total: count || 0,
  }
}

export async function buscarPerfil(
  organizacaoId: string,
  perfilId: string
): Promise<PerfilPermissao | null> {
  const { data, error } = await supabase
    .from('perfis_permissao')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', perfilId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar perfil: ${error.message}`)
  }

  return data as PerfilPermissao
}

export async function criarPerfil(
  organizacaoId: string,
  payload: CriarPerfilPayload,
  criadoPor?: string
): Promise<PerfilPermissao> {
  const { data, error } = await supabase
    .from('perfis_permissao')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      is_sistema: false,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar perfil: ${error.message}`)
  }

  return data as PerfilPermissao
}

export async function atualizarPerfil(
  organizacaoId: string,
  perfilId: string,
  payload: AtualizarPerfilPayload
): Promise<PerfilPermissao> {
  // Verificar se perfil existe e nao e do sistema
  const perfilExistente = await buscarPerfil(organizacaoId, perfilId)

  if (!perfilExistente) {
    throw new Error('Perfil nao encontrado')
  }

  if (perfilExistente.is_sistema) {
    throw new Error('Perfis do sistema nao podem ser alterados')
  }

  const { data, error } = await supabase
    .from('perfis_permissao')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', perfilId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar perfil: ${error.message}`)
  }

  return data as PerfilPermissao
}

export async function excluirPerfil(
  organizacaoId: string,
  perfilId: string
): Promise<void> {
  // Verificar se perfil existe e nao e do sistema
  const perfilExistente = await buscarPerfil(organizacaoId, perfilId)

  if (!perfilExistente) {
    throw new Error('Perfil nao encontrado')
  }

  if (perfilExistente.is_sistema) {
    throw new Error('Perfis do sistema nao podem ser excluidos')
  }

  // Verificar se tem usuarios vinculados
  const { count } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId)
    .eq('papel_id', perfilId)

  if (count && count > 0) {
    throw new Error('Nao e possivel excluir perfil com usuarios vinculados')
  }

  const { error } = await supabase
    .from('perfis_permissao')
    .update({
      deletado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', perfilId)

  if (error) {
    throw new Error(`Erro ao excluir perfil: ${error.message}`)
  }
}

// =====================================================
// Helpers
// =====================================================

function processarEquipeComMembros(equipe: Record<string, unknown>): Record<string, unknown> {
  const membros = (equipe.membros as Array<Record<string, unknown>>) || []

  const membrosProcessados = membros.map((m) => ({
    id: m.id,
    usuario_id: m.usuario_id,
    nome: (m.usuario as Record<string, unknown>)?.nome || '',
    sobrenome: (m.usuario as Record<string, unknown>)?.sobrenome || null,
    email: (m.usuario as Record<string, unknown>)?.email || '',
    avatar_url: (m.usuario as Record<string, unknown>)?.avatar_url || null,
    papel: m.papel,
    adicionado_em: m.adicionado_em,
  }))

  const lider = membrosProcessados.find((m) => m.papel === 'lider') || null

  return {
    ...equipe,
    membros: membrosProcessados,
    total_membros: membrosProcessados.length,
    lider,
  }
}

export default {
  // Equipes
  listarEquipes,
  buscarEquipe,
  criarEquipe,
  atualizarEquipe,
  excluirEquipe,
  // Membros
  adicionarMembroEquipe,
  removerMembroEquipe,
  alterarPapelMembro,
  // Usuarios
  listarUsuarios,
  buscarUsuario,
  convidarUsuario,
  atualizarUsuario,
  alterarStatusUsuario,
  reenviarConvite,
  // Perfis
  listarPerfis,
  buscarPerfil,
  criarPerfil,
  atualizarPerfil,
  excluirPerfil,
}
