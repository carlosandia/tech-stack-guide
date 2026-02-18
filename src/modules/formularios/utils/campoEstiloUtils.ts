/**
 * AIDEV-NOTE: Utility para merge de estilos individuais por campo
 * Cada campo pode ter overrides em validacoes.estilo_campo
 * Esta função faz merge: global defaults + overrides do campo
 */

import type { EstiloCampos, CampoFormulario } from '../services/formularios.api'

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
