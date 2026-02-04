import 'dotenv/config'

/**
 * AIDEV-NOTE: Configuracao centralizada de variaveis de ambiente do backend
 * Todas variaveis sensíveis passam por aqui com validacao
 */

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_URL: process.env.API_URL || 'http://localhost:3001',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8080',

  // Rate Limit
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // PRD-08: WAHA (WhatsApp)
  WAHA_URL: process.env.WAHA_URL || '',
  WAHA_API_KEY: process.env.WAHA_API_KEY || '',

  // PRD-08: Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || '',

  // PRD-08: Meta (Facebook/Instagram)
  META_APP_ID: process.env.META_APP_ID || '',
  META_APP_SECRET: process.env.META_APP_SECRET || '',
  META_REDIRECT_URI: process.env.META_REDIRECT_URI || '',
  META_WEBHOOK_VERIFY_TOKEN: process.env.META_WEBHOOK_VERIFY_TOKEN || 'crm_renove_webhook',

  // PRD-08: Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || '',
} as const

// Validacao de variaveis obrigatorias
export function validateEnv() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ] as const

  const missing: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Variaveis de ambiente obrigatorias nao definidas: ${missing.join(', ')}`
    )
  }
}
