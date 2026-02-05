 /**
  * AIDEV-NOTE: Funções de formatação para máscaras de input
  * Usado em formulários que precisam de formatação brasileira
  */
 
 /**
  * Formata telefone brasileiro: (99) 99999-9999 ou (99) 9999-9999
  */
 export function formatTelefone(value: string): string {
   const numbers = value.replace(/\D/g, '').slice(0, 11)
   if (numbers.length === 0) return ''
   if (numbers.length <= 2) return `(${numbers}`
   if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
   if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
   return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
 }
 
 /**
  * Formata CEP brasileiro: 00000-000
  */
 export function formatCep(value: string): string {
   const numbers = value.replace(/\D/g, '').slice(0, 8)
   if (numbers.length === 0) return ''
   if (numbers.length <= 5) return numbers
   return `${numbers.slice(0, 5)}-${numbers.slice(5)}`
 }
 
 /**
  * Remove formatação do telefone, retornando apenas números
  */
 export function unformatTelefone(value: string): string {
   return value.replace(/\D/g, '')
 }
 
/**
 * Remove formatação do CEP, retornando apenas números
 */
export function unformatCep(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Normaliza texto removendo acentos e padronizando capitalização
 * Usado para evitar duplicatas em segmentos customizados
 * Ex: "marketing DIGITAL" -> "Marketing Digital"
 * Ex: "consultória" -> "Consultoria"
 */
export function normalizeSegmento(value: string): string {
  if (!value) return ''
  // Remove acentos usando normalização NFD
  const semAcento = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // Capitaliza cada palavra
  return semAcento
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}