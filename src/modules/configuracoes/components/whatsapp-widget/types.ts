/**
 * AIDEV-NOTE: Tipos do Widget WhatsApp para Website
 */

export interface WidgetWhatsAppConfig {
  ativo: boolean
  numero: string
  posicao: 'direita' | 'esquerda'
  usar_formulario: boolean
  campos_formulario: string[] // IDs dos campos_customizados
  campos_obrigatorios: string[] // IDs dos campos obrigatórios no pré-formulário
  nome_atendente: string
  foto_atendente_url: string
  mensagem_boas_vindas: string
  cor_botao: string
  funil_id: string // ID do funil/pipeline para criação de oportunidades
  notificar_email: boolean
  email_destino: string
  horario_atendimento: 'sempre' | 'personalizado'
  horario_dias: number[]          // 0=Dom, 1=Seg ... 6=Sab
  horario_inicio: string          // "09:00"
  horario_fim: string             // "18:00"
}

export const DEFAULT_WIDGET_CONFIG: WidgetWhatsAppConfig = {
  ativo: false,
  numero: '',
  posicao: 'direita',
  usar_formulario: false,
  campos_formulario: [],
  campos_obrigatorios: [],
  nome_atendente: '',
  foto_atendente_url: '',
  mensagem_boas_vindas: 'Olá! 👋 Como posso te ajudar?',
  cor_botao: '#25D366',
  funil_id: '',
  notificar_email: false,
  email_destino: '',
  horario_atendimento: 'sempre',
  horario_dias: [1, 2, 3, 4, 5],
  horario_inicio: '09:00',
  horario_fim: '18:00',
}
