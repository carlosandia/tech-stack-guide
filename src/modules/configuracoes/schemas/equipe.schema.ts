/**
 * AIDEV-NOTE: Schemas Zod frontend para Gestão de Equipe
 * Conforme PRD-05 - Gestão de Equipe (Admin Only)
 */

import { z } from 'zod'

// =====================================================
// Equipe
// =====================================================

export const criarEquipeSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().optional(),
  lider_id: z.string().uuid().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor hexadecimal inválida').optional(),
})

export type CriarEquipeForm = z.infer<typeof criarEquipeSchema>

export const atualizarEquipeSchema = criarEquipeSchema.partial()

// =====================================================
// Membro
// =====================================================

export const adicionarMembroSchema = z.object({
  usuario_id: z.string().uuid('Selecione um usuário'),
  papel: z.enum(['lider', 'membro']).optional().default('membro'),
})

export type AdicionarMembroForm = z.infer<typeof adicionarMembroSchema>

// =====================================================
// Convite de Usuário
// =====================================================

export const convidarUsuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  sobrenome: z.string().max(100).optional(),
  email: z.string().email('E-mail inválido'),
  papel_id: z.string().uuid('Selecione um perfil').optional(),
  equipe_ids: z.array(z.string().uuid()).optional(),
})

export type ConvidarUsuarioForm = z.infer<typeof convidarUsuarioSchema>

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  sobrenome: z.string().max(100).nullable().optional(),
  telefone: z.string().nullable().optional(),
  papel_id: z.string().uuid().nullable().optional(),
  equipe_ids: z.array(z.string().uuid()).optional(),
})

export type AtualizarUsuarioForm = z.infer<typeof atualizarUsuarioSchema>

// =====================================================
// Perfil de Permissão
// =====================================================

export const modulosDisponiveis = [
  { value: 'negocios', label: 'Negócios' },
  { value: 'contatos', label: 'Contatos' },
  { value: 'conversas', label: 'Conversas' },
  { value: 'tarefas', label: 'Tarefas' },
  { value: 'metas', label: 'Metas' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'configuracoes', label: 'Configurações' },
] as const

export const acoesDisponiveis = ['visualizar', 'criar', 'editar', 'excluir', 'gerenciar'] as const

// AIDEV-NOTE: Seg — modulo usa string pois UI já restringe via modulosDisponiveis; whitelist aplicada no API service (criarPerfil/atualizarPerfil)
export const permissaoSchema = z.object({
  modulo: z.string().min(1),
  acoes: z.array(z.enum(['visualizar', 'criar', 'editar', 'excluir', 'gerenciar'])).min(1, 'Selecione ao menos uma ação'),
})

export const criarPerfilSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().optional(),
  permissoes: z.array(permissaoSchema).min(1, 'Adicione ao menos uma permissão'),
  is_admin: z.boolean().optional().default(false),
})

export type CriarPerfilForm = z.infer<typeof criarPerfilSchema>

export const atualizarPerfilSchema = criarPerfilSchema.partial()

// =====================================================
// Cores de Equipe
// =====================================================

export const coresEquipe = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#6366F1', '#A855F7', '#14B8A6', '#64748B',
] as const

// =====================================================
// Status de Usuário
// =====================================================

export const statusUsuarioOptions = [
  { value: 'ativo', label: 'Ativo', color: '#22C55E' },
  { value: 'inativo', label: 'Inativo', color: '#64748B' },
  { value: 'pendente', label: 'Pendente', color: '#F97316' },
  { value: 'suspenso', label: 'Suspenso', color: '#EF4444' },
] as const

export const papelMembroOptions = [
  { value: 'lider', label: 'Líder' },
  { value: 'membro', label: 'Membro' },
] as const
