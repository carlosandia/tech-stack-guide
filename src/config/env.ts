/**
 * AIDEV-NOTE: Configuracao centralizada de variaveis de ambiente
 * Todas variaveis sensíveis devem passar por aqui
 */

export const env = {
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,

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
