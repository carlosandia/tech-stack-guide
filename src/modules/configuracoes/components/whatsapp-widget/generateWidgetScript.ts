/**
 * AIDEV-NOTE: Gerador de script embed LEVE para Widget WhatsApp
 * Gera apenas um loader (~200 bytes) que carrega o JS cacheável da edge function.
 * O script só precisa ser colado UMA VEZ — qualquer alteração nas
 * configurações reflete automaticamente no site sem trocar o script.
 */

// AIDEV-NOTE: Centralizado via env vars (Auditoria M1)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export function generateWidgetScript(organizacaoId: string): string {
  return `<!-- Widget WhatsApp - CRM Renove -->
<script data-org="${organizacaoId}" src="${SUPABASE_URL}/functions/v1/widget-whatsapp-loader" async></script>`
}
