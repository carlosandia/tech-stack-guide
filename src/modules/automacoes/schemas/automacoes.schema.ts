/**
 * AIDEV-NOTE: Schemas Zod para o módulo de Automações (PRD-12 + Melhorias)
 * Tipos de trigger, condição, ação e validação para o motor de automação
 */

import { z } from 'zod'

// =====================================================
// Enums de Triggers
// =====================================================

export const TRIGGER_CATEGORIAS = [
  { key: 'oportunidades', label: 'Oportunidades' },
  { key: 'contatos', label: 'Contatos' },
  { key: 'tarefas', label: 'Tarefas' },
  { key: 'formularios', label: 'Formulários' },
  { key: 'comunicacao', label: 'Comunicação' },
  { key: 'distribuicao', label: 'Distribuição' },
] as const

export const TRIGGER_TIPOS = [
  // Oportunidades
  { tipo: 'oportunidade_criada', label: 'Oportunidade criada', categoria: 'oportunidades', icon: 'Plus' },
  { tipo: 'oportunidade_etapa_movida', label: 'Oportunidade movida de etapa', categoria: 'oportunidades', icon: 'ArrowRight' },
  { tipo: 'oportunidade_ganha', label: 'Oportunidade ganha', categoria: 'oportunidades', icon: 'Trophy' },
  { tipo: 'oportunidade_perdida', label: 'Oportunidade perdida', categoria: 'oportunidades', icon: 'XCircle' },
  { tipo: 'oportunidade_responsavel_alterado', label: 'Responsável alterado', categoria: 'oportunidades', icon: 'UserCheck' },
  { tipo: 'oportunidade_valor_alterado', label: 'Valor alterado', categoria: 'oportunidades', icon: 'DollarSign' },
  { tipo: 'oportunidade_qualificada', label: 'Oportunidade qualificada (MQL)', categoria: 'oportunidades', icon: 'Award' },
  // Contatos
  { tipo: 'contato_criado', label: 'Contato criado', categoria: 'contatos', icon: 'UserPlus' },
  { tipo: 'contato_atualizado', label: 'Contato atualizado', categoria: 'contatos', icon: 'UserCog' },
  { tipo: 'contato_segmento_adicionado', label: 'Segmento adicionado', categoria: 'contatos', icon: 'Tag' },
  { tipo: 'campo_contato_alterado', label: 'Campo específico alterado', categoria: 'contatos', icon: 'FileEdit' },
  // Tarefas
  { tipo: 'tarefa_criada', label: 'Tarefa criada', categoria: 'tarefas', icon: 'ListPlus' },
  { tipo: 'tarefa_concluida', label: 'Tarefa concluída', categoria: 'tarefas', icon: 'CheckCircle' },
  // Formulários
  { tipo: 'formulario_submetido', label: 'Formulário preenchido', categoria: 'formularios', icon: 'FileText' },
  // Comunicação
  { tipo: 'mensagem_recebida', label: 'Mensagem recebida (WhatsApp/Instagram)', categoria: 'comunicacao', icon: 'MessageSquare' },
  { tipo: 'conversa_criada', label: 'Nova conversa iniciada', categoria: 'comunicacao', icon: 'MessagesSquare' },
  { tipo: 'email_recebido', label: 'Email recebido', categoria: 'comunicacao', icon: 'MailOpen' },
  { tipo: 'conversa_finalizada', label: 'Conversa finalizada', categoria: 'comunicacao', icon: 'CheckSquare' },
  // Distribuição
  { tipo: 'sla_distribuicao_expirado', label: 'SLA de distribuição expirado', categoria: 'distribuicao', icon: 'Clock' },
] as const

export type TriggerTipo = typeof TRIGGER_TIPOS[number]['tipo']

// =====================================================
// Categorias de Ações (reorganizadas - Parte 7)
// =====================================================

export const ACAO_CATEGORIAS = [
  { key: 'comunicacao', label: 'Comunicação' },
  { key: 'crm', label: 'CRM' },
  { key: 'contato', label: 'Gerenciar Contato' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'controle', label: 'Controle' },
  { key: 'integracoes', label: 'Integrações' },
] as const

// =====================================================
// Ações
// =====================================================

