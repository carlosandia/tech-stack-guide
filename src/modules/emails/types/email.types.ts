/**
 * AIDEV-NOTE: Tipos do módulo Caixa de Entrada de Email (PRD-11)
 */

export type PastaEmail = 'inbox' | 'sent' | 'drafts' | 'archived' | 'trash'

export type TipoRascunho = 'novo' | 'resposta' | 'encaminhar'

export interface EmailRecebido {
  id: string
  organizacao_id: string
  usuario_id: string
  conexao_email_id: string | null
  message_id: string
  thread_id: string | null
  provider_id: string | null
  de_email: string
  de_nome: string | null
  para_email: string
  cc_email: string | null
  bcc_email: string | null
  assunto: string | null
  corpo_html: string | null
  corpo_texto: string | null
  preview: string | null
  data_email: string
  pasta: PastaEmail
  lido: boolean
  favorito: boolean
  tem_anexos: boolean
  anexos_info: AnexoInfo[] | null
  contato_id: string | null
  oportunidade_id: string | null
  sincronizado_em: string | null
  tracking_id: string | null
  aberto_em: string | null
  total_aberturas: number
  criado_em: string
  atualizado_em: string
  deletado_em: string | null
}

export interface AnexoInfo {
  id: string
  filename: string
  mimeType: string
  size: number
}

export interface EmailRascunho {
  id: string
  organizacao_id: string
  usuario_id: string
  tipo: TipoRascunho
  email_original_id: string | null
  para_email: string | null
  cc_email: string | null
  bcc_email: string | null
  assunto: string | null
  corpo_html: string | null
  anexos_temp: unknown | null
  criado_em: string
  atualizado_em: string
  deletado_em: string | null
}

export interface EmailAssinatura {
  id: string
  organizacao_id: string
  usuario_id: string
  assinatura_html: string | null
  incluir_em_respostas: boolean
  incluir_em_novos: boolean
  criado_em: string
  atualizado_em: string
}

export interface ListarEmailsParams {
  page?: number
  per_page?: number
  pasta?: PastaEmail
  lido?: boolean
  favorito?: boolean
  tem_anexos?: boolean
  contato_id?: string
  busca?: string
  conexao_email_id?: string
}

export interface ListarEmailsResult {
  data: EmailRecebido[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ContadorNaoLidos {
  inbox: number
  total: number
}

export interface EnviarEmailPayload {
  para_email: string
  cc_email?: string
  bcc_email?: string
  assunto: string
  corpo_html: string
  conexao_email_id?: string
}

export interface ResponderEmailPayload {
  corpo_html: string
  cc_email?: string
  bcc_email?: string
}

export interface EncaminharEmailPayload {
  para_email: string
  cc_email?: string
  bcc_email?: string
  corpo_html?: string
}

export interface AtualizarEmailPayload {
  lido?: boolean
  favorito?: boolean
  pasta?: PastaEmail
  contato_id?: string | null
  oportunidade_id?: string | null
}

export type AcaoLote =
  | 'marcar_lido'
  | 'marcar_nao_lido'
  | 'arquivar'
  | 'mover_lixeira'
  | 'favoritar'
  | 'desfavoritar'
  | 'restaurar'

export interface AcaoLotePayload {
  ids: string[]
  acao: AcaoLote
}

export interface SalvarRascunhoPayload {
  id?: string
  tipo?: TipoRascunho
  email_original_id?: string
  para_email?: string
  cc_email?: string
  bcc_email?: string
  assunto?: string
  corpo_html?: string
}

export interface ConexaoEmail {
  id: string
  email: string
  nome_remetente: string | null
  tipo: string
  status: string
}
