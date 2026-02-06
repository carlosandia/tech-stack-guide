/**
 * AIDEV-NOTE: Service para Contatos (Pessoas e Empresas)
 * Conforme PRD-06 - Modulo de Contatos
 *
 * Regras de visibilidade:
 * - Admin: ve todos contatos da organizacao
 * - Member: ve apenas contatos onde owner_id = seu ID
 */

import { supabaseAdmin } from '../config/supabase.js'
import type { UserRole } from '../schemas/common.js'

const supabase = supabaseAdmin

// =====================================================
// Tipos auxiliares
// =====================================================

interface ListarFiltros {
  tipo?: string
  status?: string
  origem?: string
  owner_id?: string
  segmento_id?: string
  empresa_id?: string
  busca?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  per_page?: number
  ordenar_por?: string
  ordem?: string
}

// =====================================================
// Listar Contatos com filtros e paginacao
// =====================================================

export async function listarContatos(
  organizacaoId: string,
  usuarioId: string,
  role: UserRole,
  filtros: ListarFiltros
) {
  const page = filtros.page || 1
  const perPage = filtros.per_page || 50
  const offset = (page - 1) * perPage

  let query = supabase
    .from('contatos')
    .select(
      '*, empresa:contatos!contatos_empresa_id_fkey(id, razao_social, nome_fantasia)',
      { count: 'exact' }
    )
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  // Filtro de visibilidade: Member ve apenas seus contatos
  if (role === 'member') {
    query = query.eq('owner_id', usuarioId)
  }

  // Filtros opcionais
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros.status) query = query.eq('status', filtros.status)
  if (filtros.origem) query = query.eq('origem', filtros.origem)
  if (filtros.owner_id) query = query.eq('owner_id', filtros.owner_id)
  if (filtros.empresa_id) query = query.eq('empresa_id', filtros.empresa_id)
  if (filtros.data_inicio) query = query.gte('criado_em', filtros.data_inicio)
  if (filtros.data_fim) query = query.lte('criado_em', filtros.data_fim)

  // Busca por nome, email, telefone, razao_social
  if (filtros.busca) {
    const busca = `%${filtros.busca}%`
    query = query.or(
      `nome.ilike.${busca},sobrenome.ilike.${busca},email.ilike.${busca},telefone.ilike.${busca},razao_social.ilike.${busca},nome_fantasia.ilike.${busca}`
    )
  }

  // Filtro por segmento (subquery)
  if (filtros.segmento_id) {
    const { data: contatoIds } = await supabase
      .from('contatos_segmentos')
      .select('contato_id')
      .eq('segmento_id', filtros.segmento_id)
      .eq('organizacao_id', organizacaoId)

    const ids = (contatoIds || []).map((c) => c.contato_id)
    if (ids.length > 0) {
      query = query.in('id', ids)
    } else {
      // Nenhum contato com esse segmento
      return { contatos: [], total: 0, page, per_page: perPage, total_paginas: 0 }
    }
  }

  // Ordenacao
  const ordenarPor = filtros.ordenar_por || 'criado_em'
  const ordemAsc = filtros.ordem === 'asc'
  query = query.order(ordenarPor, { ascending: ordemAsc })

  // Paginacao
  query = query.range(offset, offset + perPage - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Erro ao listar contatos: ${error.message}`)

  // Buscar segmentos para cada contato
  const contatos = data || []
  const contatoIds = contatos.map((c) => c.id)

  let segmentosMap: Record<string, Array<{ id: string; nome: string; cor: string }>> = {}

  if (contatoIds.length > 0) {
    const { data: vinculos } = await supabase
      .from('contatos_segmentos')
      .select('contato_id, segmento_id, segmentos(id, nome, cor)')
      .in('contato_id', contatoIds)
      .eq('organizacao_id', organizacaoId)

    if (vinculos) {
      for (const v of vinculos as any[]) {
        if (!segmentosMap[v.contato_id]) segmentosMap[v.contato_id] = []
        if (v.segmentos) {
          segmentosMap[v.contato_id].push({
            id: v.segmentos.id,
            nome: v.segmentos.nome,
            cor: v.segmentos.cor,
          })
        }
      }
    }
  }

  // Buscar nomes dos owners
  const ownerIds = [...new Set(contatos.filter((c) => c.owner_id).map((c) => c.owner_id!))]
  let ownersMap: Record<string, { nome: string; sobrenome?: string }> = {}

  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from('usuarios')
      .select('id, nome, sobrenome')
      .in('id', ownerIds)

    if (owners) {
      for (const o of owners) {
        ownersMap[o.id] = { nome: o.nome, sobrenome: o.sobrenome }
      }
    }
  }

  const contatosEnriquecidos = contatos.map((c) => ({
    ...c,
    segmentos: segmentosMap[c.id] || [],
    owner: c.owner_id ? ownersMap[c.owner_id] || null : null,
  }))

  return {
    contatos: contatosEnriquecidos,
    total: count || 0,
    page,
    per_page: perPage,
    total_paginas: Math.ceil((count || 0) / perPage),
  }
}

// =====================================================
// Buscar Contato por ID
// =====================================================

export async function buscarContato(
  id: string,
  organizacaoId: string,
  usuarioId: string,
  role: UserRole
) {
  let query = supabase
    .from('contatos')
    .select('*, empresa:contatos!contatos_empresa_id_fkey(id, razao_social, nome_fantasia)')
    .eq('id', id)
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (role === 'member') {
    query = query.eq('owner_id', usuarioId)
  }

  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar contato: ${error.message}`)
  }

  // Buscar segmentos
  const { data: vinculos } = await supabase
    .from('contatos_segmentos')
    .select('segmento_id, segmentos(id, nome, cor)')
    .eq('contato_id', id)
    .eq('organizacao_id', organizacaoId)

  const segmentos = (vinculos || []).map((v: any) => v.segmentos).filter(Boolean)

  // Buscar contagem de oportunidades
  const { count: totalOportunidades } = await supabase
    .from('oportunidades')
    .select('*', { count: 'exact', head: true })
    .eq('contato_id', id)
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  // Se for empresa, buscar pessoas vinculadas
  let pessoas: any[] = []
  if (data.tipo === 'empresa') {
    const { data: pessoasData } = await supabase
      .from('contatos')
      .select('id, nome, sobrenome, email, telefone, cargo, status')
      .eq('empresa_id', id)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .order('nome', { ascending: true })

    pessoas = pessoasData || []
  }

  // Owner info
  let owner = null
  if (data.owner_id) {
    const { data: ownerData } = await supabase
      .from('usuarios')
      .select('id, nome, sobrenome, email, avatar_url')
      .eq('id', data.owner_id)
      .single()
    owner = ownerData
  }

  return {
    ...data,
    segmentos,
    total_oportunidades: totalOportunidades || 0,
    pessoas,
    owner,
  }
}

