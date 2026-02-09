/**
 * AIDEV-NOTE: Service API para Formulários
 * Conforme PRD-17 - Módulo de Formulários Avançados
 * Usa Supabase client direto (respeita RLS)
 */

import { supabase } from '@/lib/supabase'

// =====================================================
// Helper - Obter organizacao_id do usuario logado
// =====================================================

let _cachedOrgId: string | null = null

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

supabase.auth.onAuthStateChange(() => {
  _cachedOrgId = null
})

// =====================================================
// Types
// =====================================================

export type TipoFormulario = 'inline' | 'popup' | 'landing_page' | 'newsletter' | 'multi_step'
export type StatusFormulario = 'rascunho' | 'publicado' | 'arquivado'

export interface Formulario {
  id: string
  organizacao_id: string
  nome: string
  slug: string
  tipo: TipoFormulario
  status: StatusFormulario
  descricao?: string | null
  url_redirecionamento?: string | null
  mensagem_sucesso?: string | null
  funil_id?: string | null
  etapa_destino_id?: string | null
  criar_oportunidade_automatico?: boolean
  notificar_responsavel?: boolean
  ab_testing_ativo?: boolean
  total_submissoes?: number
  total_visualizacoes?: number
  publicado_em?: string | null
  criado_em: string
  atualizado_em: string
  deletado_em?: string | null
}

export interface ListarFormulariosParams {
  busca?: string
  status?: StatusFormulario | ''
  tipo?: TipoFormulario | ''
  pagina?: number
  por_pagina?: number
}

export interface ListarFormulariosResult {
  data: Formulario[]
  total: number
  pagina: number
  por_pagina: number
}

// =====================================================
// API
// =====================================================

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60)
}

async function listar(params?: ListarFormulariosParams): Promise<ListarFormulariosResult> {
  const pagina = params?.pagina || 1
  const por_pagina = params?.por_pagina || 20
  const from = (pagina - 1) * por_pagina
  const to = from + por_pagina - 1

  let query = supabase
    .from('formularios')
    .select('id, nome, slug, tipo, status, descricao, total_submissoes, total_visualizacoes, publicado_em, criado_em, atualizado_em, organizacao_id, url_redirecionamento, mensagem_sucesso, funil_id, ab_testing_ativo, deletado_em', { count: 'exact' })
    .is('deletado_em', null)
    .order('criado_em', { ascending: false })

  if (params?.busca) {
    query = query.ilike('nome', `%${params.busca}%`)
  }
  if (params?.status) {
    query = query.eq('status', params.status)
  }
  if (params?.tipo) {
    query = query.eq('tipo', params.tipo)
  }

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(`Erro ao listar formulários: ${error.message}`)

  return {
    data: (data || []) as unknown as Formulario[],
    total: count || 0,
    pagina,
    por_pagina,
  }
}

async function buscar(id: string): Promise<Formulario> {
  const { data, error } = await supabase
    .from('formularios')
    .select('*')
    .eq('id', id)
    .is('deletado_em', null)
    .single()

  if (error) throw new Error(`Erro ao buscar formulário: ${error.message}`)
  return data as Formulario
}

