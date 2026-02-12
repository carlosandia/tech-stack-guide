/**
 * AIDEV-NOTE: Schemas Zod para Formularios
 * Conforme PRD-17 - Modulo de Formularios (Etapa 1)
 */

import { z } from 'zod'

// =====================================================
// Enums
// =====================================================

export const TipoFormularioSchema = z.enum(['padrao', 'popup_saida', 'newsletter', 'multi_etapas'])
export type TipoFormulario = z.infer<typeof TipoFormularioSchema>

export const StatusFormularioSchema = z.enum(['rascunho', 'publicado', 'arquivado'])
export type StatusFormulario = z.infer<typeof StatusFormularioSchema>

export const TipoCampoSchema = z.enum([
  'texto', 'email', 'telefone', 'numero', 'textarea', 'select', 'multi_select',
  'checkbox', 'radio', 'data', 'arquivo', 'oculto', 'cpf', 'cnpj', 'cep', 'url',
])
export type TipoCampo = z.infer<typeof TipoCampoSchema>

export const LarguraCampoSchema = z.enum(['full', 'half', 'third'])
export type LarguraCampo = z.infer<typeof LarguraCampoSchema>

export const OperadorCondicionalSchema = z.enum([
  'igual', 'diferente', 'contem', 'nao_contem', 'maior', 'menor', 'vazio', 'nao_vazio',
])

export const CaptchaTipoSchema = z.enum(['recaptcha_v2', 'recaptcha_v3', 'hcaptcha'])

export const TipoLinkSchema = z.enum(['link', 'embed', 'qrcode'])

export const StatusSubmissaoSchema = z.enum(['nova', 'processada', 'erro', 'spam'])

// =====================================================
// FORMULARIO - Schema principal
// =====================================================

export const FormularioSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string(),
  descricao: z.string().nullable().optional(),
  slug: z.string(),
  tipo: TipoFormularioSchema,
  funil_id: z.string().uuid().nullable().optional(),
  etapa_id: z.string().uuid().nullable().optional(),
  status: StatusFormularioSchema,
  publicado_em: z.string().nullable().optional(),
  despublicado_em: z.string().nullable().optional(),
  titulo_pagina: z.string().nullable().optional(),
  mensagem_sucesso: z.string().nullable().optional(),
  url_redirecionamento: z.string().nullable().optional(),
  redirecionar_apos_envio: z.boolean(),
  captcha_ativo: z.boolean(),
  captcha_tipo: CaptchaTipoSchema.nullable().optional(),
  captcha_site_key: z.string().nullable().optional(),
  honeypot_ativo: z.boolean(),
  rate_limit_ativo: z.boolean(),
  rate_limit_max: z.number(),
  rate_limit_janela_minutos: z.number(),
  notificar_email: z.boolean(),
  emails_notificacao: z.array(z.string()).nullable().optional(),
  meta_titulo: z.string().nullable().optional(),
  meta_descricao: z.string().nullable().optional(),
  og_image_url: z.string().nullable().optional(),
  config_botoes: z.record(z.unknown()).nullable().optional(),
  config_pos_envio: z.record(z.unknown()).nullable().optional(),
  total_visualizacoes: z.number(),
  total_submissoes: z.number(),
  taxa_conversao: z.number(),
  criado_por: z.string().uuid().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
  deletado_em: z.string().nullable().optional(),
})

export type Formulario = z.infer<typeof FormularioSchema>

// =====================================================
// Criar Formulario
// =====================================================

export const CriarFormularioSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(255),
  descricao: z.string().optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minusculas, numeros e hifens').optional(),
  tipo: TipoFormularioSchema.optional().default('padrao'),
  funil_id: z.string().uuid().optional(),
  etapa_id: z.string().uuid().optional(),
  titulo_pagina: z.string().max(255).optional(),
  mensagem_sucesso: z.string().optional(),
  url_redirecionamento: z.string().url().optional(),
  redirecionar_apos_envio: z.boolean().optional(),
  captcha_ativo: z.boolean().optional(),
  captcha_tipo: CaptchaTipoSchema.optional(),
  captcha_site_key: z.string().optional(),
  honeypot_ativo: z.boolean().optional(),
  rate_limit_ativo: z.boolean().optional(),
  rate_limit_max: z.number().int().min(1).max(1000).optional(),
  rate_limit_janela_minutos: z.number().int().min(1).max(60).optional(),
  notificar_email: z.boolean().optional(),
  emails_notificacao: z.array(z.string().email()).optional(),
  meta_titulo: z.string().max(255).optional(),
  meta_descricao: z.string().optional(),
  og_image_url: z.string().url().optional(),
})

