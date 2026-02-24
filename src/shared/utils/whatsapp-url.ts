/**
 * AIDEV-NOTE: URLs do WhatsApp CDN (pps.whatsapp.net) expiram via parâmetro `oe` (hex Unix ts)
 * Retorna null se a URL está expirada para evitar requisição 404 no browser.
 * Apenas URLs de pps.whatsapp.net são inspecionadas; outras URLs passam inalteradas.
 *
 * Exemplo: oe=69A06C8B → parseInt('69A06C8B', 16) = 1772081291 → timestamp em segundos
 */
export function getValidWhatsAppUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (!url.includes('pps.whatsapp.net')) return url

  const match = url.match(/[?&]oe=([a-f0-9]+)/i)
  if (!match) return url // URL sem oe: assumir válida

  const expiryMs = parseInt(match[1], 16) * 1000
  return Date.now() > expiryMs ? null : url
}
