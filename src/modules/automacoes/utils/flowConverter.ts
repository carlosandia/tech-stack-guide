/**
 * AIDEV-NOTE: Converte automação (DB) <-> nodes/edges (React Flow)
 * Salva posições no campo trigger_config.flow_positions
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

/**
 * Converte uma automação do banco para nós e edges do React Flow
 */
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

  // Ações como nós
  automacao.acoes.forEach((acao, i) => {
    const isDelay = acao.tipo === 'aguardar'
    const isValidacao = acao.tipo === 'validacao'
    const nodeType = isValidacao ? 'validacao' : isDelay ? 'delay' : 'acao'
    const acaoId = `${nodeType}-${i}`

    nodes.push({
      id: acaoId,
      type: nodeType,
      position: positions[acaoId] || {
        x: 250,
        y: 200 + automacao.condicoes.length * 150 + (i + 1) * 150,
      },
      data: isValidacao
        ? { condicoes: acao.config?.condicoes || [] }
        : isDelay
        ? { duracao: acao.config?.duracao, unidade: acao.config?.unidade }
        : { tipo: acao.tipo, config: acao.config },
    })

    // Conectar do nó de condição "sim" se existir, senão do último
    const sourceHandle = lastNodeId.startsWith('condicao') ? 'sim' : undefined
    edges.push({
      id: `e-${lastNodeId}-${acaoId}`,
      source: lastNodeId,
      sourceHandle,
      target: acaoId,
      animated: true,
    })
    lastNodeId = acaoId
  })

  return { nodes, edges }
}

/**
 * Converte nós e edges do React Flow de volta para o formato do banco
 */
export function flowToAutomacao(
  nodes: Node[],
  _edges: Edge[],
  existingAutomacao?: Partial<Automacao>
): {
  trigger_tipo: string
  trigger_config: Record<string, unknown>
  condicoes: Condicao[]
  acoes: Acao[]
} {
  const triggerNode = nodes.find(n => n.type === 'trigger')
  const condNodes = nodes.filter(n => n.type === 'condicao')
  const acaoNodes = nodes.filter(n => n.type === 'acao')
  const delayNodes = nodes.filter(n => n.type === 'delay')
  const validacaoNodes = nodes.filter(n => n.type === 'validacao')

  // Salvar posições
  const flowPositions: FlowPositions = {}
  nodes.forEach(n => { flowPositions[n.id] = n.position })

  const triggerConfig = {
    ...(triggerNode?.data?.trigger_config as Record<string, unknown> || {}),
    flow_positions: flowPositions,
  }

  const condicoes: Condicao[] = condNodes.map(n => {
    // AIDEV-NOTE: Suporta tanto regras AND quanto formato legado
    const regras = n.data.regras as Array<{ campo: string; operador: string; valor?: string }> | undefined
    if (Array.isArray(regras) && regras.length > 0) {
      // Retorna a primeira regra como condição principal (backend processa array completo via trigger_config)
      return {
        campo: regras[0].campo || '',
        operador: (regras[0].operador as Condicao['operador']) || 'igual',
        valor: regras[0].valor,
      }
    }
    return {
      campo: (n.data.campo as string) || '',
      operador: (n.data.operador as Condicao['operador']) || 'igual',
      valor: n.data.valor,
    }
  })

  const acoes: Acao[] = [
    ...acaoNodes.map(n => ({
      tipo: (n.data.tipo as string) || '',
      config: (n.data.config as Record<string, unknown>) || {},
    })),
    ...delayNodes.map(n => ({
      tipo: 'aguardar',
      config: {
        duracao: n.data.duracao,
        unidade: n.data.unidade || 'minutos',
        modo_delay: n.data.modo_delay || 'relativo',
        data_agendada: n.data.data_agendada,
        hora_agendada: n.data.hora_agendada,
        // Converter para minutos para compatibilidade com o motor
        minutos: n.data.modo_delay === 'agendado'
          ? undefined
          : calcularMinutos(n.data.duracao as number, (n.data.unidade as string) || 'minutos'),
      },
    })),
    // AIDEV-NOTE: Nós de validação são serializados como ações especiais para persistência
    ...validacaoNodes.map(n => ({
      tipo: 'validacao',
      config: {
        condicoes: n.data.condicoes || [],
      },
    })),
  ]

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
