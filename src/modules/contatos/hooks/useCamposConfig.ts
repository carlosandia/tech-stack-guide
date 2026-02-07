/**
 * AIDEV-NOTE: Hook centralizado que mapeia a configuração global de campos
 * (de /configuracoes/campos) para o módulo de contatos.
 *
 * Fornece: getLabel, getPlaceholder, isRequired, getColumnLabel
 * com fallbacks para quando a API ainda não carregou.
 *
 * Mapeamento: campo.slug → field key do módulo contatos
 * Ex: slug "linkedin" → fieldKey "linkedin_url"
 *     slug "segmento_de_mercado" → fieldKey "segmento"
 */

import { useMemo, useCallback } from 'react'
import { useCampos } from '@/modules/configuracoes/hooks/useCampos'
import type { CampoCustomizado } from '@/modules/configuracoes/services/configuracoes.api'
import type { TipoContato } from '../services/contatos.api'

// =====================================================
// Mapeamentos slug ↔ field key
// =====================================================

/** Slugs que diferem do field key no contato */
const SLUG_TO_FIELD_KEY: Record<string, string> = {
  linkedin: 'linkedin_url',
  segmento_de_mercado: 'segmento',
}

/** Field keys com múltiplos slugs possíveis */
const FIELD_KEY_TO_SLUGS: Record<string, string[]> = {
  linkedin_url: ['linkedin', 'linkedin_url'],
  segmento: ['segmento', 'segmento_de_mercado'],
}

/** Column keys (ContatoColumnsToggle) com múltiplos slugs possíveis */
const COLUMN_KEY_TO_SLUGS: Record<string, string[]> = {
  linkedin: ['linkedin', 'linkedin_url'],
  segmento_mercado: ['segmento', 'segmento_de_mercado'],
  nome_empresa: ['nome_fantasia'],
}

// =====================================================
// Fallbacks (usados quando API não carregou)
// =====================================================

const FALLBACK_PESSOA: Record<string, { label: string; obrigatorio: boolean }> = {
  nome: { label: 'Nome', obrigatorio: true },
  sobrenome: { label: 'Sobrenome', obrigatorio: false },
  email: { label: 'Email', obrigatorio: false },
  telefone: { label: 'Telefone', obrigatorio: false },
  cargo: { label: 'Cargo', obrigatorio: false },
  linkedin_url: { label: 'LinkedIn', obrigatorio: false },
}

const FALLBACK_EMPRESA: Record<string, { label: string; obrigatorio: boolean }> = {
  nome_fantasia: { label: 'Nome Fantasia', obrigatorio: true },
  razao_social: { label: 'Razão Social', obrigatorio: false },
  cnpj: { label: 'CNPJ', obrigatorio: false },
  email: { label: 'Email', obrigatorio: false },
  telefone: { label: 'Telefone', obrigatorio: false },
  website: { label: 'Website', obrigatorio: false },
  segmento: { label: 'Segmento de Mercado', obrigatorio: false },
  porte: { label: 'Porte', obrigatorio: false },
}

// =====================================================
// Types
// =====================================================

export interface CampoConfig {
  key: string
  slug: string
  label: string
  placeholder: string
  obrigatorio: boolean
  tipo: string
  sistema: boolean
  opcoes: string[]
  campo: CampoCustomizado
}

// =====================================================
// Hook
// =====================================================

export function useCamposConfig(tipo: TipoContato) {
  const entidade = tipo === 'pessoa' ? 'pessoa' : 'empresa'
  const { data: camposData, isLoading } = useCampos(entidade as 'pessoa' | 'empresa')
  const fallbacks = tipo === 'pessoa' ? FALLBACK_PESSOA : FALLBACK_EMPRESA

  const config = useMemo(() => {
    const campos = camposData?.campos || []
    const fieldMap = new Map<string, CampoConfig>()
    const slugMap = new Map<string, CampoConfig>()
    const sistemaFields: CampoConfig[] = []
    const customFields: CampoConfig[] = []

    for (const campo of campos) {
      if (!campo.ativo) continue

      if (campo.sistema) {
        const fieldKey = SLUG_TO_FIELD_KEY[campo.slug] || campo.slug
        const cfg: CampoConfig = {
          key: fieldKey,
          slug: campo.slug,
          label: campo.nome,
          placeholder: campo.placeholder || '',
          obrigatorio: campo.obrigatorio,
          tipo: campo.tipo,
          sistema: true,
          opcoes: Array.isArray(campo.opcoes) ? campo.opcoes as string[] : [],
          campo,
        }
        sistemaFields.push(cfg)
        fieldMap.set(fieldKey, cfg)
        slugMap.set(campo.slug, cfg)
      } else {
        const cfg: CampoConfig = {
          key: `custom_${campo.slug}`,
          slug: campo.slug,
          label: campo.nome,
          placeholder: campo.placeholder || '',
          obrigatorio: campo.obrigatorio,
          tipo: campo.tipo,
          sistema: false,
          opcoes: Array.isArray(campo.opcoes) ? campo.opcoes as string[] : [],
          campo,
        }
        customFields.push(cfg)
        fieldMap.set(`custom_${campo.slug}`, cfg)
        slugMap.set(campo.slug, cfg)
      }
    }

    return { sistemaFields, customFields, fieldMap, slugMap }
  }, [camposData])

  /** Busca config no fieldMap ou por slugs alternativos */
  const findConfig = useCallback((key: string): CampoConfig | undefined => {
    const direct = config.fieldMap.get(key)
    if (direct) return direct
    const altSlugs = FIELD_KEY_TO_SLUGS[key]
    if (altSlugs) {
      for (const slug of altSlugs) {
        const alt = config.slugMap.get(slug)
        if (alt) return alt
      }
    }
    return undefined
  }, [config])

  /** Label do campo (da config global) com fallback */
  const getLabel = useCallback((fieldKey: string, fallback?: string): string => {
    const cfg = findConfig(fieldKey)
    if (cfg) return cfg.label
    return fallback ?? fallbacks[fieldKey]?.label ?? fieldKey
  }, [findConfig, fallbacks])

  /** Label para colunas da tabela (mapeamento column key → slug) */
  const getColumnLabel = useCallback((columnKey: string, fallback: string): string => {
    // Primeiro tenta direto no fieldMap
    const cfg = config.fieldMap.get(columnKey)
    if (cfg) return cfg.label
    // Tenta mapeamento específico de colunas
    const altSlugs = COLUMN_KEY_TO_SLUGS[columnKey]
    if (altSlugs) {
      for (const slug of altSlugs) {
        const alt = config.slugMap.get(slug)
        if (alt) return alt.label
      }
    }
    // Tenta field key alternativo
    const fieldCfg = findConfig(columnKey)
    if (fieldCfg) return fieldCfg.label
    return fallback
  }, [config, findConfig])

  /** Placeholder do campo (da config global) com fallback */
  const getPlaceholder = useCallback((fieldKey: string, fallback: string = ''): string => {
    const cfg = findConfig(fieldKey)
    return cfg?.placeholder || fallback
  }, [findConfig])

  /** Campo obrigatório? (da config global) com fallback */
  const isRequired = useCallback((fieldKey: string, fallback?: boolean): boolean => {
    const cfg = findConfig(fieldKey)
    if (cfg) return cfg.obrigatorio
    return fallback ?? fallbacks[fieldKey]?.obrigatorio ?? false
  }, [findConfig, fallbacks])

  return {
    ...config,
    campos: camposData?.campos || [],
    isLoading,
    getLabel,
    getColumnLabel,
    getPlaceholder,
    isRequired,
  }
}
