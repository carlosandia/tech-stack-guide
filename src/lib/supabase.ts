 import { createClient } from '@supabase/supabase-js'
 import type { Database } from '@/integrations/supabase/types'

/**
  * AIDEV-NOTE: Cliente Supabase singleton com timeout
  * Evita loading infinito em caso de rede instável
  * RLS é obrigatório em todas tabelas - nunca bypass
 */
 
 const SUPABASE_URL = "https://ybzhlsalbnxwkfszkloa.supabase.co"
 const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M"
 
 // Timeout em ms para requisições (30s para ambiente de preview)
 const FETCH_TIMEOUT = 30000
 
 /**
  * Fetch customizado com AbortController para timeout
  * Evita que requests fiquem "pendurados" indefinidamente
  */
 const fetchWithTimeout: typeof fetch = async (url, options) => {
   const controller = new AbortController()
   const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
   
   try {
     const response = await fetch(url, {
       ...options,
       signal: controller.signal,
     })
     return response
   } catch (error) {
     if ((error as Error).name === 'AbortError') {
       console.warn('[Supabase] Request timeout após', FETCH_TIMEOUT, 'ms:', url)
       throw new Error('Tempo limite excedido. Verifique sua conexão.')
     }
     throw error
   } finally {
     clearTimeout(timeoutId)
   }
 }
 
 export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
   auth: {
     storage: localStorage,
     persistSession: true,
     autoRefreshToken: true,
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