// =====================================================
// Criar Contato
// =====================================================

export async function criarContato(
  organizacaoId: string,
  usuarioId: string,
  role: UserRole,
  dados: Record<string, unknown>
) {
  const payload: Record<string, unknown> = {
    ...dados,
    organizacao_id: organizacaoId,
    criado_por: usuarioId,
  }

  // Member vira automaticamente owner
  if (role === 'member' && !payload.owner_id) {
    payload.owner_id = usuarioId
  }

  const { data, error } = await supabase
    .from('contatos')
    .insert(payload)
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar contato: ${error.message}`)
  return data
}

// =====================================================
// Atualizar Contato
// =====================================================

export async function atualizarContato(
  id: string,
  organizacaoId: string,
  usuarioId: string,
  role: UserRole,
  dados: Record<string, unknown>
) {
  // Verificar permissao (Member so edita os seus)
  if (role === 'member') {
    const { data: existente } = await supabase
      .from('contatos')
      .select('owner_id')
      .eq('id', id)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (!existente || existente.owner_id !== usuarioId) {
      throw new Error('Sem permissao para editar este contato')
    }
  }

  const { data, error } = await supabase
    .from('contatos')
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar contato: ${error.message}`)
  return data
}

// =====================================================
// Excluir Contato (Soft Delete)
// =====================================================

