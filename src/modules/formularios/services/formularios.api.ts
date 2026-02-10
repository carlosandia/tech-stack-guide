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

export type TipoFormulario = 'inline' | 'popup' | 'newsletter' | 'multi_step'
export type StatusFormulario = 'rascunho' | 'publicado' | 'arquivado'

// AIDEV-NOTE: Configurações globais do multi-step
export interface MultiStepConfig {
  tipo_progresso?: 'barra' | 'numeros' | 'icones' | 'dots'
  permitir_voltar?: boolean
  permitir_pular?: boolean
  salvar_rascunho?: boolean
  validar_por_etapa?: boolean
  texto_botao_final?: string
  auto_save?: boolean
  lead_scoring_por_etapa?: boolean
  trackear_abandono?: boolean
}

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
  teste_ab_atual_id?: string | null
  total_submissoes?: number
  total_visualizacoes?: number
  taxa_conversao?: number
  publicado_em?: string | null
  config_botoes?: Record<string, unknown> | null
  config_pos_envio?: Record<string, unknown> | null
  // AIDEV-NOTE: LGPD global para todos os tipos
  lgpd_ativo?: boolean
  lgpd_texto_consentimento?: string | null
  lgpd_url_politica?: string | null
  lgpd_checkbox_obrigatorio?: boolean
  // AIDEV-NOTE: Multi-step config global
  multi_step_config?: MultiStepConfig | null
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
    .select('id, nome, slug, tipo, status, descricao, total_submissoes, total_visualizacoes, publicado_em, criado_em, atualizado_em, organizacao_id, url_redirecionamento, mensagem_sucesso, funil_id, ab_testing_ativo, deletado_em, config_botoes, config_pos_envio', { count: 'exact' })
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
    .update(payload as any)
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
  padding_top?: string
  padding_right?: string
  padding_bottom?: string
  padding_left?: string
  sombra?: string
  max_width?: string
  font_family?: string
  border_width?: string
  border_color?: string
  border_style?: string
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
  input_border_width?: string
  input_texto_cor?: string
  input_placeholder_cor?: string
  erro_cor?: string
  gap?: string
  gap_top?: string
  gap_bottom?: string
  gap_left?: string
  gap_right?: string
}

