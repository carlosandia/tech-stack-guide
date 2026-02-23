/**
 * AIDEV-NOTE: Configuracao centralizada de variaveis de ambiente
 * Todas variaveis sensíveis devem passar por aqui
 */

export const env = {
  // Supabase (com fallback para evitar URLs undefined)
  SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL as string) || 'https://ybzhlsalbnxwkfszkloa.supabase.co',
  SUPABASE_ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M',

  // API
  API_URL: import.meta.env.VITE_API_URL as string || 'http://localhost:3001',

  // Environment
  NODE_ENV: import.meta.env.MODE,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const

// Validacao de variaveis obrigatorias
export function validateEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Variavel de ambiente VITE_${key} nao definida`)
    }
  }
}