export const ACAO_TIPOS = [
  // Comunicação
  { tipo: 'enviar_whatsapp', label: 'Enviar WhatsApp', categoria: 'comunicacao', icon: 'MessageCircle' },
  { tipo: 'enviar_email', label: 'Enviar Email', categoria: 'comunicacao', icon: 'Mail' },
  { tipo: 'criar_notificacao', label: 'Notificação interna', categoria: 'comunicacao', icon: 'Bell' },
  // CRM
  { tipo: 'criar_oportunidade', label: 'Criar oportunidade', categoria: 'crm', icon: 'PlusCircle' },
  { tipo: 'criar_tarefa', label: 'Criar tarefa', categoria: 'crm', icon: 'ListChecks' },
  { tipo: 'mover_etapa', label: 'Mover para etapa', categoria: 'crm', icon: 'ArrowRightCircle' },
  { tipo: 'marcar_resultado_oportunidade', label: 'Marcar resultado (Ganho/Perda)', categoria: 'crm', icon: 'Flag' },
  { tipo: 'adicionar_nota', label: 'Adicionar nota na oportunidade', categoria: 'crm', icon: 'StickyNote' },
  // Gerenciar Contato
  { tipo: 'atualizar_campo_oportunidade', label: 'Atualizar campo (Oportunidade)', categoria: 'contato', icon: 'Edit3' },
  { tipo: 'atualizar_campo_contato', label: 'Atualizar campo (Contato)', categoria: 'contato', icon: 'Edit3' },
  { tipo: 'adicionar_segmento', label: 'Adicionar segmento', categoria: 'contato', icon: 'Tag' },
  { tipo: 'remover_segmento', label: 'Remover segmento', categoria: 'contato', icon: 'TagOff' },
  { tipo: 'alterar_status_contato', label: 'Alterar status do contato', categoria: 'contato', icon: 'ToggleLeft' },
  // Responsável
  { tipo: 'alterar_responsavel', label: 'Alterar responsável', categoria: 'responsavel', icon: 'UserCheck' },
  { tipo: 'distribuir_responsavel', label: 'Distribuir (Round Robin)', categoria: 'responsavel', icon: 'Users' },
  // Controle
  { tipo: 'aguardar', label: 'Aguardar (delay)', categoria: 'controle', icon: 'Timer' },
  // Integrações
  { tipo: 'enviar_webhook', label: 'Enviar Webhook', categoria: 'integracoes', icon: 'Webhook' },
  { tipo: 'alterar_status_conversa', label: 'Alterar status da conversa', categoria: 'integracoes', icon: 'MessageSquareDashed' },
] as const

export type AcaoTipo = typeof ACAO_TIPOS[number]['tipo']

// =====================================================
// Operadores de Validação (Parte 2 — nó Validação)
// =====================================================

export const VALIDACAO_OPERADORES = [
  { value: 'iguais', label: 'Texto exato' },
  { value: 'desiguais', label: 'Texto diferente' },
  { value: 'contem', label: 'Contém substring' },
  { value: 'nao_contem', label: 'Não contém substring' },
  { value: 'comprimento', label: 'Tem X caracteres' },
  { value: 'expressao_regular', label: 'Expressão regular (Regex)' },
] as const

export const VALIDACAO_TIPOS_CONTEUDO = [
  { value: 'numeros', label: 'Apenas números' },
  { value: 'letras', label: 'Apenas letras' },
  { value: 'telefone', label: 'Formato de telefone' },
  { value: 'email', label: 'Formato de email' },
  { value: 'faixa_numeros', label: 'Faixa numérica (ex: 1-10)' },
] as const

// =====================================================
// Schemas
// =====================================================

export const CondicaoSchema = z.object({
  campo: z.string(),
  operador: z.enum(['igual', 'diferente', 'contem', 'maior', 'menor', 'entre', 'vazio', 'nao_vazio']),
  valor: z.any().optional(),
})

export type Condicao = z.infer<typeof CondicaoSchema>

export const ValidacaoCondicaoSchema = z.object({
  operador: z.string(),
  tipo_conteudo: z.string().optional(),
  valor: z.string().optional(),
  valor_min: z.number().optional(),
  valor_max: z.number().optional(),
})

export type ValidacaoCondicao = z.infer<typeof ValidacaoCondicaoSchema>

export const AcaoSchema = z.object({
  tipo: z.string(),
  config: z.record(z.any()).default({}),
})

export type Acao = z.infer<typeof AcaoSchema>

