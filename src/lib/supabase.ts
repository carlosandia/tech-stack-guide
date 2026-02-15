 import { createClient } from '@supabase/supabase-js'
 import type { Database } from '@/integrations/supabase/types'

/**
  * AIDEV-NOTE: Cliente Supabase singleton com timeout
  * Evita loading infinito em caso de rede instável
  * RLS é obrigatório em todas tabelas - nunca bypass
 */
 
 const SUPABASE_URL = "https://ybzhlsalbnxwkfszkloa.supabase.co"
 const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M"
 
 // Timeout em ms para requisições
 const FETCH_TIMEOUT = 30000
 // Timeout maior para edge functions que podem demorar (envio de email com anexos etc.)
 const EDGE_FUNCTION_TIMEOUT = 150000

 /**
  * Fetch customizado com AbortController para timeout
  * Evita que requests fiquem "pendurados" indefinidamente
  */
 const fetchWithTimeout: typeof fetch = async (url, options) => {
   const isEdgeFunction = typeof url === 'string' && url.includes('/functions/v1/')
   const timeout = isEdgeFunction ? EDGE_FUNCTION_TIMEOUT : FETCH_TIMEOUT
   const controller = new AbortController()
   const timeoutId = setTimeout(() => controller.abort(), timeout)
   
   try {
     const response = await fetch(url, {
       ...options,
       signal: controller.signal,
     })
     return response
   } catch (error) {
     if ((error as Error).name === 'AbortError') {
       console.warn('[Supabase] Request timeout após', timeout, 'ms:', url)
       throw new Error('Tempo limite excedido. Verifique sua conexão.')
     }
     throw error
   } finally {
     clearTimeout(timeoutId)
   }
 }
 
 /**
  * AIDEV-NOTE: detectSessionInUrl DESABILITADO na pagina /auth/set-password
  * Quando o Supabase detecta #access_token=... no hash, ele auto-processa e
  * substitui a sessao atual (ex: superadmin) pela sessao do token (ex: convidado).
  * Isso acontece ANTES de qualquer useEffect rodar, impedindo a detecção de conflito.
  * Desabilitando nessa pagina, o SetPasswordPage processa manualmente com segurança.
  */
 const isSetPasswordPage = typeof window !== 'undefined' && window.location.pathname === '/auth/set-password'
 
 export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
   auth: {
     storage: localStorage,
     persistSession: true,
     autoRefreshToken: true,
     detectSessionInUrl: !isSetPasswordPage,
   },
   global: {
     fetch: fetchWithTimeout,
   },
 })

// Tipos de role do sistema
export type UserRole = 'super_admin' | 'admin' | 'member'

// Interface de metadados do usuario
export interface UserMetadata {
  tenant_id?: string
  role?: UserRole
  nome?: string
  sobrenome?: string
}
