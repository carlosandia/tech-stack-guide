import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

/**
 * AIDEV-NOTE: Cliente Supabase singleton
 * Toda autenticacao e operacoes de banco passam por este cliente
 * RLS e obrigatorio em todas tabelas - nunca bypass
 */
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// Tipos de role do sistema
export type UserRole = 'super_admin' | 'admin' | 'member'

// Interface de metadados do usuario
export interface UserMetadata {
  tenant_id?: string
  role?: UserRole
  nome?: string
  sobrenome?: string
}