export const AutomacaoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string(),
  descricao: z.string().nullable().optional(),
  ativo: z.boolean(),
  trigger_tipo: z.string(),
  trigger_config: z.record(z.any()),
  condicoes: z.array(CondicaoSchema),
  acoes: z.array(AcaoSchema),
  max_execucoes_hora: z.number(),
  total_execucoes: z.number(),
  total_erros: z.number(),
  ultima_execucao_em: z.string().nullable().optional(),
  criado_por: z.string().uuid().nullable().optional(),
  criado_em: z.string(),
  atualizado_em: z.string(),
  deletado_em: z.string().nullable().optional(),
})

export type Automacao = z.infer<typeof AutomacaoSchema>

export const CriarAutomacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(500).optional(),
  trigger_tipo: z.string().min(1, 'Selecione um gatilho'),
  trigger_config: z.record(z.any()).default({}),
  condicoes: z.array(CondicaoSchema).default([]),
  acoes: z.array(AcaoSchema).min(1, 'Adicione pelo menos uma ação'),
})

export type CriarAutomacaoInput = z.infer<typeof CriarAutomacaoSchema>

export const LogAutomacaoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  automacao_id: z.string().uuid(),
  trigger_tipo: z.string(),
  entidade_tipo: z.string().nullable().optional(),
  entidade_id: z.string().uuid().nullable().optional(),
  status: z.string(),
  acoes_executadas: z.array(z.any()),
  erro_mensagem: z.string().nullable().optional(),
  dados_trigger: z.record(z.any()).nullable().optional(),
  duracao_ms: z.number().nullable().optional(),
  criado_em: z.string(),
})

export type LogAutomacao = z.infer<typeof LogAutomacaoSchema>

// =====================================================
// Campos disponíveis para condições (Parte 3)
// =====================================================

export const CAMPOS_CONDICAO = [
  // Contato
  { value: 'contato.nome', label: 'Nome do contato', grupo: 'Contato' },
  { value: 'contato.email', label: 'Email do contato', grupo: 'Contato' },
  { value: 'contato.telefone', label: 'Telefone do contato', grupo: 'Contato' },
  { value: 'contato.origem', label: 'Origem do contato', grupo: 'Contato' },
  { value: 'contato.status', label: 'Status do contato', grupo: 'Contato' },
  // Oportunidade
  { value: 'oportunidade.titulo', label: 'Título da oportunidade', grupo: 'Oportunidade' },
  { value: 'oportunidade.valor', label: 'Valor da oportunidade', grupo: 'Oportunidade' },
  { value: 'oportunidade.etapa', label: 'Etapa da oportunidade', grupo: 'Oportunidade' },
  { value: 'oportunidade.funil', label: 'Funil', grupo: 'Oportunidade' },
  { value: 'oportunidade.responsavel', label: 'Responsável', grupo: 'Oportunidade' },
  // Conversa
  { value: 'conversa.canal', label: 'Canal da conversa', grupo: 'Conversa' },
  { value: 'conversa.status', label: 'Status da conversa', grupo: 'Conversa' },
] as const

// =====================================================
// Variáveis dinâmicas
// =====================================================

export const VARIAVEIS_DINAMICAS = [
  { chave: '{{contato.nome}}', label: 'Nome do contato', categoria: 'Contato' },
  { chave: '{{contato.email}}', label: 'Email do contato', categoria: 'Contato' },
  { chave: '{{contato.telefone}}', label: 'Telefone do contato', categoria: 'Contato' },
  { chave: '{{oportunidade.titulo}}', label: 'Título da oportunidade', categoria: 'Oportunidade' },
  { chave: '{{oportunidade.valor}}', label: 'Valor da oportunidade', categoria: 'Oportunidade' },
  { chave: '{{oportunidade.etapa}}', label: 'Etapa atual', categoria: 'Oportunidade' },
  { chave: '{{oportunidade.funil}}', label: 'Funil', categoria: 'Oportunidade' },
  { chave: '{{responsavel.nome}}', label: 'Nome do responsável', categoria: 'Responsável' },
  { chave: '{{responsavel.email}}', label: 'Email do responsável', categoria: 'Responsável' },
  { chave: '{{tarefa.titulo}}', label: 'Título da tarefa', categoria: 'Tarefa' },
  { chave: '{{data.hoje}}', label: 'Data atual', categoria: 'Sistema' },
] as const
