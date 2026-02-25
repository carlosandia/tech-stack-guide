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
 * Formata CNPJ brasileiro: XX.XXX.XXX/XXXX-XX
 */
export function formatCnpj(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 14)
  if (numbers.length === 0) return ''
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`
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

/**
 * Formata valor monetário: R$ 1.234,56
 * Aceita número ou string numérica
 * @param moeda - Código da moeda (BRL, USD, EUR). Default: BRL
 */
export function formatCurrency(value: string | number, moeda: string = 'BRL'): string {
  const localeMap: Record<string, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' }
  const locale = localeMap[moeda] || 'pt-BR'

  // Se for número, converte direto
  if (typeof value === 'number') {
    return value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  if (numbers.length === 0) return ''

  // Converte centavos para reais
  const cents = parseInt(numbers, 10)
  const reais = cents / 100

  return reais.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Remove formatação de moeda, retornando o valor numérico
 * "1.234,56" → 1234.56
 * "" → 0
 */
export function unformatCurrency(value: string): number {
  if (!value) return 0
  // Remove pontos de milhar, troca vírgula por ponto
  const clean = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}