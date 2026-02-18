/**
 * AIDEV-NOTE: Auth context compartilhado — fonte única de verdade para
 * organizacao_id, usuario_id e role (Plano de Escala 2.3)
 * Substitui cópias duplicadas em negocios.api, detalhes.api, pre-oportunidades.api
 */

import { supabase } from '@/lib/supabase'

let _cachedOrgId: string | null = null
let _cachedUserId: string | null = null
let _cachedUserRole: string | null = null

export async function getOrganizacaoId(): Promise<string> {
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

export async function getUsuarioId(): Promise<string> {
  if (_cachedUserId) return _cachedUserId
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!data?.id) throw new Error('Usuário não encontrado')
  _cachedUserId = data.id
  return _cachedUserId
}

export async function getUserRole(): Promise<string> {
  if (_cachedUserRole) return _cachedUserRole
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')
  const { data } = await supabase
    .from('usuarios')
    .select('role')
    .eq('auth_id', user.id)
    .maybeSingle()
  _cachedUserRole = data?.role || 'member'
  return _cachedUserRole
}

// Limpar cache ao trocar de sessão
supabase.auth.onAuthStateChange(() => {
  _cachedOrgId = null
  _cachedUserId = null
  _cachedUserRole = null
})
