/**
 * AIDEV-NOTE: Service para Formularios
 * Conforme PRD-17 - Modulo de Formularios (Etapa 1)
 * CRUD completo + publicar/despublicar/duplicar
 */

import { supabaseAdmin } from '../config/supabase.js'
import type {
  Formulario,
  CriarFormularioPayload,
  AtualizarFormularioPayload,
  ListarFormulariosQuery,
} from '../schemas/formularios.js'

const supabase = supabaseAdmin

// =====================================================
// Helpers
// =====================================================

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200)
}

async function garantirSlugUnico(organizacaoId: string, slugBase: string, excluirId?: string): Promise<string> {
  let slug = slugBase
  let counter = 0

  while (true) {
    const candidato = counter === 0 ? slug : `${slug}-${counter}`
    let query = supabase
      .from('formularios')
      .select('id')
      .eq('organizacao_id', organizacaoId)
      .eq('slug', candidato)
      .is('deletado_em', null)

    if (excluirId) {
      query = query.neq('id', excluirId)
    }

    const { data } = await query.maybeSingle()

    if (!data) return candidato
    counter++
  }
}

// =====================================================
// Listar Formularios
// =====================================================

export async function listarFormularios(organizacaoId: string, query: ListarFormulariosQuery) {
  let qb = supabase
    .from('formularios')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (query.status) qb = qb.eq('status', query.status)
  if (query.tipo) qb = qb.eq('tipo', query.tipo)
  if (query.funil_id) qb = qb.eq('funil_id', query.funil_id)
  if (query.busca) qb = qb.ilike('nome', `%${query.busca}%`)

  const offset = (query.page - 1) * query.per_page
  qb = qb.order('criado_em', { ascending: false }).range(offset, offset + query.per_page - 1)

  const { data, error, count } = await qb

  if (error) throw new Error(`Erro ao listar formularios: ${error.message}`)

  return {
    formularios: data as Formulario[],
    total: count || 0,
    page: query.page,
    per_page: query.per_page,
    total_pages: Math.ceil((count || 0) / query.per_page),
  }
}

// =====================================================
// Buscar Formulario por ID
// =====================================================

export async function buscarFormulario(organizacaoId: string, id: string): Promise<Formulario | null> {
  const { data, error } = await supabase
    .from('formularios')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', id)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar formulario: ${error.message}`)
  }

  return data as Formulario
}

// =====================================================
// Criar Formulario
// =====================================================