export type CriarFormularioPayload = z.infer<typeof CriarFormularioSchema>

// =====================================================
// Atualizar Formulario
// =====================================================

export const AtualizarFormularioSchema = CriarFormularioSchema.partial()

export type AtualizarFormularioPayload = z.infer<typeof AtualizarFormularioSchema>

// =====================================================
// Listar Formularios (query)
// =====================================================

export const ListarFormulariosQuerySchema = z.object({
  status: StatusFormularioSchema.optional(),
  tipo: TipoFormularioSchema.optional(),
  busca: z.string().max(255).optional(),
  funil_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListarFormulariosQuery = z.infer<typeof ListarFormulariosQuerySchema>

// =====================================================
// CAMPOS DO FORMULARIO
// =====================================================

export const CampoFormularioSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  nome: z.string(),
  label: z.string(),
  placeholder: z.string().nullable().optional(),
  texto_ajuda: z.string().nullable().optional(),
  tipo: TipoCampoSchema,
  obrigatorio: z.boolean(),
  validacoes: z.any().optional(),
  opcoes: z.any().optional(),
  mapeamento_campo: z.string().nullable().optional(),
  largura: LarguraCampoSchema,
  ordem: z.number(),
  condicional_ativo: z.boolean(),
  condicional_campo_id: z.string().uuid().nullable().optional(),
  condicional_operador: z.string().nullable().optional(),
  condicional_valor: z.string().nullable().optional(),
  etapa_numero: z.number().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type CampoFormulario = z.infer<typeof CampoFormularioSchema>

export const CriarCampoSchema = z.object({
  nome: z.string().min(1).max(255),
  label: z.string().min(1).max(255),
  placeholder: z.string().max(255).optional(),
  texto_ajuda: z.string().optional(),
  tipo: TipoCampoSchema.optional().default('texto'),
  obrigatorio: z.boolean().optional().default(false),
  validacoes: z.record(z.any()).optional(),
  opcoes: z.array(z.object({
    label: z.string(),
    valor: z.string(),
  })).optional(),
  mapeamento_campo: z.string().max(100).optional(),
  largura: LarguraCampoSchema.optional().default('full'),
  ordem: z.number().int().optional(),
  condicional_ativo: z.boolean().optional(),
  condicional_campo_id: z.string().uuid().optional(),
  condicional_operador: OperadorCondicionalSchema.optional(),
  condicional_valor: z.string().optional(),
  etapa_numero: z.number().int().min(1).optional(),
})

export type CriarCampoPayload = z.infer<typeof CriarCampoSchema>

export const AtualizarCampoSchema = CriarCampoSchema.partial()
export type AtualizarCampoPayload = z.infer<typeof AtualizarCampoSchema>

export const ReordenarCamposSchema = z.object({
  campos: z.array(z.object({
    id: z.string().uuid(),
    ordem: z.number().int().min(0),
  })),
})

export type ReordenarCamposPayload = z.infer<typeof ReordenarCamposSchema>

// =====================================================
// ESTILOS DO FORMULARIO
// =====================================================

export const EstiloFormularioSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  container: z.any(),
  cabecalho: z.any(),
  campos: z.any(),
  botao: z.any(),
  pagina: z.any(),
  css_customizado: z.string().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type EstiloFormulario = z.infer<typeof EstiloFormularioSchema>

export const AtualizarEstiloSchema = z.object({
  container: z.record(z.any()).optional(),
  cabecalho: z.record(z.any()).optional(),
  campos: z.record(z.any()).optional(),
  botao: z.record(z.any()).optional(),
  pagina: z.record(z.any()).optional(),
  css_customizado: z.string().nullable().optional(),
})

export type AtualizarEstiloPayload = z.infer<typeof AtualizarEstiloSchema>

// =====================================================
// SUBMISSOES
// =====================================================

export const SubmissaoFormularioSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  dados: z.any(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),
  pagina_origem: z.string().nullable().optional(),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  utm_term: z.string().nullable().optional(),
  utm_content: z.string().nullable().optional(),
  geo_pais: z.string().nullable().optional(),
  geo_estado: z.string().nullable().optional(),
  geo_cidade: z.string().nullable().optional(),
  lead_score: z.number().nullable().optional(),
  contato_id: z.string().uuid().nullable().optional(),
  oportunidade_id: z.string().uuid().nullable().optional(),
  status: StatusSubmissaoSchema,
  erro_mensagem: z.string().nullable().optional(),
  honeypot_preenchido: z.boolean(),
  captcha_validado: z.boolean().nullable().optional(),
  criado_em: z.string(),
})

