/**
 * AIDEV-NOTE: Hook global de localização do tenant
 * Consome configuracoes_tenant (moeda, timezone, formato_data)
 * e expõe funções de formatação dinâmicas.
 *
 * Usado por todos os módulos que exibem valores monetários, datas ou horários.
 * Cache longo (5min) pois essas configs raramente mudam.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// =====================================================
// Types
// =====================================================

export interface LocalizacaoConfig {
  moeda: string
  timezone: string
  formatoData: string
}

export interface UseLocalizacaoReturn extends LocalizacaoConfig {
  isLoading: boolean
  formatarMoeda: (valor: number) => string
  formatarData: (data: string | Date) => string
  formatarDataHora: (data: string | Date) => string
  formatarDataCurta: (data: string | Date) => string
}

// =====================================================
// Mapeamentos
// =====================================================

const MOEDA_LOCALE: Record<string, { locale: string; currency: string }> = {
  BRL: { locale: 'pt-BR', currency: 'BRL' },
  USD: { locale: 'en-US', currency: 'USD' },
  EUR: { locale: 'de-DE', currency: 'EUR' },
}

// AIDEV-NOTE: Mapeia formato de data config para opções do Intl.DateTimeFormat
function getDateFormatOptions(formato: string): Intl.DateTimeFormatOptions {
  switch (formato) {
    case 'MM/DD/YYYY':
      return { month: '2-digit', day: '2-digit', year: 'numeric' }
    case 'YYYY-MM-DD':
      return { year: 'numeric', month: '2-digit', day: '2-digit' }
    case 'DD/MM/YYYY':
    default:
      return { day: '2-digit', month: '2-digit', year: 'numeric' }
  }
}

function getLocaleForFormato(formato: string): string {
  switch (formato) {
    case 'MM/DD/YYYY': return 'en-US'
    case 'YYYY-MM-DD': return 'sv-SE' // ISO format
    case 'DD/MM/YYYY':
    default: return 'pt-BR'
  }
}

// =====================================================
// Hook
// =====================================================

export function useLocalizacao(): UseLocalizacaoReturn {
  const { data, isLoading } = useQuery({
    queryKey: ['config-tenant-localizacao'],
    queryFn: async () => {
      const { data: config, error } = await supabase
        .from('configuracoes_tenant')
        .select('moeda_padrao, timezone, formato_data')
        .maybeSingle()

      if (error) throw error
      return config
    },
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
  })

  const moeda = data?.moeda_padrao || 'BRL'
  const timezone = data?.timezone || 'America/Sao_Paulo'
  const formatoData = data?.formato_data || 'DD/MM/YYYY'

  const formatters = useMemo(() => {
    const moedaConfig = MOEDA_LOCALE[moeda] || MOEDA_LOCALE.BRL
    const dateLocale = getLocaleForFormato(formatoData)
    const dateOptions = getDateFormatOptions(formatoData)

    const currencyFormatter = new Intl.NumberFormat(moedaConfig.locale, {
      style: 'currency',
      currency: moedaConfig.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
      ...dateOptions,
      timeZone: timezone,
    })

    const dateTimeFormatter = new Intl.DateTimeFormat(dateLocale, {
      ...dateOptions,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    })

    const dateShortFormatter = new Intl.DateTimeFormat(dateLocale, {
      day: '2-digit',
      month: '2-digit',
      timeZone: timezone,
    })

    return {
      formatarMoeda: (valor: number): string => {
        return currencyFormatter.format(valor)
      },
      formatarData: (data: string | Date): string => {
        const d = typeof data === 'string' ? new Date(data) : data
        return dateFormatter.format(d)
      },
      formatarDataHora: (data: string | Date): string => {
        const d = typeof data === 'string' ? new Date(data) : data
        return dateTimeFormatter.format(d)
      },
      formatarDataCurta: (data: string | Date): string => {
        const d = typeof data === 'string' ? new Date(data) : data
        return dateShortFormatter.format(d)
      },
    }
  }, [moeda, timezone, formatoData])

  return {
    moeda,
    timezone,
    formatoData,
    isLoading,
    ...formatters,
  }
}

// =====================================================
// Funções puras (para uso fora de componentes React)
// =====================================================

/**
 * Formata moeda com parâmetros explícitos.
 * Usado em funções puras que não têm acesso a hooks.
 */
export function formatarMoedaPura(valor: number, moeda: string = 'BRL'): string {
  const config = MOEDA_LOCALE[moeda] || MOEDA_LOCALE.BRL
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

/**
 * Formata moeda de forma compacta (1.2K, 1.5M)
 */
export function formatarMoedaCompacta(valor: number, moeda: string = 'BRL'): string {
  const config = MOEDA_LOCALE[moeda] || MOEDA_LOCALE.BRL
  const symbol = moeda === 'BRL' ? 'R$' : moeda === 'USD' ? '$' : '€'
  if (valor >= 1_000_000) return `${symbol} ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `${symbol} ${(valor / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}
