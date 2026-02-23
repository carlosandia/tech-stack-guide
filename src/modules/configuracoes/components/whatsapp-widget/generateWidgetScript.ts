/**
 * AIDEV-NOTE: Gerador de script embed LEVE para Widget WhatsApp
 * Gera apenas um loader (~200 bytes) que carrega o JS cacheável da edge function.
 * O script só precisa ser colado UMA VEZ — qualquer alteração nas
 * configurações reflete automaticamente no site sem trocar o script.
 */

// AIDEV-NOTE: Centralizado via env.SUPABASE_URL com fallback (Auditoria M1)
import { env } from '@/config/env'

export function generateWidgetScript(organizacaoId: string): string {
  return `<!-- Widget WhatsApp - CRM Renove -->
<script data-org="${organizacaoId}" src="${env.SUPABASE_URL}/functions/v1/widget-whatsapp-loader" async></script>`
}
