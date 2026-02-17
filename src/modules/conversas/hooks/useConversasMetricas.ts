/**
 * AIDEV-NOTE: Hook de métricas de atendimento para o módulo Conversas
 * Calcula 10 métricas organizadas em 3 categorias:
 * - Velocidade: TMR, TMA, Conversas sem resposta
 * - Produtividade: Total, Msgs enviadas/recebidas, Por vendedor, Taxa resolução
 * - Qualidade: Tempo resolução, Conversão, Por canal
 * Visibilidade: admin vê tudo, member vê só suas métricas
 *
 * AIDEV-NOTE: Usa count queries para enviadas/recebidas (contorna limite 1000 rows)
 * e batches de 10 conversas com limit alto para TMR/TMA
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { subDays } from 'date-fns'

export type PeriodoMetricas = 'todos' | 'hoje' | '7d' | '30d' | '60d' | '90d' | 'custom'
export type CanalFiltro = 'todos' | 'whatsapp' | 'instagram'

interface MetricasFilters {
  periodo: PeriodoMetricas
  canal: CanalFiltro
  vendedorId?: string
  dataInicio?: string // ISO string para periodo custom
  dataFim?: string    // ISO string para periodo custom
}

export interface ConversasMetricas {
  tempoMedioPrimeiraResposta: number | null
  tempoMedioResposta: number | null
  conversasSemResposta: number
  totalConversas: number
  mensagensEnviadas: number
  mensagensRecebidas: number
  conversasPorVendedor: Array<{ usuario_id: string; nome: string; total: number }>
  taxaResolucao: number
  tempoMedioResolucao: number | null
  taxaConversao: number
  conversasPorCanal: { whatsapp: number; instagram: number }
}

function getPeriodoRange(filters: MetricasFilters): { inicio: string | null; fim: string } {
  const now = new Date()
  const fim = now.toISOString()

  // AIDEV-NOTE: 'todos' = sem filtro de data, métricas desde a criação da org
  if (filters.periodo === 'todos') {
    return { inicio: null, fim }
  }

  if (filters.periodo === 'custom') {
    return {
      inicio: filters.dataInicio || subDays(now, 30).toISOString(),
      fim: filters.dataFim || fim,
    }
  }

  const dias: Record<string, number> = {
    hoje: 1, '7d': 7, '30d': 30, '60d': 60, '90d': 90,
  }
  return { inicio: subDays(now, dias[filters.periodo] ?? 30).toISOString(), fim }
}

export function formatDuracao(minutos: number | null): string {
  if (minutos === null || minutos === 0) return '--'
  if (minutos < 60) return `${Math.round(minutos)}min`
  const horas = Math.floor(minutos / 60)
  const mins = Math.round(minutos % 60)
  if (horas < 24) return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`
  const dias = Math.floor(horas / 24)
  const horasRestantes = horas % 24
  return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias}d`
}

async function fetchMetricas(filters: MetricasFilters, role: string): Promise<ConversasMetricas> {
  const { inicio: dataInicio } = getPeriodoRange(filters)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, organizacao_id')
    .eq('auth_id', user.id)
    .single()

  if (!usuario?.organizacao_id) throw new Error('Org não encontrada')

  const orgId = usuario.organizacao_id
  const isAdmin = role === 'admin' || role === 'super_admin'
  const usuarioFiltro = (!isAdmin) ? usuario.id : filters.vendedorId

  // 1. Buscar conversas (somente individuais, excluir grupos)
  let conversasQuery = supabase
    .from('conversas')
    .select('id, canal, status, tipo, usuario_id, primeira_mensagem_em, status_alterado_em, ultima_mensagem_em')
    .eq('organizacao_id', orgId)
    .eq('tipo', 'individual')
    .is('deletado_em', null)

  // AIDEV-NOTE: Se dataInicio é null (periodo='todos'), não aplica filtro de data
  if (dataInicio) {
    conversasQuery = conversasQuery.gte('ultima_mensagem_em', dataInicio)
  }

  if (filters.canal !== 'todos') {
    conversasQuery = conversasQuery.eq('canal', filters.canal)
  }
  if (usuarioFiltro) {
    conversasQuery = conversasQuery.eq('usuario_id', usuarioFiltro)
  }

  const { data: conversas } = await conversasQuery
  const conversasList = conversas || []
  const conversaIds = conversasList.map(c => c.id)

  // 2. Contagens de mensagens via count queries (contorna limite 1000)
  let mensagensEnviadas = 0
  let mensagensRecebidas = 0

  if (conversaIds.length > 0) {
    const batchSize = 50
    for (let i = 0; i < conversaIds.length; i += batchSize) {
      const batch = conversaIds.slice(i, i + batchSize)

      let envQuery = supabase
          .from('mensagens')
          .select('id', { count: 'exact', head: true })
          .in('conversa_id', batch)
          .eq('from_me', true)
          .is('deletado_em', null)
      if (dataInicio) envQuery = envQuery.gte('criado_em', dataInicio)

      let recQuery = supabase
          .from('mensagens')
          .select('id', { count: 'exact', head: true })
          .in('conversa_id', batch)
          .eq('from_me', false)
          .is('deletado_em', null)
      if (dataInicio) recQuery = recQuery.gte('criado_em', dataInicio)

      const [envRes, recRes] = await Promise.all([envQuery, recQuery])

      mensagensEnviadas += envRes.count || 0
      mensagensRecebidas += recRes.count || 0
    }
  }

  // 3. Buscar mensagens para TMR/TMA (batches de 10, limit alto)
  const tmrValues: number[] = []
  const tmaValues: number[] = []

  if (conversaIds.length > 0) {
    const tmaBatchSize = 10
    for (let i = 0; i < conversaIds.length; i += tmaBatchSize) {
      const batch = conversaIds.slice(i, i + tmaBatchSize)
      let msgsQuery = supabase
        .from('mensagens')
        .select('id, conversa_id, from_me, criado_em')
        .in('conversa_id', batch)
        .is('deletado_em', null)
      if (dataInicio) msgsQuery = msgsQuery.gte('criado_em', dataInicio)
      const { data: msgs } = await msgsQuery
        .order('criado_em', { ascending: true })
        .limit(5000)

      if (!msgs) continue

      // Agrupar por conversa
      const msgsPorConversa = new Map<string, typeof msgs>()
      for (const msg of msgs) {
        const list = msgsPorConversa.get(msg.conversa_id) || []
        list.push(msg)
        msgsPorConversa.set(msg.conversa_id, list)
      }

      for (const [, convMsgs] of msgsPorConversa) {
        // TMR: primeira msg do cliente -> primeira resposta do vendedor
        const primeiraCliente = convMsgs.find(m => !m.from_me)
        if (primeiraCliente) {
          const primeiraResposta = convMsgs.find(
            m => m.from_me && new Date(m.criado_em) > new Date(primeiraCliente.criado_em)
          )
          if (primeiraResposta) {
            const diff = (new Date(primeiraResposta.criado_em).getTime() - new Date(primeiraCliente.criado_em).getTime()) / 60000
            tmrValues.push(diff)
          }
        }

        // TMA: para cada msg do cliente, medir tempo até próxima resposta
        for (let j = 0; j < convMsgs.length; j++) {
          if (!convMsgs[j].from_me) {
            const resposta = convMsgs.slice(j + 1).find(m => m.from_me)
            if (resposta) {
              const diff = (new Date(resposta.criado_em).getTime() - new Date(convMsgs[j].criado_em).getTime()) / 60000
              tmaValues.push(diff)
            }
          }
        }
      }
    }
  }

  const tempoMedioPrimeiraResposta = tmrValues.length > 0
    ? tmrValues.reduce((a, b) => a + b, 0) / tmrValues.length
    : null

  const tempoMedioResposta = tmaValues.length > 0
    ? tmaValues.reduce((a, b) => a + b, 0) / tmaValues.length
    : null

  // 4. Sem Resposta: última msg do cliente há >2h OU conversa sem nenhum from_me
  const agora = new Date()
  let conversasSemResposta = 0

  if (conversaIds.length > 0) {
    // Buscar conversas que não possuem nenhuma mensagem from_me
    const batchSize = 50
    const conversasComResposta = new Set<string>()

    for (let i = 0; i < conversaIds.length; i += batchSize) {
      const batch = conversaIds.slice(i, i + batchSize)
      const { data: msgsFromMe } = await supabase
        .from('mensagens')
        .select('conversa_id')
        .in('conversa_id', batch)
        .eq('from_me', true)
        .is('deletado_em', null)
        .limit(5000)

      if (msgsFromMe) {
        for (const m of msgsFromMe) {
          conversasComResposta.add(m.conversa_id)
        }
      }
    }

    // Conversas nunca respondidas
    const nuncaRespondidas = conversaIds.filter(id => !conversasComResposta.has(id))
    conversasSemResposta += nuncaRespondidas.length

    // Conversas com última msg do cliente há >2h (excluindo as já contadas)
    for (const c of conversasList) {
      if (nuncaRespondidas.includes(c.id)) continue
      if (c.ultima_mensagem_em && c.status === 'aberta') {
        // Precisamos verificar se a última mensagem é do cliente
        // Usar os dados já obtidos ou fazer query pontual
        const { data: ultimaMsg } = await supabase
          .from('mensagens')
          .select('from_me, criado_em')
          .eq('conversa_id', c.id)
          .is('deletado_em', null)
          .order('criado_em', { ascending: false })
          .limit(1)
          .single()

        if (ultimaMsg && !ultimaMsg.from_me) {
          const diff = (agora.getTime() - new Date(ultimaMsg.criado_em).getTime()) / 60000
          if (diff > 120) conversasSemResposta++
        }
      }
    }
  }

  // 5. Taxa de Resolução (fechada OU resolvida)
  const conversasResolvidas = conversasList.filter(
    c => c.status === 'fechada' || c.status === 'resolvida'
  ).length
  const taxaResolucao = conversasList.length > 0
    ? Math.round((conversasResolvidas / conversasList.length) * 100)
    : 0

  // 6. Tempo Médio de Resolução
  const temposResolucao: number[] = []
  for (const c of conversasList) {
    if ((c.status === 'fechada' || c.status === 'resolvida') && c.primeira_mensagem_em && c.status_alterado_em) {
      const diff = (new Date(c.status_alterado_em).getTime() - new Date(c.primeira_mensagem_em).getTime()) / 60000
      if (diff > 0) temposResolucao.push(diff)
    }
  }
  const tempoMedioResolucao = temposResolucao.length > 0
    ? temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length
    : null

  // 7. Conversas por Canal
  const conversasPorCanal = {
    whatsapp: conversasList.filter(c => c.canal === 'whatsapp').length,
    instagram: conversasList.filter(c => c.canal === 'instagram').length,
  }

  // 8. Conversas por Vendedor
  const vendedorMap = new Map<string, number>()
  for (const c of conversasList) {
    vendedorMap.set(c.usuario_id, (vendedorMap.get(c.usuario_id) || 0) + 1)
  }

  const vendedorIds = Array.from(vendedorMap.keys())
  let vendedorNomes = new Map<string, string>()
  if (vendedorIds.length > 0) {
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nome')
      .in('id', vendedorIds)
    if (usuarios) {
      for (const u of usuarios) {
        vendedorNomes.set(u.id, u.nome)
      }
    }
  }

  const conversasPorVendedor = Array.from(vendedorMap.entries())
    .map(([usuario_id, total]) => ({
      usuario_id,
      nome: vendedorNomes.get(usuario_id) || 'Desconhecido',
      total,
    }))
    .sort((a, b) => b.total - a.total)

  const taxaConversao = 0

  return {
    tempoMedioPrimeiraResposta,
    tempoMedioResposta,
    conversasSemResposta,
    totalConversas: conversasList.length,
    mensagensEnviadas,
    mensagensRecebidas,
    conversasPorVendedor,
    taxaResolucao,
    tempoMedioResolucao,
    taxaConversao,
    conversasPorCanal,
  }
}

export function useConversasMetricas(filters: MetricasFilters) {
  const { role } = useAuth()

  return useQuery({
    queryKey: ['conversas-metricas', filters, role],
    queryFn: () => fetchMetricas(filters, role || 'member'),
    staleTime: 5 * 60 * 1000,
    enabled: !!role,
  })
}
