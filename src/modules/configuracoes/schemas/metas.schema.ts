/**
 * AIDEV-NOTE: Schema Zod para formulário de Metas
 * Conforme PRD-05 - Sistema de Metas Hierárquicas
 */

import { z } from 'zod'

export const metaFormSchema = z.object({
  tipo: z.enum(['empresa', 'equipe', 'individual']),
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  metrica: z.enum([
    'valor_vendas', 'mrr', 'ticket_medio',
    'quantidade_vendas', 'novos_negocios', 'taxa_conversao',
    'reunioes', 'ligacoes', 'emails', 'tarefas',
    'novos_contatos', 'mqls', 'sqls',
    'tempo_fechamento', 'velocidade_pipeline',
  ]),
  valor_meta: z.number().positive('Valor deve ser positivo'),
  periodo: z.enum(['mensal', 'trimestral', 'semestral', 'anual']),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().min(1, 'Data de fim é obrigatória'),
  equipe_id: z.string().uuid().optional(),
  usuario_id: z.string().uuid().optional(),
  funil_id: z.string().uuid().optional(),
}).refine(
  (data) => {
    if (data.tipo === 'equipe' && !data.equipe_id) return false
    if (data.tipo === 'individual' && !data.usuario_id) return false
    return true
  },
  { message: 'Meta de equipe requer equipe, meta individual requer membro' }
)

export type MetaFormValues = z.infer<typeof metaFormSchema>

// Mapeamento de métricas por categoria
export const METRICAS_POR_CATEGORIA = {
  receita: [
    { value: 'valor_vendas', label: 'Valor de Vendas', unidade: 'R$' },
    { value: 'mrr', label: 'MRR (Receita Recorrente)', unidade: 'R$' },
    { value: 'ticket_medio', label: 'Ticket Médio', unidade: 'R$' },
  ],
  quantidade: [
    { value: 'quantidade_vendas', label: 'Quantidade de Vendas', unidade: 'un' },
    { value: 'novos_negocios', label: 'Novos Negócios', unidade: 'un' },
    { value: 'taxa_conversao', label: 'Taxa de Conversão', unidade: '%' },
  ],
  atividades: [
    { value: 'reunioes', label: 'Reuniões', unidade: 'un' },
    { value: 'ligacoes', label: 'Ligações', unidade: 'un' },
    { value: 'emails', label: 'E-mails Enviados', unidade: 'un' },
    { value: 'tarefas', label: 'Tarefas Concluídas', unidade: 'un' },
  ],
  leads: [
    { value: 'novos_contatos', label: 'Novos Contatos', unidade: 'un' },
    { value: 'mqls', label: 'MQLs Gerados', unidade: 'un' },
    { value: 'sqls', label: 'SQLs Gerados', unidade: 'un' },
  ],
  tempo: [
    { value: 'tempo_fechamento', label: 'Tempo de Fechamento', unidade: 'dias', hint: 'Módulo Negócios — média de dias até fechar uma oportunidade como Ganha' },
    { value: 'velocidade_pipeline', label: 'Velocidade do Pipeline', unidade: 'dias', hint: 'Módulo Negócios — tempo médio que oportunidades levam para percorrer o funil' },
  ],
} as const

import { DollarSign, BarChart3, ClipboardList, UsersRound, Clock } from 'lucide-react'

export const CATEGORIAS = [
  { key: 'receita', label: 'Receita', icon: DollarSign },
  { key: 'quantidade', label: 'Quantidade', icon: BarChart3 },
  { key: 'atividades', label: 'Atividades', icon: ClipboardList },
  { key: 'leads', label: 'Leads', icon: UsersRound },
  { key: 'tempo', label: 'Tempo', icon: Clock },
] as const

export const PERIODOS = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
] as const

export function getMetricaLabel(metrica: string): string {
  for (const cat of Object.values(METRICAS_POR_CATEGORIA)) {
    const found = cat.find(m => m.value === metrica)
    if (found) return found.label
  }
  return metrica
}

export function getMetricaUnidade(metrica: string): string {
  for (const cat of Object.values(METRICAS_POR_CATEGORIA)) {
    const found = cat.find(m => m.value === metrica)
    if (found) return found.unidade
  }
  return ''
}
