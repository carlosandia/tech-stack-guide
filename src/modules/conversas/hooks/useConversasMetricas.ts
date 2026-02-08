/**
 * AIDEV-NOTE: Hook de métricas de atendimento para o módulo Conversas
 * Calcula 10 métricas organizadas em 3 categorias:
 * - Velocidade: TMR, TMA, Conversas sem resposta
 * - Produtividade: Total, Msgs enviadas/recebidas, Por vendedor, Taxa resolução
 * - Qualidade: Tempo resolução, Conversão, Por canal
 * Visibilidade: admin vê tudo, member vê só suas métricas
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { subDays, differenceInMinutes } from 'date-fns'

export type PeriodoMetricas = 'hoje' | '7d' | '30d' | '60d' | '90d'
export type CanalFiltro = 'todos' | 'whatsapp' | 'instagram'

interface MetricasFilters {
  periodo: PeriodoMetricas
  canal: CanalFiltro
  vendedorId?: string // undefined = todos (admin only)
}

export interface ConversasMetricas {
  // Velocidade
  tempoMedioPrimeiraResposta: number | null // minutos
  tempoMedioResposta: number | null // minutos
  conversasSemResposta: number

  // Produtividade
  totalConversas: number
  mensagensEnviadas: number
  mensagensRecebidas: number
  conversasPorVendedor: Array<{ usuario_id: string; nome: string; total: number }>
  taxaResolucao: number // percentual

  // Qualidade
  tempoMedioResolucao: number | null // minutos
  taxaConversao: number // percentual (conversas que geraram opp)
  conversasPorCanal: { whatsapp: number; instagram: number }
}

function getPeriodoDate(periodo: PeriodoMetricas): Date {
  const now = new Date()
  switch (periodo) {
    case 'hoje': return subDays(now, 1)
    case '7d': return subDays(now, 7)
    case '30d': return subDays(now, 30)
    case '60d': return subDays(now, 60)
    case '90d': return subDays(now, 90)
  }
}

function formatDuracao(minutos: number | null): string {
  if (minutos === null || minutos === 0) return '--'
  if (minutos < 60) return `${Math.round(minutos)}min`
  const horas = Math.floor(minutos / 60)
  const mins = Math.round(minutos % 60)
  if (horas < 24) return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`
  const dias = Math.floor(horas / 24)
  const horasRestantes = horas % 24
  return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias}d`
}

export { formatDuracao }

async function fetchMetricas(filters: MetricasFilters, role: string): Promise<ConversasMetricas> {
  const dataInicio = getPeriodoDate(filters.periodo).toISOString()

  // Helper para obter organizacao_id
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

  // 1. Buscar conversas do período
  let conversasQuery = supabase
    .from('conversas')
    .select('id, canal, status, usuario_id, primeira_mensagem_em, status_alterado_em, ultima_mensagem_em')
    .eq('organizacao_id', orgId)
    .is('deletado_em', null)
    .gte('ultima_mensagem_em', dataInicio)

  if (filters.canal !== 'todos') {
    conversasQuery = conversasQuery.eq('canal', filters.canal)
  }
  if (usuarioFiltro) {
    conversasQuery = conversasQuery.eq('usuario_id', usuarioFiltro)
  }

  const { data: conversas } = await conversasQuery
  const conversasList = conversas || []
  const conversaIds = conversasList.map(c => c.id)

  // 2. Buscar mensagens do período (apenas se há conversas)
  let mensagensList: Array<{ id: string; conversa_id: string; from_me: boolean; criado_em: string }> = []

  if (conversaIds.length > 0) {
    // Buscar em batches de 50 para evitar limite de URL
    const batchSize = 50
    for (let i = 0; i < conversaIds.length; i += batchSize) {
      const batch = conversaIds.slice(i, i + batchSize)
      const { data: msgs } = await supabase
        .from('mensagens')
        .select('id, conversa_id, from_me, criado_em')
        .in('conversa_id', batch)
        .is('deletado_em', null)
        .gte('criado_em', dataInicio)
        .order('criado_em', { ascending: true })

      if (msgs) mensagensList.push(...msgs)
    }
  }

  // 3. Calcular métricas

  // -- Mensagens enviadas/recebidas --
  const mensagensEnviadas = mensagensList.filter(m => m.from_me).length
  const mensagensRecebidas = mensagensList.filter(m => !m.from_me).length

  // -- TMR (Tempo Médio de Primeira Resposta) --
  // Para cada conversa, encontrar a 1a msg do cliente e a 1a resposta do vendedor
  const tmrValues: number[] = []
  const tmaValues: number[] = []

  // Agrupar mensagens por conversa
  const msgsPorConversa = new Map<string, typeof mensagensList>()
  for (const msg of mensagensList) {
    const list = msgsPorConversa.get(msg.conversa_id) || []
    list.push(msg)
    msgsPorConversa.set(msg.conversa_id, list)
  }

  for (const [, msgs] of msgsPorConversa) {
    // Ordenar por criado_em
    msgs.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime())

    // TMR: primeira msg do cliente -> primeira resposta do vendedor
    const primeiraCliente = msgs.find(m => !m.from_me)
    if (primeiraCliente) {
      const primeiraResposta = msgs.find(m => m.from_me && new Date(m.criado_em) > new Date(primeiraCliente.criado_em))
      if (primeiraResposta) {
        const diff = differenceInMinutes(new Date(primeiraResposta.criado_em), new Date(primeiraCliente.criado_em))
        tmrValues.push(diff)
      }
    }

    // TMA: para cada msg do cliente, medir tempo até próxima resposta do vendedor
    for (let i = 0; i < msgs.length; i++) {
      if (!msgs[i].from_me) {
        // Encontrar próxima msg from_me
        const resposta = msgs.slice(i + 1).find(m => m.from_me)
        if (resposta) {
          const diff = differenceInMinutes(new Date(resposta.criado_em), new Date(msgs[i].criado_em))
          tmaValues.push(diff)
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

  // -- Conversas sem resposta (última msg é do cliente há mais de 2h) --
  const agora = new Date()
  let conversasSemResposta = 0
  for (const [, msgs] of msgsPorConversa) {
    const ultimaMsg = msgs[msgs.length - 1]
    if (ultimaMsg && !ultimaMsg.from_me) {
      const diff = differenceInMinutes(agora, new Date(ultimaMsg.criado_em))
      if (diff > 120) conversasSemResposta++
    }
  }

  // -- Taxa de Resolução --
  const conversasFechadas = conversasList.filter(c => c.status === 'fechada').length
  const taxaResolucao = conversasList.length > 0
    ? Math.round((conversasFechadas / conversasList.length) * 100)
    : 0

  // -- Tempo Médio de Resolução --
  const temposResolucao: number[] = []
  for (const c of conversasList) {
    if (c.status === 'fechada' && c.primeira_mensagem_em && c.status_alterado_em) {
      const diff = differenceInMinutes(new Date(c.status_alterado_em), new Date(c.primeira_mensagem_em))
      if (diff > 0) temposResolucao.push(diff)
    }
  }
  const tempoMedioResolucao = temposResolucao.length > 0
    ? temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length
    : null

  // -- Conversas por Canal --
  const conversasPorCanal = {
    whatsapp: conversasList.filter(c => c.canal === 'whatsapp').length,
    instagram: conversasList.filter(c => c.canal === 'instagram').length,
  }

  // -- Conversas por Vendedor --
  const vendedorMap = new Map<string, number>()
  for (const c of conversasList) {
    vendedorMap.set(c.usuario_id, (vendedorMap.get(c.usuario_id) || 0) + 1)
  }

  // Buscar nomes dos vendedores
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

  // -- Taxa de Conversão (conversas que geraram oportunidade) --
  // Simplificação: verificar oportunidades criadas no período que tenham contato_id matching
  // Por ora, retornar 0 pois requer join com oportunidades via contato_id
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
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!role,
  })
}