export type SubmissaoFormulario = z.infer<typeof SubmissaoFormularioSchema>

export const SubmeterFormularioPublicoSchema = z.object({
  dados: z.record(z.any()),
  honeypot: z.string().optional(),
  captcha_token: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
  pagina_origem: z.string().optional(),
  referrer: z.string().optional(),
})

export type SubmeterFormularioPublicoPayload = z.infer<typeof SubmeterFormularioPublicoSchema>

export const ListarSubmissoesQuerySchema = z.object({
  status: StatusSubmissaoSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListarSubmissoesQuery = z.infer<typeof ListarSubmissoesQuerySchema>

// =====================================================
// LINKS DE COMPARTILHAMENTO
// =====================================================

export const LinkCompartilhamentoSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  tipo: TipoLinkSchema,
  url_completa: z.string(),
  codigo_embed: z.string().nullable().optional(),
  qrcode_data: z.string().nullable().optional(),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  ativo: z.boolean(),
  total_cliques: z.number(),
  criado_por: z.string().uuid().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type LinkCompartilhamento = z.infer<typeof LinkCompartilhamentoSchema>

export const CriarLinkCompartilhamentoSchema = z.object({
  tipo: TipoLinkSchema.optional().default('link'),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
})

export type CriarLinkCompartilhamentoPayload = z.infer<typeof CriarLinkCompartilhamentoSchema>

// =====================================================
// ENUMS ETAPA 2
// =====================================================

export const TipoGatilhoPopupSchema = z.enum(['intencao_saida', 'atraso_tempo', 'porcentagem_scroll', 'clique'])
export const TipoAnimacaoPopupSchema = z.enum(['fade', 'slide_cima', 'slide_baixo', 'zoom', 'nenhum'])
export const PosicaoPopupSchema = z.enum(['centro', 'topo_direita', 'baixo_direita', 'baixo_esquerda', 'topo_esquerda'])
export const PosicaoImagemPopupSchema = z.enum(['topo', 'esquerda', 'direita', 'fundo'])
export const TipoBotaoEnvioSchema = z.enum(['padrao', 'whatsapp'])
export const FrequenciaEnvioSchema = z.enum(['diario', 'semanal', 'quinzenal', 'mensal', 'custom'])
export const ProvedorExternoSchema = z.enum(['mailchimp', 'sendgrid', 'mailerlite', 'convertkit', 'nenhum'])

// =====================================================
// CONFIG POPUP FORMULARIOS
// =====================================================

export const ConfigPopupSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  tipo_gatilho: TipoGatilhoPopupSchema,
  atraso_segundos: z.number(),
  porcentagem_scroll: z.number(),
  seletor_elemento_clique: z.string().nullable().optional(),
  mostrar_uma_vez_sessao: z.boolean(),
  dias_expiracao_cookie: z.number(),
  mostrar_mobile: z.boolean(),
  cor_fundo_overlay: z.string(),
  clique_overlay_fecha: z.boolean(),
  tipo_animacao: TipoAnimacaoPopupSchema,
  duracao_animacao_ms: z.number(),
  popup_imagem_url: z.string().nullable().optional(),
  popup_imagem_posicao: PosicaoImagemPopupSchema,
  posicao: PosicaoPopupSchema,
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type ConfigPopup = z.infer<typeof ConfigPopupSchema>

export const AtualizarConfigPopupSchema = z.object({
  tipo_gatilho: TipoGatilhoPopupSchema.optional(),
  atraso_segundos: z.number().int().min(0).max(300).optional(),
  porcentagem_scroll: z.number().int().min(0).max(100).optional(),
  seletor_elemento_clique: z.string().max(255).optional(),
  mostrar_uma_vez_sessao: z.boolean().optional(),
  dias_expiracao_cookie: z.number().int().min(1).max(365).optional(),
  mostrar_mobile: z.boolean().optional(),
  cor_fundo_overlay: z.string().max(30).optional(),
  clique_overlay_fecha: z.boolean().optional(),
  tipo_animacao: TipoAnimacaoPopupSchema.optional(),
  duracao_animacao_ms: z.number().int().min(0).max(2000).optional(),
  popup_imagem_url: z.string().url().nullable().optional(),
  popup_imagem_posicao: PosicaoImagemPopupSchema.optional(),
  posicao: PosicaoPopupSchema.optional(),
})

export type AtualizarConfigPopupPayload = z.infer<typeof AtualizarConfigPopupSchema>

// =====================================================
// CONFIG NEWSLETTER FORMULARIOS
// =====================================================

export const ConfigNewsletterSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  double_optin_ativo: z.boolean(),
  assunto_email_confirmacao: z.string(),
  template_email_confirmacao: z.string().nullable().optional(),
  nome_lista: z.string().nullable().optional(),
  tags: z.any().nullable().optional(),
  frequencia_envio: z.string().nullable().optional(),
  descricao_frequencia_envio: z.string().nullable().optional(),
  texto_consentimento: z.string(),
  url_politica_privacidade: z.string().nullable().optional(),
  mostrar_checkbox_consentimento: z.boolean(),
  provedor_externo: z.string().nullable().optional(),
  id_lista_externa: z.string().nullable().optional(),
  ref_api_key_externa: z.string().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type ConfigNewsletter = z.infer<typeof ConfigNewsletterSchema>

export const AtualizarConfigNewsletterSchema = z.object({
  double_optin_ativo: z.boolean().optional(),
  assunto_email_confirmacao: z.string().max(255).optional(),
  template_email_confirmacao: z.string().optional(),
  nome_lista: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  frequencia_envio: FrequenciaEnvioSchema.optional(),
  descricao_frequencia_envio: z.string().optional(),
  texto_consentimento: z.string().optional(),
  url_politica_privacidade: z.string().url().nullable().optional(),
  mostrar_checkbox_consentimento: z.boolean().optional(),
  provedor_externo: ProvedorExternoSchema.optional(),
  id_lista_externa: z.string().max(100).optional(),
  ref_api_key_externa: z.string().max(100).optional(),
})

export type AtualizarConfigNewsletterPayload = z.infer<typeof AtualizarConfigNewsletterSchema>

// =====================================================
// ETAPAS FORMULARIOS (Multi-step)
// =====================================================

export const EtapaFormularioSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  indice_etapa: z.number(),
  titulo_etapa: z.string(),
  descricao_etapa: z.string().nullable().optional(),
  icone_etapa: z.string().nullable().optional(),
  validar_ao_avancar: z.boolean(),
  texto_botao_proximo: z.string(),
  texto_botao_anterior: z.string(),
  texto_botao_enviar: z.string(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type EtapaFormulario = z.infer<typeof EtapaFormularioSchema>

export const CriarEtapaSchema = z.object({
  indice_etapa: z.number().int().min(0),
  titulo_etapa: z.string().min(1).max(255),
  descricao_etapa: z.string().optional(),
  icone_etapa: z.string().max(50).optional(),
  validar_ao_avancar: z.boolean().optional().default(true),
  texto_botao_proximo: z.string().max(50).optional().default('Proximo'),
  texto_botao_anterior: z.string().max(50).optional().default('Voltar'),
  texto_botao_enviar: z.string().max(50).optional().default('Enviar'),
})

export type CriarEtapaPayload = z.infer<typeof CriarEtapaSchema>

export const AtualizarEtapasSchema = z.object({
  etapas: z.array(CriarEtapaSchema),
})

export type AtualizarEtapasPayload = z.infer<typeof AtualizarEtapasSchema>

// =====================================================
// CAMPOS ADICIONAIS FORMULARIO (Etapa 2)
// =====================================================

export const AtualizarFormularioEtapa2Schema = z.object({
  tipo_botao_envio: TipoBotaoEnvioSchema.optional(),
  whatsapp_numero: z.string().max(20).optional(),
  whatsapp_mensagem_template: z.string().optional(),
  max_submissoes: z.number().int().min(1).nullable().optional(),
  data_inicio: z.string().datetime().nullable().optional(),
  data_fim: z.string().datetime().nullable().optional(),
  mensagem_fechado: z.string().optional(),
  tracking_conversao_ativo: z.boolean().optional(),
  google_ads_conversion_id: z.string().max(100).optional(),
  google_ads_conversion_label: z.string().max(100).optional(),
  facebook_pixel_id: z.string().max(100).optional(),
  facebook_event_name: z.string().max(50).optional(),
})

export type AtualizarFormularioEtapa2Payload = z.infer<typeof AtualizarFormularioEtapa2Schema>

// =====================================================
// ENUMS ETAPA 3
// =====================================================

export const TipoAcaoCondicionalSchema = z.enum([
  'mostrar_campo', 'ocultar_campo', 'mostrar_etapa', 'ocultar_etapa',
  'pular_para_etapa', 'redirecionar', 'definir_valor', 'tornar_obrigatorio',
])
export type TipoAcaoCondicional = z.infer<typeof TipoAcaoCondicionalSchema>

export const LogicaCondicoesSchema = z.enum(['e', 'ou'])

export const MetodoIdentificacaoSchema = z.enum(['email', 'cookie', 'email_e_cookie'])

// =====================================================
// REGRAS CONDICIONAIS
// =====================================================

export const CondicaoRegraSchema = z.object({
  campo_id: z.string().uuid(),
  operador: z.enum(['igual', 'diferente', 'contem', 'nao_contem', 'maior_que', 'menor_que', 'vazio', 'nao_vazio']),
  valor: z.string().optional(),
  logica: LogicaCondicoesSchema.optional(),
})

export type CondicaoRegra = z.infer<typeof CondicaoRegraSchema>

export const RegraCondicionalSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  nome_regra: z.string(),
  ordem_regra: z.number(),
  ativa: z.boolean(),
  tipo_acao: TipoAcaoCondicionalSchema,
  campo_alvo_id: z.string().uuid().nullable().optional(),
  indice_etapa_alvo: z.number().nullable().optional(),
  url_redirecionamento_alvo: z.string().nullable().optional(),
  valor_alvo: z.string().nullable().optional(),
  condicoes: z.array(CondicaoRegraSchema),
  logica_condicoes: LogicaCondicoesSchema,
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type RegraCondicional = z.infer<typeof RegraCondicionalSchema>

export const CriarRegraCondicionalSchema = z.object({
  nome_regra: z.string().min(1).max(100),
  ordem_regra: z.number().int().optional().default(0),
  ativa: z.boolean().optional().default(true),
  tipo_acao: TipoAcaoCondicionalSchema,
  campo_alvo_id: z.string().uuid().optional(),
  indice_etapa_alvo: z.number().int().optional(),
  url_redirecionamento_alvo: z.string().url().optional(),
  valor_alvo: z.string().optional(),
  condicoes: z.array(CondicaoRegraSchema).min(1, 'Pelo menos uma condicao e obrigatoria'),
  logica_condicoes: LogicaCondicoesSchema.optional().default('e'),
})

export type CriarRegraCondicionalPayload = z.infer<typeof CriarRegraCondicionalSchema>

export const AtualizarRegraCondicionalSchema = CriarRegraCondicionalSchema.partial()
export type AtualizarRegraCondicionalPayload = z.infer<typeof AtualizarRegraCondicionalSchema>

export const ReordenarRegrasCondicionaisSchema = z.object({
  regras: z.array(z.object({
    id: z.string().uuid(),
    ordem_regra: z.number().int().min(0),
  })),
})

export type ReordenarRegrasCondicionaisPayload = {
  regras: Array<{ id: string; ordem_regra: number }>
}

// =====================================================
// CONFIG PROGRESSIVE PROFILING
// =====================================================

export const ConfigProgressiveProfilingSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  ativo: z.boolean(),
  metodo_identificacao: z.string(),
  nome_cookie: z.string(),
  dias_expiracao_cookie: z.number(),
  ocultar_campos_conhecidos: z.boolean(),
  mostrar_campos_alternativos: z.boolean(),
  min_campos_exibir: z.number(),
  ordem_prioridade_campos: z.array(z.string()),
  saudacao_lead_conhecido: z.string(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})

export type ConfigProgressiveProfiling = z.infer<typeof ConfigProgressiveProfilingSchema>

export const AtualizarConfigProfilingSchema = z.object({
  ativo: z.boolean().optional(),
  metodo_identificacao: MetodoIdentificacaoSchema.optional(),
  nome_cookie: z.string().max(100).optional(),
  dias_expiracao_cookie: z.number().int().min(1).max(730).optional(),
  ocultar_campos_conhecidos: z.boolean().optional(),
  mostrar_campos_alternativos: z.boolean().optional(),
  min_campos_exibir: z.number().int().min(1).max(20).optional(),
  ordem_prioridade_campos: z.array(z.string().uuid()).optional(),
  saudacao_lead_conhecido: z.string().max(500).optional(),
})

export type AtualizarConfigProfilingPayload = z.infer<typeof AtualizarConfigProfilingSchema>

// =====================================================
// ENUMS ETAPA 4
// =====================================================

export const StatusTesteABSchema = z.enum(['rascunho', 'em_andamento', 'pausado', 'concluido'])
export const MetricaObjetivoSchema = z.enum(['taxa_conversao', 'taxa_submissao', 'tempo_preenchimento'])
export const MetodoHttpWebhookSchema = z.enum(['POST', 'PUT', 'PATCH'])
export const FormatoPayloadSchema = z.enum(['json', 'form_urlencoded', 'xml'])
export const DispararEmSchema = z.enum(['submissao', 'lead_qualificado', 'resposta_especifica'])
export const TipoEventoAnalyticsSchema = z.enum([
  'visualizacao', 'inicio', 'foco_campo', 'saida_campo',
  'erro_campo', 'etapa_concluida', 'submissao', 'abandono',
])

// =====================================================
// A/B TESTING
// =====================================================

export const TesteABSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome_teste: z.string(),
  descricao_teste: z.string().nullable().optional(),
  status: StatusTesteABSchema,
  metrica_objetivo: z.string(),
  confianca_minima: z.number(),
  duracao_minima_dias: z.number(),
  minimo_submissoes: z.number(),
  iniciado_em: z.string().nullable().optional(),
  pausado_em: z.string().nullable().optional(),
  concluido_em: z.string().nullable().optional(),
  variante_vencedora_id: z.string().uuid().nullable().optional(),
  criado_por: z.string().uuid().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})
