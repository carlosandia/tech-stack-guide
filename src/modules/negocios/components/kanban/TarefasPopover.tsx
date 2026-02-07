/**
 * AIDEV-NOTE: Popover de tarefas pendentes no card do Kanban
 * Conforme PRD-07 RF-15.5
 * Usa React Portal para renderizar fora do card (evita corte por overflow)
 * Exibe tarefas pendentes com checkbox para concluir inline
 * Sempre visível quando configurado, mesmo sem tarefas
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CheckSquare, Square, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Tarefa {
  id: string
  titulo: string
  status: string
  tipo: string
  data_vencimento?: string | null
  etapa_origem_id?: string | null
  etapa_nome?: string | null
}

interface TarefasPopoverProps {
  oportunidadeId: string
  totalPendentes: number
  totalTarefas: number
  totalConcluidas: number
}

export function TarefasPopover({ oportunidadeId, totalPendentes, totalTarefas, totalConcluidas }: TarefasPopoverProps) {
  const [open, setOpen] = useState(false)
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(false)
  const [concluindo, setConcluindo] = useState<string | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Calcula posição do popover relativa ao trigger — sempre abaixo do badge
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popoverWidth = 260

    // Abrir abaixo do badge
    let top = rect.bottom + 6
    let left = rect.right - popoverWidth

    // Se sair pela esquerda, alinhar ao left do trigger
    if (left < 8) {
      left = rect.left
    }
    // Se sair pela direita
    if (left + popoverWidth > window.innerWidth - 8) {
      left = window.innerWidth - popoverWidth - 8
    }

    setPopoverPos({ top, left })
  }, [])

  // Click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return
      // Check if click is inside the portal popover
      const popover = document.getElementById(`tarefas-popover-${oportunidadeId}`)
      if (popover?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, oportunidadeId])

  // Update position on scroll/resize
  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  // Load tarefas on open
  useEffect(() => {
    if (!open) return
    setLoading(true)

    const loadTarefas = async () => {
      try {
        const { data, error } = await supabase
          .from('tarefas')
          .select('id, titulo, status, tipo, data_vencimento, etapa_origem_id')
          .eq('oportunidade_id', oportunidadeId)
          .is('deletado_em', null)
          .order('criado_em', { ascending: true })
          .limit(20)

        if (error) {
          console.error('Erro ao carregar tarefas:', error)
          setTarefas([])
          return
        }

        const tarefasRaw = (data || []) as Tarefa[]

        // Buscar nomes das etapas de origem
        const etapaIds = [...new Set(tarefasRaw.filter(t => t.etapa_origem_id).map(t => t.etapa_origem_id!))]
        let etapasMap: Record<string, string> = {}

        if (etapaIds.length > 0) {
          const { data: etapas } = await supabase
            .from('etapas_funil')
            .select('id, nome')
            .in('id', etapaIds)

          if (etapas) {
            for (const e of etapas) {
              etapasMap[e.id] = e.nome
            }
          }
        }

        // Enriquecer tarefas com nome da etapa
        const tarefasEnriquecidas = tarefasRaw.map(t => ({
          ...t,
          etapa_nome: t.etapa_origem_id ? etapasMap[t.etapa_origem_id] || null : null,
        }))

        setTarefas(tarefasEnriquecidas)
      } finally {
        setLoading(false)
      }
    }

    loadTarefas()
  }, [open, oportunidadeId])

  const handleToggleConcluir = async (e: React.MouseEvent, tarefa: Tarefa) => {
    e.stopPropagation()
    setConcluindo(tarefa.id)

    try {
      const novoStatus = tarefa.status === 'concluida' ? 'pendente' : 'concluida'
      const { error } = await supabase
        .from('tarefas')
        .update({
          status: novoStatus,
          data_conclusao: novoStatus === 'concluida' ? new Date().toISOString() : null,
        } as any)
        .eq('id', tarefa.id)

      if (!error) {
        setTarefas(prev => prev.map(t =>
          t.id === tarefa.id ? { ...t, status: novoStatus } : t
        ))
      }
    } catch (err) {
      console.error('Erro ao concluir tarefa:', err)
    } finally {
      setConcluindo(null)
    }
  }

  const pendentes = tarefas.filter(t => t.status !== 'concluida' && t.status !== 'cancelada')
  const concluidas = tarefas.filter(t => t.status === 'concluida')

  // Agrupar pendentes por etapa de origem
  const pendentesAgrupados = pendentes.reduce<Record<string, { nome: string; tarefas: Tarefa[] }>>((acc, t) => {
    const key = t.etapa_origem_id || '_sem_etapa'
    const nome = t.etapa_nome || 'Sem etapa'
    if (!acc[key]) acc[key] = { nome, tarefas: [] }
    acc[key].tarefas.push(t)
    return acc
  }, {})
  const gruposEtapa = Object.entries(pendentesAgrupados)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(!open)
  }

  const allDone = totalTarefas === 0 || totalPendentes === 0

  return (
    <>
      {/* Badge trigger */}
      <button
        ref={triggerRef}
        onClick={handleClick}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all duration-200 ${
          allDone
            ? 'bg-success-muted text-success-foreground hover:bg-success-muted/80'
            : 'bg-warning/10 text-warning-foreground hover:bg-warning/20'
        }`}
        title={`${totalConcluidas}/${totalTarefas} tarefa(s) concluída(s)`}
      >
        <CheckSquare className="w-3 h-3" />
        <span>{totalConcluidas}/{totalTarefas}</span>
      </button>

      {/* Popover via Portal */}
      {open && createPortal(
        <div
          id={`tarefas-popover-${oportunidadeId}`}
          className="w-[260px] bg-card border border-border rounded-lg shadow-lg animate-enter"
          style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            zIndex: 600,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground">
              Tarefas ({pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : tarefas.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              Nenhuma tarefa cadastrada
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {/* Pendentes agrupados por etapa */}
              {gruposEtapa.map(([etapaKey, grupo], idx) => (
                <div key={etapaKey}>
                  {/* Separador de etapa */}
                  <div className={`px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 ${idx > 0 ? 'border-t border-border' : ''}`}>
                    📋 {grupo.nome}
                  </div>
                  {grupo.tarefas.map(tarefa => (
                    <div
                      key={tarefa.id}
                      className="flex items-start gap-2 px-3 py-2 hover:bg-accent/50 transition-all duration-200"
                    >
                      <button
                        onClick={(e) => handleToggleConcluir(e, tarefa)}
                        disabled={concluindo === tarefa.id}
                        className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-all duration-200"
                      >
                        {concluindo === tarefa.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-foreground leading-tight">{tarefa.titulo}</p>
                        {tarefa.data_vencimento && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Prazo: {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Concluídas */}
              {concluidas.length > 0 && (
                <>
                  <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-t border-border mt-1">
                    Concluídas ({concluidas.length})
                  </div>
                  {concluidas.map(tarefa => (
                    <div
                      key={tarefa.id}
                      className="flex items-start gap-2 px-3 py-1.5 opacity-50"
                    >
                      <button
                        onClick={(e) => handleToggleConcluir(e, tarefa)}
                        disabled={concluindo === tarefa.id}
                        className="mt-0.5 flex-shrink-0 text-success"
                      >
                        {concluindo === tarefa.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckSquare className="w-4 h-4" />
                        )}
                      </button>
                      <p className="text-xs text-muted-foreground leading-tight line-through">
                        {tarefa.titulo}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
