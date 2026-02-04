import { supabase as supabaseClient } from '@/integrations/supabase/client'

/**
 * AIDEV-NOTE: Cliente Supabase singleton
 * Reutiliza o client gerado em src/integrations/supabase/client.ts (URL/KEY já configurados)
 * Toda autenticacao e operacoes de banco passam por este cliente
 * RLS e obrigatorio em todas tabelas - nunca bypass
 */
export const supabase = supabaseClient

// Tipos de role do sistema
export type UserRole = 'super_admin' | 'admin' | 'member'

// Interface de metadados do usuario
export interface UserMetadata {
  tenant_id?: string
  role?: UserRole
  nome?: string
  sobrenome?: string
}