export async function excluirContato(
  id: string,
  organizacaoId: string,
  usuarioId: string,
  role: UserRole
) {
  // Verificar permissao
  if (role === 'member') {
    const { data: existente } = await supabase
      .from('contatos')
      .select('owner_id, tipo')
      .eq('id', id)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)
      .single()

    if (!existente || existente.owner_id !== usuarioId) {
      throw new Error('Sem permissao para excluir este contato')
    }
  }

  // Verificar vinculos
  const { data: contato } = await supabase
    .from('contatos')
    .select('tipo')
    .eq('id', id)
    .eq('organizacao_id', organizacaoId)
    .single()

  if (contato?.tipo === 'empresa') {
    const { count } = await supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', id)
      .eq('organizacao_id', organizacaoId)
      .is('deletado_em', null)

    if (count && count > 0) {
      throw new Error(`Empresa possui ${count} pessoa(s) vinculada(s). Desvincule antes de excluir.`)
    }
  }

  // Verificar oportunidades ativas
  const { count: opCount } = await supabase
    .from('oportunidades')
    .select('*', { count: 'exact', head: true })
    .eq('contato_id', id)
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (opCount && opCount > 0) {
    throw new Error(`Contato possui ${opCount} oportunidade(s) ativa(s). Encerre antes de excluir.`)
  }

  // Remover vinculos de segmentos
  await supabase
    .from('contatos_segmentos')
    .delete()
    .eq('contato_id', id)
    .eq('organizacao_id', organizacaoId)

  // Soft delete
  const { error } = await supabase
    .from('contatos')
    .update({ deletado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('organizacao_id', organizacaoId)

  if (error) throw new Error(`Erro ao excluir contato: ${error.message}`)
}

// =====================================================
// Excluir em Lote
// =====================================================

export async function excluirLote(
  organizacaoId: string,
  usuarioId: string,
  role: UserRole,
  payload: { ids: string[]; tipo: string }
) {
  const { ids } = payload
  const erros: string[] = []
  let excluidos = 0

  for (const id of ids) {
    try {
      await excluirContato(id, organizacaoId, usuarioId, role)
      excluidos++
    } catch (err: any) {
      erros.push(`${id}: ${err.message}`)
    }
  }

  return { excluidos, erros, total: ids.length }
}

// =====================================================
// Atribuir Owner em Lote (Admin only)
// =====================================================

export async function atribuirLote(
  organizacaoId: string,
  payload: { ids: string[]; owner_id: string | null }
) {
  const { ids, owner_id } = payload

  const { error } = await supabase
    .from('contatos')
    .update({ owner_id, atualizado_em: new Date().toISOString() })
    .in('id', ids)
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (error) throw new Error(`Erro ao atribuir contatos: ${error.message}`)
  return { sucesso: true, total: ids.length }
}

// =====================================================
// Buscar Duplicatas (Admin only)
// =====================================================

export async function buscarDuplicatas(organizacaoId: string) {
  const { data, error } = await supabase
    .from('duplicatas_contatos')
    .select(`
      *,
      contato_original:contatos!duplicatas_contatos_contato_original_id_fkey(id, nome, sobrenome, email, telefone, tipo, razao_social),
      contato_duplicado:contatos!duplicatas_contatos_contato_duplicado_id_fkey(id, nome, sobrenome, email, telefone, tipo, razao_social)
    `)
    .eq('organizacao_id', organizacaoId)
    .eq('status', 'pendente')
    .order('score_similaridade', { ascending: false })

  if (error) throw new Error(`Erro ao buscar duplicatas: ${error.message}`)
  return { duplicatas: data || [], total: (data || []).length }
}

// =====================================================
// Mesclar Contatos (Admin only)
// =====================================================

export async function mesclarContatos(
  organizacaoId: string,
  usuarioId: string,
  payload: { contato_manter_id: string; contato_mesclar_id: string; campos_mesclar?: string[] }
) {
  const { contato_manter_id, contato_mesclar_id, campos_mesclar } = payload

  // Buscar ambos contatos
  const { data: manter } = await supabase
    .from('contatos')
    .select('*')
    .eq('id', contato_manter_id)
    .eq('organizacao_id', organizacaoId)
    .single()

  const { data: mesclar } = await supabase
    .from('contatos')
    .select('*')
    .eq('id', contato_mesclar_id)
    .eq('organizacao_id', organizacaoId)
    .single()

  if (!manter || !mesclar) throw new Error('Contatos nao encontrados')

  // Mesclar campos especificados
  if (campos_mesclar && campos_mesclar.length > 0) {
    const updates: Record<string, unknown> = {}
    for (const campo of campos_mesclar) {
      if ((mesclar as any)[campo] && !(manter as any)[campo]) {
        updates[campo] = (mesclar as any)[campo]
      }
    }
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('contatos')
        .update(updates)
        .eq('id', contato_manter_id)
    }
  }

  // Transferir oportunidades do contato mesclar para o manter
  await supabase
    .from('oportunidades')
    .update({ contato_id: contato_manter_id })
    .eq('contato_id', contato_mesclar_id)
    .eq('organizacao_id', organizacaoId)

  // Transferir segmentos
  const { data: segsMesclar } = await supabase
    .from('contatos_segmentos')
    .select('segmento_id')
    .eq('contato_id', contato_mesclar_id)
    .eq('organizacao_id', organizacaoId)

  if (segsMesclar) {
    for (const seg of segsMesclar) {
      const { data: existente } = await supabase
        .from('contatos_segmentos')
        .select('id')
        .eq('contato_id', contato_manter_id)
        .eq('segmento_id', seg.segmento_id)
        .maybeSingle()

      if (!existente) {
        await supabase.from('contatos_segmentos').insert({
          contato_id: contato_manter_id,
          segmento_id: seg.segmento_id,
          organizacao_id: organizacaoId,
        })
      }
    }
  }

  // Soft delete do contato mesclar
  await supabase
    .from('contatos')
    .update({ deletado_em: new Date().toISOString() })
    .eq('id', contato_mesclar_id)

  // Atualizar duplicata como resolvida
  await supabase
    .from('duplicatas_contatos')
    .update({
      status: 'confirmada',
      resolvido_em: new Date().toISOString(),
      resolvido_por: usuarioId,
    })
    .or(`contato_original_id.eq.${contato_mesclar_id},contato_duplicado_id.eq.${contato_mesclar_id}`)
    .eq('organizacao_id', organizacaoId)

  return { sucesso: true }
}

