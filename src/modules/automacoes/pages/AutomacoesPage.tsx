/**
 * AIDEV-NOTE: Página principal de Automações - Builder Visual (PRD-12)
 * Layout: Sidebar lateral + Canvas React Flow + Painel de config
 * Rota: /app/automacoes (acesso direto pelo header)
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useAuth } from '@/providers/AuthProvider'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { useAutomacoes, useToggleAutomacao, useCriarAutomacao, useAtualizarAutomacao, useExcluirAutomacao } from '../hooks/useAutomacoes'
import { AutomacaoSidebar } from '../components/AutomacaoSidebar'
import { FlowCanvas } from '../components/FlowCanvas'
import { NodeConfigPanel } from '../components/panels/NodeConfigPanel'
import { useFlowState } from '../hooks/useFlowState'
import { automacaoToFlow, flowToAutomacao } from '../utils/flowConverter'
import { toast } from 'sonner'
import { Zap } from 'lucide-react'

export function AutomacoesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useAppToolbar()

  const { data: automacoes, isLoading } = useAutomacoes()
  const toggleMutation = useToggleAutomacao()
  const criarMutation = useCriarAutomacao()
  const atualizarMutation = useAtualizarAutomacao()
  const excluirMutation = useExcluirAutomacao()

  const [selectedAutoId, setSelectedAutoId] = useState<string | undefined>()

  const {
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
    selectedNodeId: _selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    addNodeFromSource,
  } = useFlowState()

  // AIDEV-NOTE: Auto-save com debounce — persiste no banco automaticamente
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes
  const edgesRef = useRef(edges)
  edgesRef.current = edges
  const initialLoadRef = useRef(true)

  useEffect(() => {
    if (!selectedAutoId) return
    if (nodes.length < 1) return
    // Pular o primeiro render após carregar automação (evita salvar estado que acabou de carregar)
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      return
    }

    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const payload = flowToAutomacao(nodesRef.current, edgesRef.current)
      atualizarMutation.mutate({ id: selectedAutoId, payload, silent: true })
    }, 1000)

    return () => clearTimeout(saveTimerRef.current)
  }, [nodes, edges, selectedAutoId])

  // Set toolbar
  useEffect(() => {
    setSubtitle(
      <span className="text-xs text-muted-foreground hidden sm:inline">
        Editor visual de fluxos de automação
      </span>
    )
    setActions(null)
    return () => { setActions(null); setSubtitle(null) }
  }, [setActions, setSubtitle])

  // Load automacao into canvas when selected
  const handleSelectAutomacao = useCallback((id: string) => {
    setSelectedAutoId(id)
    setSelectedNodeId(null)
    initialLoadRef.current = true
    const auto = automacoes?.find(a => a.id === id)
    if (auto) {
      const { nodes: flowNodes, edges: flowEdges } = automacaoToFlow(auto)
      setNodes(flowNodes)
      setEdges(flowEdges)
    }
  }, [automacoes, setNodes, setEdges, setSelectedNodeId])

  // New automacao
  const handleNewAutomacao = useCallback(() => {
    if (!isAdmin) return
    criarMutation.mutate({
      nome: `Automação ${(automacoes?.length || 0) + 1}`,
      trigger_tipo: 'oportunidade_criada',
      trigger_config: {},
      condicoes: [],
      acoes: [{ tipo: 'criar_notificacao', config: {} }],
    }, {
      onSuccess: (data) => {
        initialLoadRef.current = true
        setSelectedAutoId(data.id)
        const { nodes: flowNodes, edges: flowEdges } = automacaoToFlow(data)
        setNodes(flowNodes)
        setEdges(flowEdges)
      },
    })
  }, [isAdmin, automacoes, criarMutation, setNodes, setEdges])

  // Save flow back to DB
  // AIDEV-NOTE: Save manual removido — auto-save com debounce ativo

  // Rename automacao
  const handleRename = useCallback((id: string, nome: string) => {
    atualizarMutation.mutate({ id, payload: { nome } })
  }, [atualizarMutation])

  // Delete automacao
  const handleDeleteAutomacao = useCallback((id: string) => {
    excluirMutation.mutate(id, {
      onSuccess: () => {
        if (selectedAutoId === id) {
          setSelectedAutoId(undefined)
          setNodes([])
          setEdges([])
        }
      },
    })
  }, [excluirMutation, selectedAutoId, setNodes, setEdges])

  // Delete edge
  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges(eds => eds.filter(e => e.id !== edgeId))
  }, [setEdges])

  // Handle add node
  const handleAddNode = useCallback((type: 'acao' | 'condicao' | 'delay' | 'validacao', position?: { x: number; y: number }) => {
    addNode(type, position)
  }, [addNode])

  // Empty state when no automacao selected
  const showEmptyCanvas = !selectedAutoId

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <AutomacaoSidebar
        automacoes={automacoes || []}
        isLoading={isLoading}
        selectedId={selectedAutoId}
        onSelect={handleSelectAutomacao}
        onNew={handleNewAutomacao}
        onToggle={(id, ativo) => toggleMutation.mutate({ id, ativo })}
        onRename={handleRename}
        onDelete={handleDeleteAutomacao}
        isAdmin={isAdmin}
      />

      {/* Canvas area */}
      <div className="flex-1 relative bg-muted/30">
        {showEmptyCanvas ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Editor de Automações</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Selecione uma automação na lista lateral ou crie uma nova para começar a montar seu fluxo visual.
            </p>
          </div>
        ) : (
          <ReactFlowProvider>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={setSelectedNodeId}
              onAddNode={handleAddNode}
              onAddNodeFromSource={addNodeFromSource}
              onDeleteEdge={handleDeleteEdge}
              onDeleteNode={deleteNode}
            />
          </ReactFlowProvider>
        )}
      </div>

      {/* Config panel */}
      {selectedNode && (
        <NodeConfigPanel
          key={selectedNode.id}
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={updateNodeData}
          onDelete={deleteNode}
        />
      )}
    </div>
  )
}
