import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

/**
 * AIDEV-NOTE: Clientes Supabase do backend
 * - supabaseAdmin: Service Role (bypass RLS) - usar com cuidado
 * - supabaseClient: Anon Key (respeita RLS) - padrao para operacoes
 */

// Cliente com Service Role - bypass RLS
// Usar APENAS para operacoes administrativas do Super Admin
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Cliente padrao - respeita RLS
export const supabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

// Helper para criar cliente com token do usuario
export function createUserClient(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
