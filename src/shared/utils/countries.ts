/**
 * AIDEV-NOTE: Lista centralizada de países com DDI, bandeira e máscara.
 * Usada por PhoneInputField e CellTelefone para evitar duplicação.
 */

export interface Country {
  code: string
  name: string
  ddi: string
  flag: string
  mask: string
  maxDigits: number
}

export const COUNTRIES: Country[] = [
  { code: 'BR', name: 'Brasil', ddi: '+55', flag: '🇧🇷', mask: '(##) #####-####', maxDigits: 11 },
  { code: 'US', name: 'Estados Unidos', ddi: '+1', flag: '🇺🇸', mask: '(###) ###-####', maxDigits: 10 },
  { code: 'PT', name: 'Portugal', ddi: '+351', flag: '🇵🇹', mask: '### ### ###', maxDigits: 9 },
  { code: 'AR', name: 'Argentina', ddi: '+54', flag: '🇦🇷', mask: '## ####-####', maxDigits: 10 },
  { code: 'CL', name: 'Chile', ddi: '+56', flag: '🇨🇱', mask: '# ####-####', maxDigits: 9 },
  { code: 'CO', name: 'Colômbia', ddi: '+57', flag: '🇨🇴', mask: '### ###-####', maxDigits: 10 },
  { code: 'MX', name: 'México', ddi: '+52', flag: '🇲🇽', mask: '## ####-####', maxDigits: 10 },
  { code: 'UY', name: 'Uruguai', ddi: '+598', flag: '🇺🇾', mask: '## ###-###', maxDigits: 8 },
  { code: 'PY', name: 'Paraguai', ddi: '+595', flag: '🇵🇾', mask: '### ###-###', maxDigits: 9 },
  { code: 'DE', name: 'Alemanha', ddi: '+49', flag: '🇩🇪', mask: '#### #######', maxDigits: 11 },
  { code: 'GB', name: 'Reino Unido', ddi: '+44', flag: '🇬🇧', mask: '#### ######', maxDigits: 10 },
  { code: 'FR', name: 'França', ddi: '+33', flag: '🇫🇷', mask: '# ## ## ## ##', maxDigits: 9 },
  { code: 'ES', name: 'Espanha', ddi: '+34', flag: '🇪🇸', mask: '### ## ## ##', maxDigits: 9 },
  { code: 'IT', name: 'Itália', ddi: '+39', flag: '🇮🇹', mask: '### ### ####', maxDigits: 10 },
]

// DDIs ordenados por tamanho decrescente para evitar falsos positivos
const COUNTRIES_BY_DDI_LENGTH = [...COUNTRIES].sort(
  (a, b) => b.ddi.length - a.ddi.length
)

/**
 * Detecta o país de um telefone pelo DDI.
 * Aceita formatos: "+5527999...", "5527999...", "(27) 99809-5977"
 * Se não encontrar DDI mas tiver 10-11 dígitos, assume Brasil.
 */
export function detectCountryByPhone(phone: string | null | undefined): Country | null {
  if (!phone) return null

  // Se começa com +, tenta match direto pelo DDI
  if (phone.startsWith('+')) {
    for (const c of COUNTRIES_BY_DDI_LENGTH) {
      if (phone.startsWith(c.ddi)) return c
    }
  }

  // Remove não-dígitos e tenta match pelos dígitos do DDI
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  for (const c of COUNTRIES_BY_DDI_LENGTH) {
    const ddiDigits = c.ddi.replace(/\D/g, '')
    if (digits.startsWith(ddiDigits)) return c
  }

  // Fallback: 10-11 dígitos sem DDI reconhecido → provavelmente Brasil
  if (digits.length >= 10 && digits.length <= 11) {
    return COUNTRIES[0] // Brasil
  }

  return null
}