export type TesteAB = z.infer<typeof TesteABSchema>

export const CriarTesteABSchema = z.object({
  nome_teste: z.string().min(1).max(255),
  descricao_teste: z.string().optional(),
  metrica_objetivo: MetricaObjetivoSchema.optional().default('taxa_conversao'),
  confianca_minima: z.number().min(50).max(99.99).optional().default(95),
  duracao_minima_dias: z.number().int().min(1).max(90).optional().default(7),
  minimo_submissoes: z.number().int().min(10).max(10000).optional().default(100),
})
export type CriarTesteABPayload = z.infer<typeof CriarTesteABSchema>

export const AtualizarTesteABSchema = CriarTesteABSchema.partial()
export type AtualizarTesteABPayload = z.infer<typeof AtualizarTesteABSchema>

// Variantes
export const VarianteABSchema = z.object({
  id: z.string().uuid(),
  teste_ab_id: z.string().uuid(),
  nome_variante: z.string(),
  letra_variante: z.string(),
  e_controle: z.boolean(),
  alteracoes: z.any(),
  porcentagem_trafego: z.number(),
  contagem_visualizacoes: z.number(),
  contagem_submissoes: z.number(),
  taxa_conversao: z.number(),
  criado_em: z.string(),
})
export type VarianteAB = z.infer<typeof VarianteABSchema>