async function criar(payload: {
  nome: string
  tipo: TipoFormulario
  descricao?: string
}): Promise<Formulario> {
  const organizacao_id = await getOrganizacaoId()
  const slug = gerarSlug(payload.nome) + '-' + Date.now().toString(36)

  const { data, error } = await supabase
    .from('formularios')
    .insert({
      organizacao_id,
      nome: payload.nome,
      slug,
      tipo: payload.tipo,
      descricao: payload.descricao || null,
      status: 'rascunho',
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar formulário: ${error.message}`)
  return data as Formulario
}

async function atualizar(id: string, payload: Partial<Formulario>): Promise<Formulario> {
  const { data, error } = await supabase
    .from('formularios')
    .update(payload)
    .eq('id', id)
    .is('deletado_em', null)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar formulário: ${error.message}`)
  return data as Formulario
}

async function excluir(id: string): Promise<void> {
  const { error } = await supabase
    .from('formularios')
    .update({ deletado_em: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Erro ao excluir formulário: ${error.message}`)
}

async function duplicar(id: string): Promise<Formulario> {
  const original = await buscar(id)
  const organizacao_id = await getOrganizacaoId()
  const novoNome = `${original.nome} (cópia)`
  const slug = gerarSlug(novoNome) + '-' + Date.now().toString(36)

  const { data, error } = await supabase
    .from('formularios')
    .insert({
      organizacao_id,
      nome: novoNome,
      slug,
      tipo: original.tipo,
      descricao: original.descricao,
      url_redirecionamento: original.url_redirecionamento,
      mensagem_sucesso: original.mensagem_sucesso,
      status: 'rascunho',
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao duplicar formulário: ${error.message}`)
  return data as Formulario
}

async function publicar(id: string): Promise<Formulario> {
  return atualizar(id, {
    status: 'publicado',
    publicado_em: new Date().toISOString(),
  } as Partial<Formulario>)
}

async function despublicar(id: string): Promise<Formulario> {
  return atualizar(id, { status: 'rascunho' } as Partial<Formulario>)
}

async function contarPorStatus(): Promise<Record<string, number>> {
  const organizacao_id = await getOrganizacaoId()

  const { data, error } = await supabase
    .from('formularios')
    .select('status')
    .eq('organizacao_id', organizacao_id)
    .is('deletado_em', null)

  if (error) throw new Error(`Erro ao contar formulários: ${error.message}`)

  const contagem: Record<string, number> = { todos: 0, rascunho: 0, publicado: 0, arquivado: 0 }
  for (const item of data || []) {
    contagem.todos++
    contagem[item.status] = (contagem[item.status] || 0) + 1
  }
  return contagem
}

// =====================================================
// Campos do Formulário
// =====================================================

export interface CampoFormulario {
  id: string
  formulario_id: string
  nome: string
  label: string
  tipo: string
  placeholder?: string | null
  texto_ajuda?: string | null
  obrigatorio: boolean
  validacoes?: Record<string, unknown> | null
  opcoes?: unknown[] | null
  mapeamento_campo?: string | null
  largura: string
  ordem: number
  etapa_numero?: number | null
  condicional_ativo: boolean
  condicional_campo_id?: string | null
  condicional_operador?: string | null
  condicional_valor?: string | null
  valor_padrao?: string | null
  valor_pontuacao?: number | null
  regras_pontuacao?: unknown | null
  prefill_ativo?: boolean | null
  prefill_fonte?: string | null
  prefill_chave?: string | null
  mostrar_para_leads_conhecidos?: boolean | null
  alternativa_para_campo_id?: string | null
  prioridade_profiling?: number | null
  criado_em: string
  atualizado_em: string
}

async function listarCampos(formularioId: string): Promise<CampoFormulario[]> {
  const { data, error } = await supabase
    .from('campos_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .order('ordem', { ascending: true })

  if (error) throw new Error(`Erro ao listar campos: ${error.message}`)
  return (data || []) as unknown as CampoFormulario[]
}

async function criarCampo(
  formularioId: string,
  payload: Partial<CampoFormulario>
): Promise<CampoFormulario> {
  const insertData = {
    formulario_id: formularioId,
    nome: payload.nome || '',
    label: payload.label || '',
    tipo: payload.tipo || 'texto',
    placeholder: payload.placeholder,
    texto_ajuda: payload.texto_ajuda,
    obrigatorio: payload.obrigatorio ?? false,
    validacoes: (payload.validacoes || {}) as Record<string, unknown>,
    opcoes: (payload.opcoes || []) as unknown[],
    mapeamento_campo: payload.mapeamento_campo,
    largura: payload.largura || 'full',
    ordem: payload.ordem ?? 0,
    etapa_numero: payload.etapa_numero || 1,
    valor_padrao: payload.valor_padrao,
  } as any

  const { data, error } = await supabase
    .from('campos_formularios')
    .insert(insertData)
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar campo: ${error.message}`)
  return data as unknown as CampoFormulario
}

async function atualizarCampo(
  formularioId: string,
  campoId: string,
  payload: Partial<CampoFormulario>
): Promise<CampoFormulario> {
  const { data, error } = await supabase
    .from('campos_formularios')
    .update(payload as Record<string, unknown>)
    .eq('formulario_id', formularioId)
    .eq('id', campoId)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar campo: ${error.message}`)
  return data as unknown as CampoFormulario
}

async function excluirCampo(formularioId: string, campoId: string): Promise<void> {
  const { error } = await supabase
    .from('campos_formularios')
    .delete()
    .eq('formulario_id', formularioId)
    .eq('id', campoId)

  if (error) throw new Error(`Erro ao excluir campo: ${error.message}`)
}

async function reordenarCampos(
  formularioId: string,
  campos: { id: string; ordem: number }[]
): Promise<void> {
  for (const item of campos) {
    const { error } = await supabase
      .from('campos_formularios')
      .update({ ordem: item.ordem })
      .eq('formulario_id', formularioId)
      .eq('id', item.id)

    if (error) throw new Error(`Erro ao reordenar: ${error.message}`)
  }
}

// =====================================================
// Estilos do Formulário
// =====================================================

export interface EstiloContainer {
  background_color?: string
  border_radius?: string
  padding?: string
  sombra?: string
  max_width?: string
  font_family?: string
}

export interface EstiloCabecalho {
  logo_url?: string | null
  logo_posicao?: string
  titulo_cor?: string
  titulo_tamanho?: string
  descricao_cor?: string
  descricao_tamanho?: string
}

export interface EstiloCampos {
  label_cor?: string
  label_tamanho?: string
  input_background?: string
  input_border_color?: string
  input_border_radius?: string
  input_texto_cor?: string
  input_placeholder_cor?: string
  erro_cor?: string
}

export interface EstiloBotao {
  texto?: string
  texto_cor?: string
  background_color?: string
  hover_background?: string
  border_radius?: string
  largura?: string
  tamanho?: string
}

export interface EstiloPagina {
  background_color?: string
  background_image_url?: string | null
  background_overlay?: boolean
  background_overlay_cor?: string
}

export interface EstiloFormulario {
  id: string
  formulario_id: string
  container: EstiloContainer
  cabecalho: EstiloCabecalho
  campos: EstiloCampos
  botao: EstiloBotao
  pagina: EstiloPagina
  css_customizado?: string | null
  criado_em: string
  atualizado_em: string
}

export const ESTILO_PADRAO: Omit<EstiloFormulario, 'id' | 'formulario_id' | 'criado_em' | 'atualizado_em'> = {
  container: {
    background_color: '#FFFFFF',
    border_radius: '8px',
    padding: '24px',
    sombra: 'md',
    max_width: '600px',
    font_family: 'Inter',
  },
  cabecalho: {
    logo_url: null,
    logo_posicao: 'centro',
    titulo_cor: '#1F2937',
    titulo_tamanho: '24px',
    descricao_cor: '#6B7280',
    descricao_tamanho: '14px',
  },
  campos: {
    label_cor: '#374151',
    label_tamanho: '14px',
    input_background: '#F9FAFB',
    input_border_color: '#D1D5DB',
    input_border_radius: '6px',
    input_texto_cor: '#1F2937',
    input_placeholder_cor: '#9CA3AF',
    erro_cor: '#EF4444',
  },
  botao: {
    texto: 'Enviar',
    texto_cor: '#FFFFFF',
    background_color: '#3B82F6',
    hover_background: '#2563EB',
    border_radius: '6px',
    largura: 'full',
    tamanho: 'md',
  },
  pagina: {
    background_color: '#F3F4F6',
    background_image_url: null,
    background_overlay: false,
    background_overlay_cor: 'rgba(0,0,0,0.5)',
  },
  css_customizado: null,
}

async function buscarEstilos(formularioId: string): Promise<EstiloFormulario | null> {
  const { data, error } = await supabase
    .from('estilos_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .maybeSingle()

  if (error) throw new Error(`Erro ao buscar estilos: ${error.message}`)
  return data as EstiloFormulario | null
}

async function salvarEstilos(
  formularioId: string,
  payload: Partial<Pick<EstiloFormulario, 'container' | 'cabecalho' | 'campos' | 'botao' | 'pagina' | 'css_customizado'>>
): Promise<EstiloFormulario> {
  // Check if exists
  const { data: existente } = await supabase
    .from('estilos_formularios')
    .select('id')
    .eq('formulario_id', formularioId)
    .maybeSingle()

  if (existente) {
    const { data, error } = await supabase
      .from('estilos_formularios')
      .update(payload as Record<string, unknown>)
      .eq('formulario_id', formularioId)
      .select()
      .single()
    if (error) throw new Error(`Erro ao atualizar estilos: ${error.message}`)
    return data as unknown as EstiloFormulario
  }

  const { data, error } = await supabase
    .from('estilos_formularios')
    .insert({ formulario_id: formularioId, ...payload } as any)
    .select()
    .single()
  if (error) throw new Error(`Erro ao criar estilos: ${error.message}`)
  return data as unknown as EstiloFormulario
}

// =====================================================
// Config Popup
// =====================================================

export interface ConfigPopup {
  id: string
  formulario_id: string
  tipo_gatilho: string
  atraso_segundos: number
  porcentagem_scroll: number
  seletor_elemento_clique?: string | null
  mostrar_uma_vez_sessao: boolean
  dias_expiracao_cookie: number
  mostrar_mobile: boolean
  cor_fundo_overlay: string
  clique_overlay_fecha: boolean
  tipo_animacao: string
  duracao_animacao_ms: number
  popup_imagem_url?: string | null
  popup_imagem_posicao: string
  posicao: string
}

async function buscarConfigPopup(formularioId: string): Promise<ConfigPopup | null> {
  const { data, error } = await supabase
    .from('config_popup_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .maybeSingle()
  if (error) throw new Error(`Erro ao buscar config popup: ${error.message}`)
  return data as ConfigPopup | null
}

async function salvarConfigPopup(formularioId: string, payload: Partial<ConfigPopup>): Promise<ConfigPopup> {
  const { data: existente } = await supabase
    .from('config_popup_formularios')
    .select('id')
    .eq('formulario_id', formularioId)
    .maybeSingle()

  if (existente) {
    const { data, error } = await supabase
      .from('config_popup_formularios')
      .update(payload as any)
      .eq('formulario_id', formularioId)
      .select()
      .single()
    if (error) throw new Error(`Erro ao atualizar config popup: ${error.message}`)
    return data as unknown as ConfigPopup
  }

  const { data, error } = await supabase
    .from('config_popup_formularios')
    .insert({ formulario_id: formularioId, ...payload } as any)
    .select()
    .single()
  if (error) throw new Error(`Erro ao criar config popup: ${error.message}`)
  return data as unknown as ConfigPopup
}

// =====================================================
// Config Newsletter
// =====================================================

export interface ConfigNewsletter {
  id: string
  formulario_id: string
  double_optin_ativo: boolean
  assunto_email_confirmacao?: string | null
  template_email_confirmacao?: string | null
  nome_lista?: string | null
  tags?: unknown[] | null
  frequencia_envio?: string | null
  descricao_frequencia_envio?: string | null
  texto_consentimento?: string | null
  url_politica_privacidade?: string | null
  mostrar_checkbox_consentimento: boolean
  provedor_externo?: string | null
  id_lista_externa?: string | null
  ref_api_key_externa?: string | null
}

async function buscarConfigNewsletter(formularioId: string): Promise<ConfigNewsletter | null> {
  const { data, error } = await supabase
    .from('config_newsletter_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .maybeSingle()
  if (error) throw new Error(`Erro ao buscar config newsletter: ${error.message}`)
  return data as ConfigNewsletter | null
}

async function salvarConfigNewsletter(formularioId: string, payload: Partial<ConfigNewsletter>): Promise<ConfigNewsletter> {
  const { data: existente } = await supabase
    .from('config_newsletter_formularios')
    .select('id')
    .eq('formulario_id', formularioId)
    .maybeSingle()

  if (existente) {
    const { data, error } = await supabase
      .from('config_newsletter_formularios')
      .update(payload as any)
      .eq('formulario_id', formularioId)
      .select()
      .single()
    if (error) throw new Error(`Erro ao atualizar config newsletter: ${error.message}`)
    return data as unknown as ConfigNewsletter
  }

  const { data, error } = await supabase
    .from('config_newsletter_formularios')
    .insert({ formulario_id: formularioId, ...payload } as any)
    .select()
    .single()
  if (error) throw new Error(`Erro ao criar config newsletter: ${error.message}`)
  return data as unknown as ConfigNewsletter
}

// =====================================================
// Etapas (Multi-step)
// =====================================================

export interface EtapaFormulario {
  id: string
  formulario_id: string
  indice_etapa: number
  titulo_etapa?: string | null
  descricao_etapa?: string | null
  icone_etapa?: string | null
  texto_botao_proximo?: string | null
  texto_botao_anterior?: string | null
  validar_antes_avancar: boolean
}

async function listarEtapas(formularioId: string): Promise<EtapaFormulario[]> {
  const { data, error } = await supabase
    .from('etapas_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .order('indice_etapa', { ascending: true })
  if (error) throw new Error(`Erro ao listar etapas: ${error.message}`)
  return (data || []) as unknown as EtapaFormulario[]
}

async function criarEtapa(formularioId: string, payload: Partial<EtapaFormulario>): Promise<EtapaFormulario> {
  const { data, error } = await supabase
    .from('etapas_formularios')
    .insert({ formulario_id: formularioId, ...payload } as any)
    .select()
    .single()
  if (error) throw new Error(`Erro ao criar etapa: ${error.message}`)
  return data as unknown as EtapaFormulario
}

async function atualizarEtapa(formularioId: string, etapaId: string, payload: Partial<EtapaFormulario>): Promise<EtapaFormulario> {
  const { data, error } = await supabase
    .from('etapas_formularios')
    .update(payload as any)
    .eq('formulario_id', formularioId)
    .eq('id', etapaId)
    .select()
    .single()
  if (error) throw new Error(`Erro ao atualizar etapa: ${error.message}`)
  return data as unknown as EtapaFormulario
}

async function excluirEtapa(formularioId: string, etapaId: string): Promise<void> {
  const { error } = await supabase
    .from('etapas_formularios')
    .delete()
    .eq('formulario_id', formularioId)
    .eq('id', etapaId)
  if (error) throw new Error(`Erro ao excluir etapa: ${error.message}`)
}

export const formulariosApi = {
  listar,
  buscar,
  criar,
  atualizar,
  excluir,
  duplicar,
  publicar,
  despublicar,
  contarPorStatus,
  listarCampos,
  criarCampo,
  atualizarCampo,
  excluirCampo,
  reordenarCampos,
  buscarEstilos,
  salvarEstilos,
  buscarConfigPopup,
  salvarConfigPopup,
  buscarConfigNewsletter,
  salvarConfigNewsletter,
  listarEtapas,
  criarEtapa,
  atualizarEtapa,
  excluirEtapa,
}
