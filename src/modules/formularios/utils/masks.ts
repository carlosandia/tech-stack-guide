/**
 * AIDEV-NOTE: Funções de máscara puras para campos de formulário
 * Sem dependência de lib externa - conforme PRD-17
 */

export function maskCPF(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

export function maskCNPJ(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 14)
  if (n.length <= 2) return n
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`
}

export function maskCEP(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 8)
  if (n.length <= 5) return n
  return `${n.slice(0, 5)}-${n.slice(5)}`
}

export function maskTelefoneBR(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 11)
  if (n.length === 0) return ''
  if (n.length <= 2) return `(${n}`
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

export function maskTelefoneInternacional(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 15)
  if (n.length === 0) return ''
  if (n.length <= 2) return `+${n}`
  if (n.length <= 7) return `+${n.slice(0, 2)} ${n.slice(2)}`
  return `+${n.slice(0, 2)} ${n.slice(2, 7)}-${n.slice(7)}`
}

export function maskMoeda(value: string): string {
  const n = value.replace(/\D/g, '')
  if (n.length === 0) return ''
  const cents = parseInt(n, 10)
  const reais = cents / 100
  return `R$ ${reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Retorna a função de máscara para um tipo de campo, ou null se não precisa */
export function getMaskForType(tipo: string): ((v: string) => string) | null {
  switch (tipo) {
    case 'cpf': return maskCPF
    case 'cnpj': return maskCNPJ
    case 'cep': return maskCEP
    case 'telefone_br': return maskTelefoneBR
    case 'telefone': return maskTelefoneInternacional
    case 'moeda': return maskMoeda
    default: return null
  }
}
