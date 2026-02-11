/**
 * AIDEV-NOTE: Hook para gerenciar estado de nós/edges no canvas React Flow
 */

import { useCallback, useState } from 'react'
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type OnConnect,
} from '@xyflow/react'

export function useFlowState(initialNodes: Node[] = [], initialEdges: Edge[] = []) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  )

  const addNode = useCallback((type: 'acao' | 'condicao' | 'delay', position?: { x: number; y: number }) => {
    const id = `${type}-${Date.now()}`
    const pos = position || { x: 250, y: nodes.length * 150 + 100 }

    const newNode: Node = {
      id,
      type,
      position: pos,
      data: {},
    }

    setNodes(nds => [...nds, newNode])

    // Auto-connect to last node if possible
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1]
      setEdges(eds => addEdge({
        id: `e-${lastNode.id}-${id}`,
        source: lastNode.id,
        target: id,
        animated: true,
      }, eds))
    }

    return id
  }, [nodes, setNodes, setEdges])

  const updateNodeData = useCallback((nodeId: string, data: Record<string, unknown>) => {
    setNodes(nds => nds.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
    ))
  }, [setNodes])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId))
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
    if (selectedNodeId === nodeId) setSelectedNodeId(null)
  }, [setNodes, setEdges, selectedNodeId])

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
    deleteNode,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
  }
}
