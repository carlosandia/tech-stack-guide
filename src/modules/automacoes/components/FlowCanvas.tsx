/**
 * AIDEV-NOTE: Wrapper do ReactFlow com configuração de canvas
 * Grid de fundo, minimap, controles e nós customizados
 */

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { TriggerNode } from './nodes/TriggerNode'
import { CondicaoNode } from './nodes/CondicaoNode'
import { AcaoNode } from './nodes/AcaoNode'
import { DelayNode } from './nodes/DelayNode'
import { ValidacaoNode } from './nodes/ValidacaoNode'
import { AddNodeMenu } from './AddNodeMenu'
import { Plus, Save, Loader2 } from 'lucide-react'

interface FlowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  onNodeClick: (nodeId: string) => void
  onAddNode: (type: 'acao' | 'condicao' | 'delay' | 'validacao', position?: { x: number; y: number }) => void
  onAddNodeFromSource: (type: 'acao' | 'condicao' | 'delay' | 'validacao', sourceNodeId: string, sourceHandle?: string) => void
  onSave: () => void
  isSaving?: boolean
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onAddNode,
  onAddNodeFromSource,
  onSave,
  isSaving,
}: FlowCanvasProps) {
  const [addMenu, setAddMenu] = useState<{ x: number; y: number } | null>(null)

  const nodeTypes: NodeTypes = useMemo(() => ({
    trigger: TriggerNode,
    condicao: CondicaoNode,
    acao: AcaoNode,
    delay: DelayNode,
    validacao: ValidacaoNode,
  }), [])

  // Inject onAddNode callback into all node data
  const nodesWithCallbacks = useMemo(() =>
    nodes.map(n => ({
      ...n,
      data: { ...n.data, onAddNode: onAddNodeFromSource },
    })),
    [nodes, onAddNodeFromSource]
  )

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id)
  }, [onNodeClick])

  const handlePaneClick = useCallback(() => {
    setAddMenu(null)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setAddMenu({ x: e.clientX - 260, y: e.clientY - 80 })
  }, [])

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onContextMenu={handleContextMenu}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode={['Backspace', 'Delete']}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: 'hsl(var(--border))', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
        <Controls
          showInteractive={false}
          className="!bg-white !border-border !shadow-sm !rounded-lg"
        />
        <MiniMap
          className="!bg-white !border-border !shadow-sm !rounded-lg"
          nodeColor={(n) => {
            if (n.type === 'trigger') return 'hsl(221.2 83.2% 53.3%)'
            if (n.type === 'condicao') return '#eab308'
            if (n.type === 'acao') return '#22c55e'
            if (n.type === 'delay') return '#60a5fa'
            if (n.type === 'validacao') return '#8b5cf6'
            return '#94a3b8'
          }}
          maskColor="rgba(0,0,0,0.08)"
        />

        {/* Toolbar do canvas */}
        <Panel position="top-right" className="flex items-center gap-2">
          <button
            onClick={() => {
              setAddMenu({ x: 310, y: 10 })
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-lg shadow-sm text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </Panel>
      </ReactFlow>

      {addMenu && (
        <AddNodeMenu
          position={addMenu}
          onAdd={(type) => onAddNode(type, { x: 250, y: nodes.reduce((max, n) => Math.max(max, n.position.y), 0) + 150 })}
          onClose={() => setAddMenu(null)}
        />
      )}
    </div>
  )
}
