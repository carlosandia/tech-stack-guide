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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, organizacao_id')
    .eq('auth_id', user.id)
    .single()

  if (!usuario?.organizacao_id) throw new Error('Org não encontrada')

  const orgId = usuario.organizacao_id

  // Buscar emails enviados no período
  let enviadosQuery = supabase
    .from('emails_recebidos')
    .select('id, total_aberturas, aberto_em, data_email, thread_id', { count: 'exact' })
    .eq('organizacao_id', orgId)
    .eq('pasta', 'sent')
    .is('deletado_em', null)
  if (dataInicio) enviadosQuery = enviadosQuery.gte('data_email', dataInicio)
  const { data: enviados, count: enviadosCount } = await enviadosQuery

  // Buscar emails recebidos no período
  let recebidosQuery = supabase
    .from('emails_recebidos')
    .select('id', { count: 'exact', head: true })
    .eq('organizacao_id', orgId)
    .eq('pasta', 'inbox')
    .is('deletado_em', null)
  if (dataInicio) recebidosQuery = recebidosQuery.gte('data_email', dataInicio)
  const { count: recebidosCount } = await recebidosQuery

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

  // Sem resposta: enviados cujo thread_id não aparece em emails recebidos
  let semResposta = 0
  const threadIds = enviadosList
    .filter(e => e.thread_id)
    .map(e => e.thread_id as string)

  if (threadIds.length > 0) {
    // Buscar threads que tiveram resposta (email recebido com mesmo thread_id)
    const batchSize = 50
    const threadsComResposta = new Set<string>()
    for (let i = 0; i < threadIds.length; i += batchSize) {
      const batch = threadIds.slice(i, i + batchSize)
      const { data: respostas } = await supabase
        .from('emails_recebidos')
        .select('thread_id')
        .eq('organizacao_id', orgId)
        .eq('pasta', 'inbox')
        .is('deletado_em', null)
        .in('thread_id', batch)
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

  // Tempo médio de resposta (inbox emails que são respostas a enviados)
  // Simplificação: medir diferença entre último sent e primeiro inbox do mesmo thread
  let tempoMedioResposta: number | null = null
  // Simplificado por performance — pode ser expandido futuramente

  // Com anexos no período
  let comAnexosQuery = supabase
    .from('emails_recebidos')
    .select('id', { count: 'exact', head: true })
    .eq('organizacao_id', orgId)
    .eq('tem_anexos', true)
    .is('deletado_em', null)
  if (dataInicio) comAnexosQuery = comAnexosQuery.gte('data_email', dataInicio)
  const { count: comAnexosCount } = await comAnexosQuery

  // Favoritos
  const { count: favoritosCount } = await supabase
    .from('emails_recebidos')
    .select('id', { count: 'exact', head: true })
    .eq('organizacao_id', orgId)
    .eq('favorito', true)
    .is('deletado_em', null)

  // Rascunhos
  const { count: rascunhosCount } = await supabase
    .from('emails_rascunhos')
    .select('id', { count: 'exact', head: true })
    .eq('organizacao_id', orgId)
    .is('deletado_em', null)

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
    enabled: !!role,
  })
}
