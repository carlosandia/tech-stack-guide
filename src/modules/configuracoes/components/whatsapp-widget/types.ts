/**
 * AIDEV-NOTE: Tipos do Widget WhatsApp para Website
 */

export interface WidgetWhatsAppConfig {
  ativo: boolean
  numero: string
  posicao: 'direita' | 'esquerda'
  usar_formulario: boolean
  campos_formulario: string[] // IDs dos campos_customizados
  nome_atendente: string
  foto_atendente_url: string
  mensagem_boas_vindas: string
  cor_botao: string
}

export const DEFAULT_WIDGET_CONFIG: WidgetWhatsAppConfig = {
  ativo: false,
  numero: '',
  posicao: 'direita',
  usar_formulario: false,
  campos_formulario: [],
  nome_atendente: '',
  foto_atendente_url: '',
  mensagem_boas_vindas: 'Olá! 👋 Como posso te ajudar?',
  cor_botao: '#25D366',
}