export interface EstiloBotao {
  texto?: string
  texto_cor?: string
  background_color?: string
  hover_background?: string
  border_radius?: string
  largura?: string
  altura?: string
  font_size?: string
  font_weight?: string
  font_bold?: boolean
  font_italic?: boolean
  font_underline?: boolean
  border_width?: string
  border_color?: string
  border_style?: string
  padding?: string
  margin?: string
  // WhatsApp button styles
  whatsapp_texto?: string
  whatsapp_background?: string
  whatsapp_texto_cor?: string
  whatsapp_border_radius?: string
  whatsapp_largura?: string
  whatsapp_altura?: string
  whatsapp_font_size?: string
  whatsapp_font_weight?: string
  whatsapp_font_bold?: boolean
  whatsapp_font_italic?: boolean
  whatsapp_font_underline?: boolean
  whatsapp_border_width?: string
  whatsapp_border_color?: string
  whatsapp_border_style?: string
  whatsapp_padding?: string
  whatsapp_margin?: string
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
    altura: '40px',
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
  popup_imagem_link?: string | null
  popup_imagem_posicao: string
  posicao: string
  // AIDEV-NOTE: Ações avançadas de marketing
  frequencia_exibicao?: string | null
  max_exibicoes?: number | null
  paginas_alvo?: string[] | null
  paginas_excluidas?: string[] | null
  utm_filtro?: Record<string, string> | null
  mostrar_botao_fechar?: boolean
  delay_botao_fechar?: number | null
  ativo_a_partir_de?: string | null
  ativo_ate?: string | null
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

export type NewsletterTemplate = 'simples' | 'hero_topo' | 'hero_lateral' | 'so_imagem'

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
  newsletter_layout?: NewsletterTemplate | null
  newsletter_imagem_url?: string | null
  newsletter_imagem_link?: string | null
  // AIDEV-NOTE: Email de boas-vindas
  email_boas_vindas_ativo?: boolean
  assunto_boas_vindas?: string | null
  template_boas_vindas?: string | null
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

// =====================================================
// Submissões
// =====================================================

export interface SubmissaoFormulario {
  id: string
  formulario_id: string
  organizacao_id: string
  dados: Record<string, unknown>
  ip_address?: string | null
  user_agent?: string | null
  referrer?: string | null
  pagina_origem?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_term?: string | null
  utm_content?: string | null
  geo_pais?: string | null
  geo_estado?: string | null
  geo_cidade?: string | null
  lead_score?: number | null
  contato_id?: string | null
  oportunidade_id?: string | null
  status: string
  erro_mensagem?: string | null
  honeypot_preenchido?: boolean
  captcha_validado?: boolean
  criado_em: string
}

export interface ListarSubmissoesParams {
  formularioId: string
  status?: string
  pagina?: number
  por_pagina?: number
}

async function listarSubmissoes(params: ListarSubmissoesParams): Promise<{ data: SubmissaoFormulario[]; total: number }> {
  const pagina = params.pagina || 1
  const por_pagina = params.por_pagina || 20
  const from = (pagina - 1) * por_pagina
  const to = from + por_pagina - 1

  let query = supabase
    .from('submissoes_formularios')
    .select('*', { count: 'exact' })
    .eq('formulario_id', params.formularioId)
    .order('criado_em', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(`Erro ao listar submissões: ${error.message}`)
  return { data: (data || []) as unknown as SubmissaoFormulario[], total: count || 0 }
}

async function buscarSubmissao(submissaoId: string): Promise<SubmissaoFormulario> {
  const { data, error } = await supabase
    .from('submissoes_formularios')
    .select('*')
    .eq('id', submissaoId)
    .single()
  if (error) throw new Error(`Erro ao buscar submissão: ${error.message}`)
  return data as unknown as SubmissaoFormulario
}

// =====================================================
// Regras Condicionais
// =====================================================

export interface RegraCondicional {
  id: string
  formulario_id: string
  nome_regra: string
  ordem_regra: number
  ativa: boolean
  tipo_acao: string // 'mostrar' | 'ocultar' | 'pular_etapa' | 'redirecionar' | 'definir_valor'
  campo_alvo_id?: string | null
  indice_etapa_alvo?: number | null
  url_redirecionamento_alvo?: string | null
  valor_alvo?: string | null
  condicoes: CondicaoRegra[]
  logica_condicoes: string // 'E' | 'OU'
  criado_em: string
  atualizado_em: string
}

export interface CondicaoRegra {
  campo_id: string
  operador: string // 'igual' | 'diferente' | 'contem' | 'nao_contem' | 'maior' | 'menor' | 'vazio' | 'nao_vazio'
  valor?: string
}

async function listarRegras(formularioId: string): Promise<RegraCondicional[]> {
  const { data, error } = await supabase
    .from('regras_condicionais_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .order('ordem_regra', { ascending: true })
  if (error) throw new Error(`Erro ao listar regras: ${error.message}`)
  return (data || []) as unknown as RegraCondicional[]
}

async function criarRegra(formularioId: string, payload: Partial<RegraCondicional>): Promise<RegraCondicional> {
  const { data, error } = await supabase
    .from('regras_condicionais_formularios')
    .insert({ formulario_id: formularioId, ...payload } as any)
    .select()
    .single()
  if (error) throw new Error(`Erro ao criar regra: ${error.message}`)
  return data as unknown as RegraCondicional
}

async function atualizarRegra(formularioId: string, regraId: string, payload: Partial<RegraCondicional>): Promise<RegraCondicional> {
  const { data, error } = await supabase
    .from('regras_condicionais_formularios')
    .update(payload as any)
    .eq('formulario_id', formularioId)
    .eq('id', regraId)
    .select()
    .single()
  if (error) throw new Error(`Erro ao atualizar regra: ${error.message}`)
  return data as unknown as RegraCondicional
}

async function excluirRegra(formularioId: string, regraId: string): Promise<void> {
  const { error } = await supabase
    .from('regras_condicionais_formularios')
    .delete()
    .eq('formulario_id', formularioId)
    .eq('id', regraId)
  if (error) throw new Error(`Erro ao excluir regra: ${error.message}`)
}

// =====================================================
// Analytics
// =====================================================

export interface MetricasFormulario {
  total_visualizacoes: number
  total_submissoes: number
  taxa_conversao: number
  eventos_por_tipo: Record<string, number>
  total_abandonos: number
  total_inicios: number
}

export interface FunilConversao {
  etapas: { nome: string; valor: number }[]
}

export interface DesempenhoCampo {
  campo_id: string
  total_interacoes: number
  total_erros: number
  tempo_medio_segundos: number
}

async function obterMetricas(formularioId: string): Promise<MetricasFormulario> {
  // Buscar dados do formulário
  const { data: form } = await supabase
    .from('formularios')
    .select('total_visualizacoes, total_submissoes, taxa_conversao')
    .eq('id', formularioId)
    .single()

  if (!form) throw new Error('Formulário não encontrado')

  // Buscar eventos agrupados
  const { data: eventos } = await supabase
    .from('eventos_analytics_formularios')
    .select('tipo_evento')
    .eq('formulario_id', formularioId)

  const contagemPorTipo: Record<string, number> = {}
  if (eventos) {
    for (const e of eventos) {
      contagemPorTipo[e.tipo_evento] = (contagemPorTipo[e.tipo_evento] || 0) + 1
    }
  }

  return {
    total_visualizacoes: form.total_visualizacoes ?? 0,
    total_submissoes: form.total_submissoes ?? 0,
    taxa_conversao: form.taxa_conversao ?? 0,
    eventos_por_tipo: contagemPorTipo,
    total_abandonos: contagemPorTipo['abandono'] || 0,
    total_inicios: contagemPorTipo['inicio'] || 0,
  }
}

async function obterFunilConversao(formularioId: string): Promise<FunilConversao> {
  const { data: eventos } = await supabase
    .from('eventos_analytics_formularios')
    .select('tipo_evento')
    .eq('formulario_id', formularioId)

  if (!eventos) return { etapas: [] }

  const contagem: Record<string, number> = {}
  for (const e of eventos) {
    contagem[e.tipo_evento] = (contagem[e.tipo_evento] || 0) + 1
  }

  return {
    etapas: [
      { nome: 'Visualização', valor: contagem['visualizacao'] || 0 },
      { nome: 'Início', valor: contagem['inicio'] || 0 },
      { nome: 'Submissão', valor: contagem['submissao'] || 0 },
    ],
  }
}

async function obterDesempenhoCampos(formularioId: string): Promise<DesempenhoCampo[]> {
  const { data: eventos } = await supabase
    .from('eventos_analytics_formularios')
    .select('tipo_evento, dados_evento, tempo_no_campo_segundos')
    .eq('formulario_id', formularioId)
    .in('tipo_evento', ['foco_campo', 'saida_campo', 'erro_campo'])

  if (!eventos || eventos.length === 0) return []

  const campos: Record<string, { interacoes: number; erros: number; tempo_total: number }> = {}

  for (const e of eventos) {
    const campoId = (e.dados_evento as any)?.campo_id || 'desconhecido'
    if (!campos[campoId]) campos[campoId] = { interacoes: 0, erros: 0, tempo_total: 0 }
    campos[campoId].interacoes++
    if (e.tipo_evento === 'erro_campo') campos[campoId].erros++
    if (e.tempo_no_campo_segundos) campos[campoId].tempo_total += e.tempo_no_campo_segundos
  }

  return Object.entries(campos).map(([campoId, stats]) => ({
    campo_id: campoId,
    total_interacoes: stats.interacoes,
    total_erros: stats.erros,
    tempo_medio_segundos: stats.interacoes > 0 ? Math.round(stats.tempo_total / stats.interacoes) : 0,
  }))
}

// =====================================================
// A/B Testing
// =====================================================

export interface TesteAB {
  id: string
  formulario_id: string
  organizacao_id: string
  nome_teste: string
  descricao_teste?: string | null
  status: string
  metrica_objetivo?: string | null
  confianca_minima?: number | null
  duracao_minima_dias?: number | null
  minimo_submissoes?: number | null
  variante_vencedora_id?: string | null
  criado_por?: string | null
  iniciado_em?: string | null
  pausado_em?: string | null
  concluido_em?: string | null
  criado_em?: string | null
  atualizado_em?: string | null
}

export interface VarianteAB {
  id: string
  teste_ab_id: string
  nome_variante: string
  letra_variante: string
  e_controle?: boolean | null
  alteracoes: Record<string, unknown>
  porcentagem_trafego?: number | null
  contagem_visualizacoes?: number | null
  contagem_submissoes?: number | null
  taxa_conversao?: number | null
  criado_em?: string | null
}

async function listarTestesAB(formularioId: string): Promise<TesteAB[]> {
  const organizacaoId = await getOrganizacaoId()
  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .eq('organizacao_id', organizacaoId)
    .order('criado_em', { ascending: false })
  if (error) throw new Error(`Erro ao listar testes AB: ${error.message}`)
  return (data || []) as unknown as TesteAB[]
}

async function buscarTesteAB(testeId: string): Promise<TesteAB> {
  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .select('*')
    .eq('id', testeId)
    .single()
  if (error) throw new Error(`Erro ao buscar teste AB: ${error.message}`)
  return data as unknown as TesteAB
}

async function criarTesteAB(formularioId: string, payload: {
  nome_teste: string
  descricao_teste?: string
  metrica_objetivo?: string
  confianca_minima?: number
  duracao_minima_dias?: number
  minimo_submissoes?: number
}): Promise<TesteAB> {
  const organizacaoId = await getOrganizacaoId()
  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .insert({ formulario_id: formularioId, organizacao_id: organizacaoId, ...payload })
    .select()
    .single()
  if (error) throw new Error(`Erro ao criar teste AB: ${error.message}`)
  return data as unknown as TesteAB
}

async function atualizarTesteAB(testeId: string, payload: Partial<TesteAB>): Promise<TesteAB> {
  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .update(payload as any)
    .eq('id', testeId)
    .select()
    .single()
  if (error) throw new Error(`Erro ao atualizar teste AB: ${error.message}`)
  return data as unknown as TesteAB
}

async function iniciarTesteAB(testeId: string, formularioId: string): Promise<TesteAB> {
  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .update({ status: 'em_andamento', iniciado_em: new Date().toISOString() })
    .eq('id', testeId)
    .select()
    .single()
  if (error) throw new Error(`Erro ao iniciar teste AB: ${error.message}`)

  await supabase
    .from('formularios')
    .update({ ab_testing_ativo: true, teste_ab_atual_id: testeId } as any)
    .eq('id', formularioId)

  return data as unknown as TesteAB
}

async function pausarTesteAB(testeId: string): Promise<TesteAB> {
  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .update({ status: 'pausado', pausado_em: new Date().toISOString() })
    .eq('id', testeId)
    .select()
    .single()
  if (error) throw new Error(`Erro ao pausar teste AB: ${error.message}`)
  return data as unknown as TesteAB
}

async function concluirTesteAB(testeId: string, formularioId: string): Promise<TesteAB> {
  // Buscar variante vencedora
  const { data: variantes } = await supabase
    .from('variantes_ab_formularios')
    .select('id, taxa_conversao')
    .eq('teste_ab_id', testeId)
    .order('taxa_conversao', { ascending: false })

  const vencedoraId = variantes && variantes.length > 0 ? variantes[0].id : null

  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .update({
      status: 'concluido',
      concluido_em: new Date().toISOString(),
      variante_vencedora_id: vencedoraId,
    })
    .eq('id', testeId)
    .select()
    .single()
  if (error) throw new Error(`Erro ao concluir teste AB: ${error.message}`)

  await supabase
    .from('formularios')
    .update({ ab_testing_ativo: false, teste_ab_atual_id: null } as any)
    .eq('id', formularioId)

  return data as unknown as TesteAB
}

async function listarVariantesAB(testeId: string): Promise<VarianteAB[]> {
  const { data, error } = await supabase
    .from('variantes_ab_formularios')
    .select('*')
    .eq('teste_ab_id', testeId)
    .order('letra_variante', { ascending: true })
  if (error) throw new Error(`Erro ao listar variantes: ${error.message}`)
  return (data || []) as unknown as VarianteAB[]
}

async function criarVarianteAB(testeId: string, payload: {
  nome_variante: string
  letra_variante: string
  e_controle?: boolean
  alteracoes?: Record<string, unknown>
  porcentagem_trafego?: number
}): Promise<VarianteAB> {
  const { data, error } = await supabase
    .from('variantes_ab_formularios')
    .insert({ teste_ab_id: testeId, ...payload } as any)
    .select()
    .single()
  if (error) throw new Error(`Erro ao criar variante: ${error.message}`)
  return data as unknown as VarianteAB
}

async function excluirVarianteAB(varianteId: string): Promise<void> {
  const { error } = await supabase
    .from('variantes_ab_formularios')
    .delete()
    .eq('id', varianteId)
  if (error) throw new Error(`Erro ao excluir variante: ${error.message}`)
}

// =====================================================
// Webhooks
// =====================================================

export interface WebhookFormulario {
  id: string
  formulario_id: string
  organizacao_id: string
  nome_webhook: string
  url_webhook: string
  metodo_http?: string | null
  headers_customizados?: Record<string, string> | null
  formato_payload?: string | null
  mapeamento_campos?: Record<string, string> | null
  incluir_metadados?: boolean | null
  condicoes_disparo?: Record<string, unknown> | null
  disparar_em?: string | null
  ativo?: boolean | null
  retry_ativo?: boolean | null
  max_tentativas?: number | null
  atraso_retry_segundos?: number | null
  contagem_sucesso?: number | null
  contagem_falha?: number | null
  ultimo_disparo_em?: string | null
  ultimo_status_code?: number | null
  ultimo_erro?: string | null
  criado_em?: string | null
  atualizado_em?: string | null
}

export interface LogWebhookFormulario {
  id: string
  webhook_id: string
  submissao_id?: string | null
  request_url: string
  request_metodo?: string | null
  request_headers?: Record<string, string> | null
  request_body?: string | null
  response_status_code?: number | null
  response_headers?: Record<string, string> | null
  response_body?: string | null
  response_tempo_ms?: number | null
  status?: string | null
  mensagem_erro?: string | null
  contagem_retry?: number | null
  disparado_em?: string | null
  concluido_em?: string | null
}

async function listarWebhooks(formularioId: string): Promise<WebhookFormulario[]> {
  const { data, error } = await supabase
    .from('webhooks_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .order('criado_em', { ascending: false })
  if (error) throw new Error(`Erro ao listar webhooks: ${error.message}`)
  return (data || []) as unknown as WebhookFormulario[]
}

async function criarWebhook(formularioId: string, payload: {
  nome_webhook: string
  url_webhook: string
  metodo_http?: string
  headers_customizados?: Record<string, string>
  formato_payload?: string
  retry_ativo?: boolean
  max_tentativas?: number
  atraso_retry_segundos?: number
  incluir_metadados?: boolean
}): Promise<WebhookFormulario> {
  const organizacaoId = await getOrganizacaoId()
  const { data, error } = await supabase
    .from('webhooks_formularios')
    .insert({ formulario_id: formularioId, organizacao_id: organizacaoId, ...payload } as any)
    .select()
    .single()
  if (error) throw new Error(`Erro ao criar webhook: ${error.message}`)
  return data as unknown as WebhookFormulario
}

async function atualizarWebhook(webhookId: string, payload: Partial<WebhookFormulario>): Promise<WebhookFormulario> {
  const { data, error } = await supabase
    .from('webhooks_formularios')
    .update(payload as any)
    .eq('id', webhookId)
    .select()
    .single()
  if (error) throw new Error(`Erro ao atualizar webhook: ${error.message}`)
  return data as unknown as WebhookFormulario
}

async function excluirWebhook(webhookId: string): Promise<void> {
  const { error } = await supabase
    .from('webhooks_formularios')
    .delete()
    .eq('id', webhookId)
  if (error) throw new Error(`Erro ao excluir webhook: ${error.message}`)
}

async function listarLogsWebhook(webhookId: string, limite = 20): Promise<LogWebhookFormulario[]> {
  const { data, error } = await supabase
    .from('logs_webhooks_formularios')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('disparado_em', { ascending: false })
    .limit(limite)
  if (error) throw new Error(`Erro ao listar logs: ${error.message}`)
  return (data || []) as unknown as LogWebhookFormulario[]
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
  listarSubmissoes,
  buscarSubmissao,
  listarRegras,
  criarRegra,
  atualizarRegra,
  excluirRegra,
  // Analytics
  obterMetricas,
  obterFunilConversao,
  obterDesempenhoCampos,
  // A/B Testing
  listarTestesAB,
  buscarTesteAB,
  criarTesteAB,
  atualizarTesteAB,
  iniciarTesteAB,
  pausarTesteAB,
  concluirTesteAB,
  listarVariantesAB,
  criarVarianteAB,
  excluirVarianteAB,
  // Webhooks
  listarWebhooks,
  criarWebhook,
  atualizarWebhook,
  excluirWebhook,
  listarLogsWebhook,
}
