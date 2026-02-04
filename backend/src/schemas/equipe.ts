/**
 * AIDEV-NOTE: Schemas Zod para Gestao de Equipes
 * Conforme PRD-05 - Gestao de Equipe (Admin Only)
 */

import { z } from 'zod'

// =====================================================
// Schema da Equipe
// =====================================================

export const EquipeSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(100),
  descricao: z.string().nullable().optional(),
  lider_id: z.string().uuid().nullable().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  ativa: z.boolean().default(true),
  criado_em: z.string().datetime(),
  criado_por: z.string().uuid().nullable().optional(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type Equipe = z.infer<typeof EquipeSchema>

// =====================================================
// Schemas de Request - Equipe
// =====================================================

export const CriarEquipeSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(100),
  descricao: z.string().optional(),
  lider_id: z.string().uuid().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal valida').optional(),
})

export type CriarEquipePayload = z.infer<typeof CriarEquipeSchema>

export const AtualizarEquipeSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().nullable().optional(),
  lider_id: z.string().uuid().nullable().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  ativa: z.boolean().optional(),
})

export type AtualizarEquipePayload = z.infer<typeof AtualizarEquipeSchema>

// =====================================================
// Schema de Membro da Equipe
// =====================================================

export const EquipeMembroSchema = z.object({
  id: z.string().uuid(),
  equipe_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  papel: z.enum(['lider', 'membro']).default('membro'),
  adicionado_em: z.string().datetime(),
  adicionado_por: z.string().uuid().nullable().optional(),
})

export type EquipeMembro = z.infer<typeof EquipeMembroSchema>

// =====================================================
// Schemas de Request - Membros da Equipe
// =====================================================

export const AdicionarMembroSchema = z.object({
  usuario_id: z.string().uuid('ID do usuario invalido'),
  papel: z.enum(['lider', 'membro']).optional().default('membro'),
})

export type AdicionarMembroPayload = z.infer<typeof AdicionarMembroSchema>

export const AtualizarMembroPapelSchema = z.object({
  papel: z.enum(['lider', 'membro']),
})

export type AtualizarMembroPapelPayload = z.infer<typeof AtualizarMembroPapelSchema>

// =====================================================
// Equipe com Membros (Response)
// =====================================================

export const MembroResumoSchema = z.object({
  id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  nome: z.string(),
  sobrenome: z.string().nullable().optional(),
  email: z.string().email(),
  avatar_url: z.string().nullable().optional(),
  papel: z.enum(['lider', 'membro']),
  adicionado_em: z.string().datetime(),
})

export type MembroResumo = z.infer<typeof MembroResumoSchema>

export const EquipeComMembrosSchema = EquipeSchema.extend({
  membros: z.array(MembroResumoSchema),
  total_membros: z.number(),
  lider: MembroResumoSchema.nullable().optional(),
})

export type EquipeComMembros = z.infer<typeof EquipeComMembrosSchema>

// =====================================================
// Response Types
// =====================================================

export const ListaEquipesResponseSchema = z.object({
  equipes: z.array(EquipeComMembrosSchema),
  total: z.number(),
})

export type ListaEquipesResponse = z.infer<typeof ListaEquipesResponseSchema>

// =====================================================
// Gestao de Usuarios (Membros do Tenant)
// =====================================================

export const StatusUsuarioEnum = z.enum(['ativo', 'inativo', 'pendente', 'suspenso'])
export type StatusUsuario = z.infer<typeof StatusUsuarioEnum>

export const UsuarioTenantSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  auth_user_id: z.string().uuid().nullable().optional(),
  nome: z.string(),
  sobrenome: z.string().nullable().optional(),
  email: z.string().email(),
  telefone: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  papel_id: z.string().uuid().nullable().optional(),
  papel_nome: z.string().nullable().optional(),
  status: StatusUsuarioEnum,
  ultimo_acesso: z.string().datetime().nullable().optional(),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
})

export type UsuarioTenant = z.infer<typeof UsuarioTenantSchema>

// =====================================================
// Schemas de Request - Usuarios
// =====================================================

export const ConvidarUsuarioSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(100),
  sobrenome: z.string().max(100).optional(),
  email: z.string().email('Email invalido'),
  papel_id: z.string().uuid('Selecione um perfil de permissao').optional(),
  equipe_ids: z.array(z.string().uuid()).optional(),
})

export type ConvidarUsuarioPayload = z.infer<typeof ConvidarUsuarioSchema>

export const AtualizarUsuarioSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  sobrenome: z.string().max(100).nullable().optional(),
  telefone: z.string().nullable().optional(),
  papel_id: z.string().uuid().nullable().optional(),
  equipe_ids: z.array(z.string().uuid()).optional(),
})

export type AtualizarUsuarioPayload = z.infer<typeof AtualizarUsuarioSchema>

export const AlterarStatusUsuarioSchema = z.object({
  status: z.enum(['ativo', 'inativo', 'suspenso']),
  motivo: z.string().max(500).optional(),
})

export type AlterarStatusUsuarioPayload = z.infer<typeof AlterarStatusUsuarioSchema>

// =====================================================
// Perfis de Permissao
// =====================================================

export const PermissaoSchema = z.object({
  modulo: z.string(),
  acoes: z.array(z.enum(['visualizar', 'criar', 'editar', 'excluir', 'gerenciar'])),
})

export type Permissao = z.infer<typeof PermissaoSchema>

export const PerfilPermissaoSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1).max(100),
  descricao: z.string().nullable().optional(),
  permissoes: z.array(PermissaoSchema),
  is_admin: z.boolean().default(false),
  is_sistema: z.boolean().default(false),
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
  deletado_em: z.string().datetime().nullable().optional(),
})

export type PerfilPermissao = z.infer<typeof PerfilPermissaoSchema>

// =====================================================
// Schemas de Request - Perfis
// =====================================================

export const CriarPerfilSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio').max(100),
  descricao: z.string().optional(),
  permissoes: z.array(PermissaoSchema).min(1, 'Selecione pelo menos uma permissao'),
  is_admin: z.boolean().optional().default(false),
})

export type CriarPerfilPayload = z.infer<typeof CriarPerfilSchema>

export const AtualizarPerfilSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().nullable().optional(),
  permissoes: z.array(PermissaoSchema).optional(),
  is_admin: z.boolean().optional(),
})

export type AtualizarPerfilPayload = z.infer<typeof AtualizarPerfilSchema>

// =====================================================
// Response Types - Usuarios e Perfis
// =====================================================

export const ListaUsuariosResponseSchema = z.object({
  usuarios: z.array(UsuarioTenantSchema),
  total: z.number(),
  page: z.number(),
  total_paginas: z.number(),
})

export type ListaUsuariosResponse = z.infer<typeof ListaUsuariosResponseSchema>

export const ListaPerfisResponseSchema = z.object({
  perfis: z.array(PerfilPermissaoSchema),
  total: z.number(),
})

export type ListaPerfisResponse = z.infer<typeof ListaPerfisResponseSchema>

// =====================================================
// Query Params
// =====================================================

export const ListarUsuariosQuerySchema = z.object({
  busca: z.string().optional(),
  status: z.string().optional(),
  equipe_id: z.string().uuid().optional(),
  papel_id: z.string().uuid().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

export type ListarUsuariosQuery = z.infer<typeof ListarUsuariosQuerySchema>

export const ListarEquipesQuerySchema = z.object({
  busca: z.string().optional(),
  ativa: z.enum(['true', 'false']).optional(),
})

export type ListarEquipesQuery = z.infer<typeof ListarEquipesQuerySchema>