// =====================================================
// Exportar Contatos (CSV)
// =====================================================

export async function exportarContatos(
  organizacaoId: string,
  usuarioId: string,
  role: UserRole,
  filtros: ListarFiltros
) {
  // Reutiliza listar mas sem paginacao
  const result = await listarContatos(organizacaoId, usuarioId, role, {
    ...filtros,
    page: 1,
    per_page: 1000,
  })

  // Gera CSV
  const contatos = result.contatos
  if (contatos.length === 0) return { csv: '', total: 0 }

  const headers = [
    'Nome', 'Sobrenome', 'Email', 'Telefone', 'Tipo', 'Status', 'Origem',
    'Cargo', 'Razao Social', 'Nome Fantasia', 'CNPJ', 'Website',
    'Criado Em',
  ]

  const rows = contatos.map((c: any) => [
    c.nome || '', c.sobrenome || '', c.email || '', c.telefone || '',
    c.tipo, c.status, c.origem,
    c.cargo || '', c.razao_social || '', c.nome_fantasia || '',
    c.cnpj || '', c.website || '',
    c.criado_em,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((r: string[]) => r.map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return { csv: csvContent, total: contatos.length }
}

export default {
  listarContatos,
  buscarContato,
  criarContato,
  atualizarContato,
  excluirContato,
  excluirLote,
  atribuirLote,
  buscarDuplicatas,
  mesclarContatos,
  exportarContatos,
}
