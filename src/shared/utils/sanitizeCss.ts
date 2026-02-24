/**
 * AIDEV-NOTE: Sanitizador de CSS para prevenir injeção via <style> tags
 * Remove padrões perigosos: javascript:, expression(), @import de data URIs, etc.
 * Usado em FormPreview e FormularioPublicoPage antes de injetar CSS em dangerouslySetInnerHTML
 */

// Padrões CSS perigosos que permitem execução de código
const DANGEROUS_CSS_PATTERNS = [
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /behavior\s*:/gi,
  /-moz-binding\s*:/gi,
  /@import\s+url\s*\(\s*['"]?\s*data:/gi,
  /<\s*script/gi,
]

/**
 * Sanitiza CSS removendo padrões que permitem execução de scripts.
 * Retorna string vazia se input for inválido.
 */
export function sanitizeCss(css: string | null | undefined): string {
  if (!css || typeof css !== 'string') return ''
  let sanitized = css
  for (const pattern of DANGEROUS_CSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '/* REMOVED */')
  }
  return sanitized
}