export async function criarFormulario(
  organizacaoId: string,
  payload: CriarFormularioPayload,
  criadoPor?: string
): Promise<Formulario> {
  const slugBase = payload.slug || gerarSlug(payload.nome)
  const slug = await garantirSlugUnico(organizacaoId, slugBase)

  const { data, error } = await supabase
    .from('formularios')
    .insert({
      organizacao_id: organizacaoId,
      nome: payload.nome,
      descricao: payload.descricao,
      slug,
      tipo: payload.tipo || 'padrao',
      funil_id: payload.funil_id,
      etapa_id: payload.etapa_id,
      titulo_pagina: payload.titulo_pagina,
      mensagem_sucesso: payload.mensagem_sucesso,
      url_redirecionamento: payload.url_redirecionamento,
      redirecionar_apos_envio: payload.redirecionar_apos_envio ?? false,
      captcha_ativo: payload.captcha_ativo ?? false,
      captcha_tipo: payload.captcha_tipo,
      captcha_site_key: payload.captcha_site_key,
      honeypot_ativo: payload.honeypot_ativo ?? true,
      rate_limit_ativo: payload.rate_limit_ativo ?? true,
      rate_limit_max: payload.rate_limit_max ?? 10,
      rate_limit_janela_minutos: payload.rate_limit_janela_minutos ?? 1,
      notificar_email: payload.notificar_email ?? false,
      emails_notificacao: payload.emails_notificacao,
      meta_titulo: payload.meta_titulo,
      meta_descricao: payload.meta_descricao,
      og_image_url: payload.og_image_url,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar formulario: ${error.message}`)

  // Criar estilos padrao
  await supabase.from('estilos_formularios').insert({ formulario_id: data.id })

  return data as Formulario
}

// =====================================================
// Atualizar Formulario
// =====================================================

export async function atualizarFormulario(
  organizacaoId: string,
  id: string,
  payload: AtualizarFormularioPayload
): Promise<Formulario> {
  const existente = await buscarFormulario(organizacaoId, id)
  if (!existente) throw new Error('Formulario nao encontrado')

  const updateData: Record<string, any> = { ...payload }

  // Se slug mudou, garantir unicidade
  if (payload.slug && payload.slug !== existente.slug) {
    updateData.slug = await garantirSlugUnico(organizacaoId, payload.slug, id)
  }

  const { data, error } = await supabase
    .from('formularios')
    .update(updateData)
    .eq('organizacao_id', organizacaoId)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar formulario: ${error.message}`)

  return data as Formulario
}

// =====================================================
// Excluir Formulario (Soft Delete)
// =====================================================

export async function excluirFormulario(organizacaoId: string, id: string): Promise<void> {
  const existente = await buscarFormulario(organizacaoId, id)
  if (!existente) throw new Error('Formulario nao encontrado')

  const { error } = await supabase
    .from('formularios')
    .update({ deletado_em: new Date().toISOString() })
    .eq('organizacao_id', organizacaoId)
    .eq('id', id)

  if (error) throw new Error(`Erro ao excluir formulario: ${error.message}`)
}

// =====================================================
// Publicar / Despublicar
// =====================================================

export async function publicarFormulario(organizacaoId: string, id: string): Promise<Formulario> {
  const existente = await buscarFormulario(organizacaoId, id)
  if (!existente) throw new Error('Formulario nao encontrado')

  // Verificar se tem pelo menos 1 campo
  const { count } = await supabase
    .from('campos_formularios')
    .select('*', { count: 'exact', head: true })
    .eq('formulario_id', id)

  if (!count || count === 0) {
    throw new Error('Formulario deve ter pelo menos 1 campo para ser publicado')
  }

  const { data, error } = await supabase
    .from('formularios')
    .update({
      status: 'publicado',
      publicado_em: new Date().toISOString(),
      despublicado_em: null,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Erro ao publicar formulario: ${error.message}`)

  return data as Formulario
}

export async function despublicarFormulario(organizacaoId: string, id: string): Promise<Formulario> {
  const existente = await buscarFormulario(organizacaoId, id)
  if (!existente) throw new Error('Formulario nao encontrado')

  const { data, error } = await supabase
    .from('formularios')
    .update({
      status: 'rascunho',
      despublicado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Erro ao despublicar formulario: ${error.message}`)

  return data as Formulario
}

// =====================================================
// Duplicar Formulario
// =====================================================

export async function duplicarFormulario(
  organizacaoId: string,
  id: string,
  criadoPor?: string
): Promise<Formulario> {
  const original = await buscarFormulario(organizacaoId, id)
  if (!original) throw new Error('Formulario nao encontrado')

  // Criar copia
  const novoSlug = await garantirSlugUnico(organizacaoId, `${original.slug}-copia`)

  const { data: novoForm, error: formError } = await supabase
    .from('formularios')
    .insert({
      organizacao_id: organizacaoId,
      nome: `${original.nome} (Cópia)`,
      descricao: original.descricao,
      slug: novoSlug,
      tipo: original.tipo,
      funil_id: original.funil_id,
      etapa_id: original.etapa_id,
      status: 'rascunho',
      titulo_pagina: original.titulo_pagina,
      mensagem_sucesso: original.mensagem_sucesso,
      url_redirecionamento: original.url_redirecionamento,
      redirecionar_apos_envio: original.redirecionar_apos_envio,
      captcha_ativo: original.captcha_ativo,
      captcha_tipo: original.captcha_tipo,
      captcha_site_key: original.captcha_site_key,
      honeypot_ativo: original.honeypot_ativo,
      rate_limit_ativo: original.rate_limit_ativo,
      rate_limit_max: original.rate_limit_max,
      rate_limit_janela_minutos: original.rate_limit_janela_minutos,
      notificar_email: original.notificar_email,
      emails_notificacao: original.emails_notificacao,
      meta_titulo: original.meta_titulo,
      meta_descricao: original.meta_descricao,
      og_image_url: original.og_image_url,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (formError) throw new Error(`Erro ao duplicar formulario: ${formError.message}`)

  // Copiar campos
  const { data: camposOriginais } = await supabase
    .from('campos_formularios')
    .select('*')
    .eq('formulario_id', id)
    .order('ordem', { ascending: true })

  if (camposOriginais && camposOriginais.length > 0) {
    const novosCampos = camposOriginais.map((c: any) => ({
      formulario_id: novoForm.id,
      nome: c.nome,
      label: c.label,
      placeholder: c.placeholder,
      texto_ajuda: c.texto_ajuda,
      tipo: c.tipo,
      obrigatorio: c.obrigatorio,
      validacoes: c.validacoes,
      opcoes: c.opcoes,
      mapeamento_campo: c.mapeamento_campo,
      largura: c.largura,
      ordem: c.ordem,
      condicional_ativo: c.condicional_ativo,
      condicional_operador: c.condicional_operador,
      condicional_valor: c.condicional_valor,
      etapa_numero: c.etapa_numero,
    }))

    await supabase.from('campos_formularios').insert(novosCampos)
  }

  // Copiar estilos
  const { data: estiloOriginal } = await supabase
    .from('estilos_formularios')
    .select('*')
    .eq('formulario_id', id)
    .single()

  if (estiloOriginal) {
    await supabase.from('estilos_formularios').insert({
      formulario_id: novoForm.id,
      container: estiloOriginal.container,
      cabecalho: estiloOriginal.cabecalho,
      campos: estiloOriginal.campos,
      botao: estiloOriginal.botao,
      pagina: estiloOriginal.pagina,
      css_customizado: estiloOriginal.css_customizado,
    })
  }

  return novoForm as Formulario
}

// =====================================================
// Contadores
// =====================================================

export async function obterContadores(organizacaoId: string) {
  const { count: total } = await supabase
    .from('formularios')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  const { count: publicados } = await supabase
    .from('formularios')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId)
    .eq('status', 'publicado')
    .is('deletado_em', null)

  const { count: rascunhos } = await supabase
    .from('formularios')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId)
    .eq('status', 'rascunho')
    .is('deletado_em', null)

  return {
    total: total || 0,
    publicados: publicados || 0,
    rascunhos: rascunhos || 0,
  }
}

export default {
  listarFormularios,
  buscarFormulario,
  criarFormulario,
  atualizarFormulario,
  excluirFormulario,
  publicarFormulario,
  despublicarFormulario,
  duplicarFormulario,
  obterContadores,
}
