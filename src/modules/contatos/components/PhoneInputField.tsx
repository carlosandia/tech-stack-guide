/**
 * AIDEV-NOTE: Campo de telefone com seletor de bandeira/DDI
 * Padrão Brasil (+55), usuário digita apenas DDD + número
 * Máscara automática: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */

import { useState, useRef, useEffect, forwardRef, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'

interface Country {
  code: string
  name: string
  ddi: string
  flag: string
  mask: string
  maxDigits: number
}

const COUNTRIES: Country[] = [
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

function formatWithMask(digits: string, mask: string): string {
  let result = ''
  let digitIndex = 0
  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === '#') {
      result += digits[digitIndex]
      digitIndex++
    } else {
      result += mask[i]
    }
  }
  return result
}

function extractDigits(value: string): string {
  return value.replace(/\D/g, '')
}

// Parse stored value like "+55 11999990000" into country + digits
function parseStoredValue(value: string): { country: Country; digits: string } {
  if (!value) return { country: COUNTRIES[0], digits: '' }

  // Try to match DDI
  for (const c of COUNTRIES) {
    if (value.startsWith(c.ddi)) {
      const rest = extractDigits(value.slice(c.ddi.length))
      return { country: c, digits: rest }
    }
  }

  // Fallback: treat as BR
  const digits = extractDigits(value)
  return { country: COUNTRIES[0], digits }
}

interface PhoneInputFieldProps {
  label: string
  value?: string
  onChange?: (fullValue: string) => void
  error?: string
  name?: string
}

export const PhoneInputField = forwardRef<HTMLInputElement, PhoneInputFieldProps>(
  ({ label, value = '', onChange, error, name }, _ref) => {
    const parsed = parseStoredValue(value)
    const [country, setCountry] = useState<Country>(parsed.country)
    const [digits, setDigits] = useState(parsed.digits)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [search, setSearch] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Sync from external value changes (e.g., form reset)
    useEffect(() => {
      const p = parseStoredValue(value)
      setCountry(p.country)
      setDigits(p.digits)
    }, [value])

    // Close dropdown on outside click
    useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setDropdownOpen(false)
          setSearch('')
        }
      }
      if (dropdownOpen) document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }, [dropdownOpen])

    const emitChange = useCallback((c: Country, d: string) => {
      if (!d) {
        onChange?.('')
      } else {
        onChange?.(`${c.ddi}${d}`)
      }
    }, [onChange])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = extractDigits(e.target.value).slice(0, country.maxDigits)
      setDigits(raw)
      emitChange(country, raw)
    }

    const handleCountrySelect = (c: Country) => {
      setCountry(c)
      setDropdownOpen(false)
      setSearch('')
      // Re-truncate digits if new country has fewer max digits
      const truncated = digits.slice(0, c.maxDigits)
      setDigits(truncated)
      emitChange(c, truncated)
      inputRef.current?.focus()
    }

    const displayValue = digits ? formatWithMask(digits, country.mask) : ''

    const filteredCountries = search
      ? COUNTRIES.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.ddi.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
        )
      : COUNTRIES

    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
        <div className="flex">
          {/* Country selector */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 h-full px-2.5 rounded-l-md border border-r-0 border-input bg-muted/50 hover:bg-accent transition-colors text-sm min-w-[80px]"
            >
              <span className="text-base leading-none">{country.flag}</span>
              <span className="text-xs text-muted-foreground">{country.ddi}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-background rounded-md shadow-lg border border-border py-1 z-[600] max-h-[240px] overflow-y-auto">
                <div className="px-2 pb-1 pt-1">
                  <input
                    type="text"
                    placeholder="Buscar país..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                </div>
                {filteredCountries.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors ${
                      c.code === country.code ? 'bg-primary/5 text-primary' : 'text-foreground'
                    }`}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1 text-left truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.ddi}</span>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum país encontrado</p>
                )}
              </div>
            )}
          </div>

          {/* Phone input */}
          <input
            ref={inputRef}
            name={name}
            type="tel"
            value={displayValue}
            onChange={handleInputChange}
            placeholder={country.mask.replace(/#/g, '0')}
            className="flex-1 rounded-r-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    )
  }
)
PhoneInputField.displayName = 'PhoneInputField'
