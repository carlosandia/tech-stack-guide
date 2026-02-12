/**
 * AIDEV-NOTE: Converte automação (DB) <-> nodes/edges (React Flow)
 * Salva posições no campo trigger_config.flow_positions
 * 
 * Suporte a branching: nós de Validação possuem 2 saídas (match/nenhuma).
 * Na serialização, as ações de cada branch são embutidas no config da validação
 * como `match_acoes` e `nenhuma_acoes`, permitindo o backend executar sem grafo.
 */

import type { Node, Edge } from '@xyflow/react'
import type { Automacao, Acao, Condicao } from '../schemas/automacoes.schema'

// AIDEV-NOTE: Helper para converter duração+unidade em minutos para o motor de execução
function calcularMinutos(duracao: number, unidade: string): number {
  if (!duracao) return 5
  switch (unidade) {
    case 'horas': return duracao * 60
    case 'dias': return duracao * 1440
    default: return duracao
  }
}

export interface FlowPositions {
  [nodeId: string]: { x: number; y: number }
}

// =====================================================
// Helper: Serializar um nó para Acao
// =====================================================

function nodeToAcao(node: Node): Acao | null {
  if (node.type === 'trigger' || node.type === 'condicao') return null

  if (node.type === 'delay') {
    return {
      tipo: 'aguardar',
      config: {
        duracao: node.data.duracao,
        unidade: node.data.unidade || 'minutos',
        modo_delay: node.data.modo_delay || 'relativo',
        sub_modo: node.data.sub_modo,
        data_agendada: node.data.data_agendada,
        hora_agendada: node.data.hora_agendada,
        dia_semana: node.data.dia_semana,
        horario: node.data.horario,
        minutos: node.data.modo_delay === 'agendado'
          ? undefined
          : calcularMinutos(node.data.duracao as number, (node.data.unidade as string) || 'minutos'),
      },
    }
  }

  if (node.type === 'acao') {
    return {
      tipo: (node.data.tipo as string) || '',
      config: (node.data.config as Record<string, unknown>) || {},
    }
  }

  // Validação é tratada separadamente pelo traversal
  return null
}

// =====================================================
// Helper: Traversar grafo a partir de um nó, coletando ações
// =====================================================

function traverseBranch(
  startNodeId: string,
  sourceHandle: string | undefined,
  nodesMap: Map<string, Node>,
  edges: Edge[],
): Acao[] {
  const acoes: Acao[] = []

  // Encontrar a edge que sai do startNodeId com o sourceHandle específico
  let currentEdge = edges.find(
    e => e.source === startNodeId && (sourceHandle ? e.sourceHandle === sourceHandle : !e.sourceHandle)
  )

  while (currentEdge) {
    const targetNode = nodesMap.get(currentEdge.target)
    if (!targetNode) break

    if (targetNode.type === 'validacao') {
      // Recursivamente coletar branches da validação
      const matchAcoes = traverseBranch(targetNode.id, 'match', nodesMap, edges)
      const nenhumaAcoes = traverseBranch(targetNode.id, 'nenhuma', nodesMap, edges)

      acoes.push({
        tipo: 'validacao',
        config: {
          condicoes: targetNode.data.condicoes || [],
          match_acoes: matchAcoes,
          nenhuma_acoes: nenhumaAcoes,
        },
      })
      // Não continuar sequencialmente após validação (branches divergem)
      break
    }

    const acao = nodeToAcao(targetNode)
    if (acao) {
      acoes.push(acao)
    }

    // Seguir para o próximo nó (sem sourceHandle específico)
    currentEdge = edges.find(
      e => e.source === targetNode.id && !e.sourceHandle
    )
  }

  return acoes
}

// =====================================================
// DB -> React Flow
// =====================================================

