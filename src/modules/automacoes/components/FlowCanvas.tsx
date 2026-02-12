/**
 * AIDEV-NOTE: Wrapper do ReactFlow com configuração de canvas
 * Grid de fundo, minimap, controles, nós customizados e edges com botão X
 */

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Node,
  type Edge,
  type EdgeProps,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
  type EdgeTypes,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { TriggerNode } from './nodes/TriggerNode'
import { CondicaoNode } from './nodes/CondicaoNode'
import { AcaoNode } from './nodes/AcaoNode'
import { DelayNode } from './nodes/DelayNode'
import { ValidacaoNode } from './nodes/ValidacaoNode'
import { AddNodeMenu } from './AddNodeMenu'
import { Plus, X } from 'lucide-react'

// AIDEV-NOTE: Edge customizada com botão X no hover
function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const onDeleteClick = data?.onDelete as ((edgeId: string) => void) | undefined

  return (
    <>
      {/* Invisible wider path for hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={30}
        className="react-flow__edge-interaction"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            onClick={() => onDeleteClick?.(id)}
            style={{ opacity: hovered ? 1 : 0, transition: 'opacity 200ms, background-color 200ms, border-color 200ms, color 200ms' }}
            className="w-5 h-5 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-destructive hover:border-destructive hover:text-white text-muted-foreground"
            title="Desconectar"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

interface FlowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  onNodeClick: (nodeId: string) => void
  onAddNode: (type: 'acao' | 'condicao' | 'delay' | 'validacao', position?: { x: number; y: number }) => void
  onAddNodeFromSource: (type: 'acao' | 'condicao' | 'delay' | 'validacao', sourceNodeId: string, sourceHandle?: string) => void
  onDeleteEdge: (edgeId: string) => void
  onDeleteNode: (nodeId: string) => void
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
  onDeleteEdge,
  onDeleteNode,
}: FlowCanvasProps) {
  const [addMenu, setAddMenu] = useState<{ x: number; y: number } | null>(null)

  const nodeTypes: NodeTypes = useMemo(() => ({
    trigger: TriggerNode,
    condicao: CondicaoNode,
    acao: AcaoNode,
    delay: DelayNode,
    validacao: ValidacaoNode,
  }), [])

  const edgeTypes: EdgeTypes = useMemo(() => ({
    deletable: DeletableEdge,
  }), [])

  // Inject callbacks into node data
  const nodesWithCallbacks = useMemo(() =>
    nodes.map(n => ({
      ...n,
      data: { ...n.data, onAddNode: onAddNodeFromSource, onDeleteNode },
    })),
    [nodes, onAddNodeFromSource, onDeleteNode]
  )

  // Inject onDelete callback into edge data and set type
  const edgesWithCallbacks = useMemo(() =>
    edges.map(e => ({
      ...e,
      type: 'deletable',
      data: { ...e.data, onDelete: onDeleteEdge },
    })),
    [edges, onDeleteEdge]
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
        edges={edgesWithCallbacks}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onContextMenu={handleContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setAddMenu({ x: rect.left - 260, y: rect.bottom + 8 - 80 })
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
