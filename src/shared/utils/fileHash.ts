/**
 * AIDEV-NOTE: Utilitário para calcular SHA-256 de arquivos no client-side
 * Usado para deduplicação de documentos no upload
 */

/**
 * Calcula o hash SHA-256 de um File ou Blob usando Web Crypto API
 * @returns Hash em formato hexadecimal (lowercase)
 */
export async function calculateFileHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
