/**
 * AIDEV-NOTE: Schemas Zod para o módulo de Automações (PRD-12)
 * Tipos de trigger, condição e ação para o motor de automação
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
  // Contatos
  { tipo: 'contato_criado', label: 'Contato criado', categoria: 'contatos', icon: 'UserPlus' },
  { tipo: 'contato_atualizado', label: 'Contato atualizado', categoria: 'contatos', icon: 'UserCog' },
  { tipo: 'contato_segmento_adicionado', label: 'Segmento adicionado', categoria: 'contatos', icon: 'Tag' },
  // Tarefas
  { tipo: 'tarefa_criada', label: 'Tarefa criada', categoria: 'tarefas', icon: 'ListPlus' },
  { tipo: 'tarefa_concluida', label: 'Tarefa concluída', categoria: 'tarefas', icon: 'CheckCircle' },
  // Formulários
  { tipo: 'formulario_submetido', label: 'Formulário preenchido', categoria: 'formularios', icon: 'FileText' },
  // Distribuição
  { tipo: 'sla_distribuicao_expirado', label: 'SLA de distribuição expirado', categoria: 'distribuicao', icon: 'Clock' },
] as const

export type TriggerTipo = typeof TRIGGER_TIPOS[number]['tipo']

// =====================================================
// Ações
// =====================================================

export const ACAO_TIPOS = [
  { tipo: 'enviar_whatsapp', label: 'Enviar WhatsApp', categoria: 'notificacao', icon: 'MessageCircle' },
  { tipo: 'enviar_email', label: 'Enviar Email', categoria: 'notificacao', icon: 'Mail' },
  { tipo: 'criar_notificacao', label: 'Notificação interna', categoria: 'notificacao', icon: 'Bell' },
  { tipo: 'criar_tarefa', label: 'Criar tarefa', categoria: 'crm', icon: 'ListChecks' },
  { tipo: 'alterar_responsavel', label: 'Alterar responsável', categoria: 'crm', icon: 'UserCheck' },
  { tipo: 'mover_etapa', label: 'Mover para etapa', categoria: 'crm', icon: 'ArrowRightCircle' },
  { tipo: 'atualizar_campo_oportunidade', label: 'Atualizar campo (Oportunidade)', categoria: 'crm', icon: 'Edit3' },
  { tipo: 'atualizar_campo_contato', label: 'Atualizar campo (Contato)', categoria: 'crm', icon: 'Edit3' },
  { tipo: 'adicionar_segmento', label: 'Adicionar segmento', categoria: 'crm', icon: 'Tag' },
  { tipo: 'aguardar', label: 'Aguardar (delay)', categoria: 'controle', icon: 'Timer' },
] as const

export type AcaoTipo = typeof ACAO_TIPOS[number]['tipo']

// =====================================================
// Schemas
// =====================================================

export const CondicaoSchema = z.object({
  campo: z.string(),
  operador: z.enum(['igual', 'diferente', 'contem', 'maior', 'menor', 'entre', 'vazio', 'nao_vazio']),
  valor: z.any().optional(),
})

export type Condicao = z.infer<typeof CondicaoSchema>

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