export const CriarVarianteABSchema = z.object({
  nome_variante: z.string().min(1).max(100),
  letra_variante: z.string().length(1),
  e_controle: z.boolean().optional().default(false),
  alteracoes: z.record(z.any()).optional().default({}),
  porcentagem_trafego: z.number().int().min(0).max(100).optional().default(50),
})
export type CriarVarianteABPayload = z.infer<typeof CriarVarianteABSchema>

// =====================================================
// WEBHOOKS FORMULARIOS
// =====================================================

export const WebhookFormularioSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome_webhook: z.string(),
  url_webhook: z.string(),
  metodo_http: z.string(),
  headers_customizados: z.any(),
  formato_payload: z.string(),
  incluir_metadados: z.boolean(),
  mapeamento_campos: z.any(),
  disparar_em: z.string(),
  condicoes_disparo: z.any().nullable().optional(),
  retry_ativo: z.boolean(),
  max_tentativas: z.number(),
  atraso_retry_segundos: z.number(),
  ativo: z.boolean(),
  ultimo_disparo_em: z.string().nullable().optional(),
  ultimo_status_code: z.number().nullable().optional(),
  ultimo_erro: z.string().nullable().optional(),
  contagem_sucesso: z.number(),
  contagem_falha: z.number(),
  criado_em: z.string(),
  atualizado_em: z.string(),
})
export type WebhookFormulario = z.infer<typeof WebhookFormularioSchema>

