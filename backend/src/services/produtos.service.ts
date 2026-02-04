/**
 * AIDEV-NOTE: Service para Produtos e Categorias
 * Conforme PRD-05 - Catalogo de Produtos
 */

import { supabaseAdmin } from '../config/supabase'
import type {
  Produto,
  CriarProdutoPayload,
  AtualizarProdutoPayload,
  CriarCategoriaPayload,
  AtualizarCategoriaPayload,
  ListaProdutosResponse,
  ListaCategoriasResponse,
} from '../schemas/produtos'

type CategoriaProduto = {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  cor?: string | null
  ativo: boolean
}

const supabase = supabaseAdmin

// =====================================================
// CATEGORIAS
// =====================================================

export async function listarCategorias(
  organizacaoId: string
): Promise<ListaCategoriasResponse> {
  const { data, error, count } = await supabase
    .from('categorias_produtos')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .order('nome', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar categorias: ${error.message}`)
  }

  return {
    categorias: data as CategoriaProduto[],
    total: count || 0,
  }
}

export async function buscarCategoria(
  organizacaoId: string,
  categoriaId: string
): Promise<CategoriaProduto | null> {
  const { data, error } = await supabase
    .from('categorias_produtos')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', categoriaId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar categoria: ${error.message}`)
  }

  return data as CategoriaProduto
}

export async function criarCategoria(
  organizacaoId: string,
  payload: CriarCategoriaPayload,
  criadoPor?: string
): Promise<CategoriaProduto> {
  const { data, error } = await supabase
    .from('categorias_produtos')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar categoria: ${error.message}`)
  }

  return data as CategoriaProduto
}

export async function atualizarCategoria(
  organizacaoId: string,
  categoriaId: string,
  payload: AtualizarCategoriaPayload
): Promise<CategoriaProduto> {
  const { data, error } = await supabase
    .from('categorias_produtos')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', categoriaId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar categoria: ${error.message}`)
  }

  return data as CategoriaProduto
}

export async function excluirCategoria(
  organizacaoId: string,
  categoriaId: string
): Promise<void> {
  // Verificar se tem produtos vinculados
  const { count } = await supabase
    .from('produtos')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId)
    .eq('categoria_id', categoriaId)
    .is('deletado_em', null)

  if (count && count > 0) {
    throw new Error('Nao e possivel excluir categoria com produtos vinculados')
  }

  const { error } = await supabase
    .from('categorias_produtos')
    .update({
      deletado_em: new Date().toISOString(),
      ativa: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', categoriaId)

  if (error) {
    throw new Error(`Erro ao excluir categoria: ${error.message}`)
  }
}

// =====================================================
// PRODUTOS
// =====================================================

export async function listarProdutos(
  organizacaoId: string,
  filtros?: {
    categoriaId?: string
    busca?: string
    ativo?: boolean
    page?: number
    limit?: number
  }
): Promise<ListaProdutosResponse> {
  const { categoriaId, busca, ativo, page = 1, limit = 20 } = filtros || {}
  const offset = (page - 1) * limit

  let query = supabase
    .from('produtos')
    .select('*, categoria:categorias_produtos(id, nome)', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId)
  }

  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,codigo.ilike.%${busca}%`)
  }

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo)
  }

  const { data, error, count } = await query
    .order('nome', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Erro ao listar produtos: ${error.message}`)
  }

  return {
    produtos: data as Produto[],
    total: count || 0,
    page,
    total_paginas: Math.ceil((count || 0) / limit),
  }
}

export async function buscarProduto(
  organizacaoId: string,
  produtoId: string
): Promise<Produto | null> {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categoria:categorias_produtos(id, nome)')
    .eq('organizacao_id', organizacaoId)
    .eq('id', produtoId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar produto: ${error.message}`)
  }

  return data as Produto
}

export async function criarProduto(
  organizacaoId: string,
  payload: CriarProdutoPayload,
  criadoPor?: string
): Promise<Produto> {
  // Verificar se sku ja existe
  if (payload.sku) {
    const { data: existente } = await supabase
      .from('produtos')
      .select('id')
      .eq('organizacao_id', organizacaoId)
      .eq('codigo', payload.sku)
      .is('deletado_em', null)
      .single()

    if (existente) {
      throw new Error('Ja existe um produto com este codigo')
    }
  }

  const { data, error } = await supabase
    .from('produtos')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      codigo: payload.sku,
      criado_por: criadoPor,
    })
    .select('*, categoria:categorias_produtos(id, nome)')
    .single()

  if (error) {
    throw new Error(`Erro ao criar produto: ${error.message}`)
  }

  return data as Produto
}

export async function atualizarProduto(
  organizacaoId: string,
  produtoId: string,
  payload: AtualizarProdutoPayload
): Promise<Produto> {
  // Verificar se sku ja existe (se estiver sendo alterado)
  if (payload.sku) {
    const { data: existente } = await supabase
      .from('produtos')
      .select('id')
      .eq('organizacao_id', organizacaoId)
      .eq('codigo', payload.sku)
      .neq('id', produtoId)
      .is('deletado_em', null)
      .single()

    if (existente) {
      throw new Error('Ja existe um produto com este codigo')
    }
  }

  const { data, error } = await supabase
    .from('produtos')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', produtoId)
    .select('*, categoria:categorias_produtos(id, nome)')
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar produto: ${error.message}`)
  }

  return data as Produto
}

export async function excluirProduto(
  organizacaoId: string,
  produtoId: string
): Promise<void> {
  const { error } = await supabase
    .from('produtos')
    .update({
      deletado_em: new Date().toISOString(),
      ativo: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', produtoId)

  if (error) {
    throw new Error(`Erro ao excluir produto: ${error.message}`)
  }
}

export default {
  // Categorias
  listarCategorias,
  buscarCategoria,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria,
  // Produtos
  listarProdutos,
  buscarProduto,
  criarProduto,
  atualizarProduto,
  excluirProduto,
}
