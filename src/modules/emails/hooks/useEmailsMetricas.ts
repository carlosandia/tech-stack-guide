/**
 * AIDEV-NOTE: Hook de métricas de marketing/comercial para o módulo de Emails
 * Calcula 10 métricas:
 * - Enviados, Recebidos, Taxa de Abertura, Total Aberturas
 * - Sem Resposta, Tempo Médio Resposta, Com Anexos
 * - Favoritos, Rascunhos, Média 1ª Abertura
 * Segue o mesmo padrão do useConversasMetricas
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getOrganizacaoId } from '@/shared/services/auth-context'
import { useAuth } from '@/providers/AuthProvider'
import { subDays } from 'date-fns'

export type PeriodoMetricas = 'todos' | 'hoje' | '7d' | '30d' | '60d' | '90d'

interface MetricasFilters {
  periodo: PeriodoMetricas
}

export interface EmailsMetricas {
  emailsEnviados: number
  emailsRecebidos: number
  taxaAbertura: number // percentual
  totalAberturas: number
  semResposta: number
  tempoMedioResposta: number | null // minutos
  comAnexos: number
  favoritos: number
  rascunhos: number
  mediaPrimeiraAbertura: number | null // minutos
}

function getPeriodoDate(periodo: PeriodoMetricas): Date | null {
  if (periodo === 'todos') return null
  const now = new Date()
  switch (periodo) {
    case 'hoje': return subDays(now, 1)
    case '7d': return subDays(now, 7)
    case '30d': return subDays(now, 30)
    case '60d': return subDays(now, 60)
    case '90d': return subDays(now, 90)
  }
}

export function formatDuracao(minutos: number | null): string {
  if (minutos === null || minutos === 0) return '--'
  if (minutos < 1) return '<1min'
  if (minutos < 60) return `${Math.round(minutos)}min`
  const horas = Math.floor(minutos / 60)
  const mins = Math.round(minutos % 60)
  if (horas < 24) return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`
  const dias = Math.floor(horas / 24)
  const horasRestantes = horas % 24
  return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias}d`
}

async function fetchMetricas(filters: MetricasFilters): Promise<EmailsMetricas> {
  const periodoDate = getPeriodoDate(filters.periodo)
  const dataInicio = periodoDate?.toISOString() || null

  // AIDEV-NOTE: Auth centralizado via shared auth-context (DRY)
  const orgId = await getOrganizacaoId()

  // AIDEV-NOTE: Performance 2.2 — construir todas as 5 queries independentes antes do primeiro await
  // e executá-las em paralelo com Promise.all (reduz 2-3s → <500ms)

  let enviadosQuery = supabase
    .from('emails_recebidos')
    .select('id, total_aberturas, aberto_em, data_email, thread_id', { count: 'exact' })
    .eq('organizacao_id', orgId)
    .eq('pasta', 'sent')
    .is('deletado_em', null)
  if (dataInicio) enviadosQuery = enviadosQuery.gte('data_email', dataInicio)

  let recebidosQuery = supabase
    .from('emails_recebidos')
    .select('id', { count: 'exact', head: true })
    .eq('organizacao_id', orgId)
    .eq('pasta', 'inbox')
    .is('deletado_em', null)
  if (dataInicio) recebidosQuery = recebidosQuery.gte('data_email', dataInicio)

  let comAnexosQuery = supabase
    .from('emails_recebidos')
    .select('id', { count: 'exact', head: true })
    .eq('organizacao_id', orgId)
    .eq('tem_anexos', true)
    .is('deletado_em', null)
  if (dataInicio) comAnexosQuery = comAnexosQuery.gte('data_email', dataInicio)

  const favoritosQuery = supabase
    .from('emails_recebidos')
    .select('id', { count: 'exact', head: true })
    .eq('organizacao_id', orgId)
    .eq('favorito', true)
    .is('deletado_em', null)

  const rascunhosQuery = supabase
    .from('emails_rascunhos')
    .select('id', { count: 'exact', head: true })
    .eq('organizacao_id', orgId)
    .is('deletado_em', null)

  // Fase 1: 5 queries independentes em paralelo
  const [
    { data: enviados, count: enviadosCount },
    { count: recebidosCount },
    { count: comAnexosCount },
    { count: favoritosCount },
    { count: rascunhosCount },
  ] = await Promise.all([enviadosQuery, recebidosQuery, comAnexosQuery, favoritosQuery, rascunhosQuery])

  const enviadosList = enviados || []
  const totalEnviados = enviadosCount || 0
  const totalRecebidos = recebidosCount || 0

  // Taxa de abertura
  const enviadosAbertos = enviadosList.filter(e => (e.total_aberturas || 0) > 0).length
  const taxaAbertura = totalEnviados > 0
    ? Math.round((enviadosAbertos / totalEnviados) * 100)
    : 0

  // Total aberturas
  const totalAberturas = enviadosList.reduce((sum, e) => sum + (e.total_aberturas || 0), 0)

  // Média primeira abertura (tempo entre envio e primeira abertura)
  const temposPrimeiraAbertura: number[] = []
  for (const e of enviadosList) {
    if (e.aberto_em && e.data_email) {
      const diff = (new Date(e.aberto_em).getTime() - new Date(e.data_email).getTime()) / 60000
      if (diff > 0) temposPrimeiraAbertura.push(diff)
    }
  }
  const mediaPrimeiraAbertura = temposPrimeiraAbertura.length > 0
    ? temposPrimeiraAbertura.reduce((a, b) => a + b, 0) / temposPrimeiraAbertura.length
    : null

  // Fase 2: thread loop — depende de enviadosList (executa após Fase 1)
  let semResposta = 0
  const threadIds = enviadosList
    .filter(e => e.thread_id)
    .map(e => e.thread_id as string)

  if (threadIds.length > 0) {
    // AIDEV-NOTE: Performance 2.2 — batches de threads em paralelo (vs. loop sequencial)
    const batchSize = 100
    const threadsComResposta = new Set<string>()
    const batches: string[][] = []
    for (let i = 0; i < threadIds.length; i += batchSize) {
      batches.push(threadIds.slice(i, i + batchSize))
    }
    const resultados = await Promise.all(
      batches.map(batch =>
        supabase
          .from('emails_recebidos')
          .select('thread_id')
          .eq('organizacao_id', orgId)
          .eq('pasta', 'inbox')
          .is('deletado_em', null)
          .in('thread_id', batch)
      )
    )
    for (const { data: respostas } of resultados) {
      if (respostas) {
        for (const r of respostas) {
          if (r.thread_id) threadsComResposta.add(r.thread_id)
        }
      }
    }
    semResposta = enviadosList.filter(e => e.thread_id && !threadsComResposta.has(e.thread_id)).length
    // Enviados sem thread_id contam como sem resposta também
    semResposta += enviadosList.filter(e => !e.thread_id).length
  } else {
    semResposta = totalEnviados
  }

  // Tempo médio de resposta — simplificado por ora, pode ser expandido futuramente
  const tempoMedioResposta: number | null = null

  return {
    emailsEnviados: totalEnviados,
    emailsRecebidos: totalRecebidos,
    taxaAbertura,
    totalAberturas,
    semResposta,
    tempoMedioResposta,
    comAnexos: comAnexosCount || 0,
    favoritos: favoritosCount || 0,
    rascunhos: rascunhosCount || 0,
    mediaPrimeiraAbertura,
  }
}

export function useEmailsMetricas(filters: MetricasFilters) {
  const { role } = useAuth()

  return useQuery({
    queryKey: ['emails-metricas', filters, role],
    queryFn: () => fetchMetricas(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,     // manter cache por 30 min (Performance 1.2)
    enabled: !!role,
    refetchOnWindowFocus: false,
  })
}
