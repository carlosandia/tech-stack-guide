/**
 * AIDEV-NOTE: Utility para merge de estilos individuais por campo
 * Cada campo pode ter overrides em validacoes.estilo_campo
 * Esta função faz merge: global defaults + overrides do campo
 */

import type { EstiloCampos, CampoFormulario } from '../services/formularios.api'

/**
 * AIDEV-NOTE: Garante que valores numéricos tenham unidade px
 * Ex: "300" → "300px", "14px" → "14px", "" → fallback
 */
export function ensurePx(val: string | undefined, fallback: string): string {
  if (!val || val.trim() === '') return fallback
  const trimmed = val.trim()
  // Se já tem unidade (px, %, em, rem, vh, vw), retorna como está
  if (/[a-z%]/i.test(trimmed)) return trimmed
  // Número puro → adiciona px
  return `${trimmed}px`
}

/**
 * AIDEV-NOTE: Converte número puro para a unidade adequada conforme o tipo de propriedade CSS
 * - fontSize, height → rem (dividindo por 16) para melhor responsividade
 * - borderRadius, borderWidth → px (precisão)
 * Se já tem unidade, retorna como está.
 * Ex: ensureUnit("14", "fontSize") → "0.875rem"
 *     ensureUnit("40", "height") → "2.5rem"
 *     ensureUnit("6", "border") → "6px"
 *     ensureUnit("14px", "fontSize") → "14px"
 */
export type UnitContext = 'fontSize' | 'height' | 'border' | 'borderRadius'

export function ensureUnit(val: string | undefined, fallback: string, context: UnitContext = 'border'): string {
  if (!val || val.trim() === '') return fallback
  const trimmed = val.trim()
  // Se já tem unidade (px, %, em, rem, vh, vw), retorna como está
  if (/[a-z%]/i.test(trimmed)) return trimmed
  // Número puro → converte conforme contexto
  const num = parseFloat(trimmed)
  if (isNaN(num)) return fallback
  if (context === 'fontSize' || context === 'height') {
    return `${(num / 16).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}rem`
  }
  return `${num}px`
}

export function mergeCampoEstilo(global: EstiloCampos, campo: CampoFormulario): EstiloCampos {
  const validacoes = (campo.validacoes || {}) as Record<string, unknown>
  const individual = (validacoes.estilo_campo || {}) as Partial<EstiloCampos>
  
  if (!individual || Object.keys(individual).length === 0) return global
  
  const merged = { ...global }
  for (const [key, val] of Object.entries(individual)) {
    if (val !== undefined && val !== null && val !== '') {
      (merged as any)[key] = val
    }
  }
  return merged
}

/**
 * AIDEV-NOTE: Extrai padding individual do campo (validacoes.spacing_*)
 */
export function getCampoSpacing(campo: CampoFormulario): string {
  const v = (campo.validacoes || {}) as Record<string, unknown>
  return `${v.spacing_top || '0'}px ${v.spacing_right || '0'}px ${v.spacing_bottom || '0'}px ${v.spacing_left || '0'}px`
}