export const CriarWebhookFormularioSchema = z.object({
  nome_webhook: z.string().min(1).max(100),
  url_webhook: z.string().url(),
  metodo_http: MetodoHttpWebhookSchema.optional().default('POST'),
  headers_customizados: z.record(z.string()).optional(),
  formato_payload: FormatoPayloadSchema.optional().default('json'),
  incluir_metadados: z.boolean().optional().default(true),
  mapeamento_campos: z.record(z.string()).optional(),
  disparar_em: DispararEmSchema.optional().default('submissao'),
  condicoes_disparo: z.record(z.any()).optional(),
  retry_ativo: z.boolean().optional().default(true),
  max_tentativas: z.number().int().min(1).max(10).optional().default(3),
  atraso_retry_segundos: z.number().int().min(10).max(3600).optional().default(60),
})
export type CriarWebhookFormularioPayload = z.infer<typeof CriarWebhookFormularioSchema>

export const AtualizarWebhookFormularioSchema = CriarWebhookFormularioSchema.partial().extend({
  ativo: z.boolean().optional(),
})
export type AtualizarWebhookFormularioPayload = z.infer<typeof AtualizarWebhookFormularioSchema>

// =====================================================
// EVENTOS ANALYTICS FORMULARIOS
// =====================================================

export const EventoAnalyticsSchema = z.object({
  id: z.string().uuid(),
  formulario_id: z.string().uuid(),
  visitor_id: z.string().nullable().optional(),
  session_id: z.string().nullable().optional(),
  tipo_evento: TipoEventoAnalyticsSchema,
  dados_evento: z.any(),
  tempo_no_formulario_segundos: z.number().nullable().optional(),
  tempo_no_campo_segundos: z.number().nullable().optional(),
  url_pagina: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),
  tipo_dispositivo: z.string().nullable().optional(),
  navegador: z.string().nullable().optional(),
  variante_ab_id: z.string().uuid().nullable().optional(),
  criado_em: z.string(),
})
export type EventoAnalytics = z.infer<typeof EventoAnalyticsSchema>

export const RegistrarEventoSchema = z.object({
  tipo_evento: TipoEventoAnalyticsSchema,
  dados_evento: z.record(z.any()).optional(),
  visitor_id: z.string().max(64).optional(),
  session_id: z.string().max(64).optional(),
  tempo_no_formulario_segundos: z.number().int().optional(),
  tempo_no_campo_segundos: z.number().int().optional(),
  url_pagina: z.string().optional(),
  referrer: z.string().optional(),
  tipo_dispositivo: z.string().max(20).optional(),
  navegador: z.string().max(50).optional(),
  variante_ab_id: z.string().uuid().optional(),
})
export type RegistrarEventoPayload = z.infer<typeof RegistrarEventoSchema>

export const FiltroAnalyticsSchema = z.object({
  data_inicio: z.string().datetime().optional(),
  data_fim: z.string().datetime().optional(),
  tipo_evento: TipoEventoAnalyticsSchema.optional(),
})