export function automacaoToFlow(automacao: Automacao): { nodes: Node[]; edges: Edge[] } {
  const positions = (automacao.trigger_config?.flow_positions as FlowPositions) || {}
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Nó Trigger (sempre primeiro)
  const triggerId = 'trigger-0'
  nodes.push({
    id: triggerId,
    type: 'trigger',
    position: positions[triggerId] || { x: 250, y: 50 },
    data: {
      trigger_tipo: automacao.trigger_tipo,
      trigger_config: automacao.trigger_config,
    },
  })

  // Condições como nós
  let lastNodeId = triggerId
  automacao.condicoes.forEach((cond, i) => {
    const condId = `condicao-${i}`
    nodes.push({
      id: condId,
      type: 'condicao',
      position: positions[condId] || { x: 250, y: 200 + i * 150 },
      data: { ...cond },
    })
    edges.push({
      id: `e-${lastNodeId}-${condId}`,
      source: lastNodeId,
      target: condId,
      animated: true,
    })
    lastNodeId = condId
  })

  // Reconstruir ações (com suporte a branches de validação)
  let nodeIndex = 0
  const baseY = 200 + automacao.condicoes.length * 150

  function reconstructActions(
    acoes: Acao[],
    parentId: string,
    parentHandle: string | undefined,
    startY: number,
    xOffset: number,
  ): { lastId: string; nextY: number } {
    let prevId = parentId
    let prevHandle = parentHandle
    let currentY = startY

    for (const acao of acoes) {
      const isDelay = acao.tipo === 'aguardar'
      const isValidacao = acao.tipo === 'validacao'
      const nodeType = isValidacao ? 'validacao' : isDelay ? 'delay' : 'acao'
      const acaoId = `${nodeType}-${nodeIndex++}`

      if (isValidacao) {
        // Criar nó de validação
        nodes.push({
          id: acaoId,
          type: 'validacao',
          position: positions[acaoId] || { x: 250 + xOffset, y: currentY },
          data: { condicoes: acao.config?.condicoes || [] },
        })
        edges.push({
          id: `e-${prevId}-${acaoId}`,
          source: prevId,
          sourceHandle: prevHandle,
          target: acaoId,
          animated: true,
        })
        currentY += 150

        // Reconstruir branches
        const matchAcoes = (acao.config?.match_acoes || []) as Acao[]
        const nenhumaAcoes = (acao.config?.nenhuma_acoes || []) as Acao[]

        if (matchAcoes.length > 0) {
          const result = reconstructActions(matchAcoes, acaoId, 'match', currentY, xOffset - 150)
          currentY = result.nextY
        }
        if (nenhumaAcoes.length > 0) {
          const result = reconstructActions(nenhumaAcoes, acaoId, 'nenhuma', currentY, xOffset + 150)
          currentY = result.nextY
        }

        prevId = acaoId
        prevHandle = undefined
      } else {
        nodes.push({
          id: acaoId,
          type: nodeType,
          position: positions[acaoId] || { x: 250 + xOffset, y: currentY },
          data: isDelay
            ? { duracao: acao.config?.duracao, unidade: acao.config?.unidade, modo_delay: acao.config?.modo_delay, sub_modo: acao.config?.sub_modo, data_agendada: acao.config?.data_agendada, hora_agendada: acao.config?.hora_agendada, dia_semana: acao.config?.dia_semana, horario: acao.config?.horario }
            : { tipo: acao.tipo, config: acao.config },
        })

        const sourceHandle = prevHandle || (prevId.startsWith('condicao') ? 'sim' : undefined)
        edges.push({
          id: `e-${prevId}-${acaoId}`,
          source: prevId,
          sourceHandle: sourceHandle,
          target: acaoId,
          animated: true,
        })

        currentY += 150
        prevId = acaoId
        prevHandle = undefined
      }
    }

    return { lastId: prevId, nextY: currentY }
  }

  const sourceHandle = lastNodeId.startsWith('condicao') ? 'sim' : undefined
  reconstructActions(automacao.acoes, lastNodeId, sourceHandle, baseY + 150, 0)

  return { nodes, edges }
}

// =====================================================
// React Flow -> DB
// =====================================================

export function flowToAutomacao(
  nodes: Node[],
  edges: Edge[],
  existingAutomacao?: Partial<Automacao>
): {
  trigger_tipo: string
  trigger_config: Record<string, unknown>
  condicoes: Condicao[]
  acoes: Acao[]
} {
  const triggerNode = nodes.find(n => n.type === 'trigger')
  const condNodes = nodes.filter(n => n.type === 'condicao')

  // Salvar posições
  const flowPositions: FlowPositions = {}
  nodes.forEach(n => { flowPositions[n.id] = n.position })

  const triggerConfig = {
    ...(triggerNode?.data?.trigger_config as Record<string, unknown> || {}),
    flow_positions: flowPositions,
  }

  // AIDEV-NOTE: Mapear TODAS as regras AND para o array de condições (fix GAP 4)
  const condicoes: Condicao[] = condNodes.flatMap(n => {
    const regras = n.data.regras as Array<{ campo: string; operador: string; valor?: string }> | undefined
    if (Array.isArray(regras) && regras.length > 0) {
      return regras.map(r => ({
        campo: r.campo || '',
        operador: (r.operador as Condicao['operador']) || 'igual',
        valor: r.valor,
      }))
    }
    return [{
      campo: (n.data.campo as string) || '',
      operador: (n.data.operador as Condicao['operador']) || 'igual',
      valor: n.data.valor,
    }]
  })

  // AIDEV-NOTE: GAP 5 — Traversar grafo via edges para serializar com branches
  const nodesMap = new Map(nodes.map(n => [n.id, n]))

  // Encontrar o último nó de condição (ou trigger) como ponto de partida das ações
  let startNodeId = triggerNode?.id || 'trigger-0'
  let startHandle: string | undefined = undefined

  if (condNodes.length > 0) {
    // Encontrar o último nó de condição na cadeia
    let lastCond = condNodes[0]
    for (const cn of condNodes) {
      const hasOutgoing = edges.some(e => e.source === cn.id && (e.sourceHandle === 'sim' || !e.sourceHandle))
      const targetOfOutgoing = edges.find(e => e.source === cn.id && (e.sourceHandle === 'sim' || !e.sourceHandle))
      if (targetOfOutgoing) {
        const target = nodesMap.get(targetOfOutgoing.target)
        if (target && target.type !== 'condicao') {
          lastCond = cn
        }
      }
      if (!hasOutgoing) lastCond = cn
    }
    startNodeId = lastCond.id
    startHandle = 'sim'
  }

  const acoes = traverseBranch(startNodeId, startHandle, nodesMap, edges)

  return {
    trigger_tipo: (triggerNode?.data?.trigger_tipo as string) || existingAutomacao?.trigger_tipo || '',
    trigger_config: triggerConfig,
    condicoes,
    acoes,
  }
}

/**
 * Cria nós padrão para uma nova automação
 */
export function createDefaultFlow(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      {
        id: 'trigger-0',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { trigger_tipo: '', trigger_config: {} },
      },
    ],
    edges: [],
  }
}
