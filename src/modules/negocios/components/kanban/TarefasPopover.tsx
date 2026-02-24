/**
 * AIDEV-NOTE: Popover de tarefas pendentes no card do Kanban
 * Conforme PRD-07 RF-15.5
 * Usa React Portal para renderizar fora do card (evita corte por overflow)
 * Exibe tarefas pendentes com checkbox para concluir inline
 * Sempre visível quando configurado, mesmo sem tarefas
 * Suporta envio inline para tarefas de cadência comercial
 */

import { useState, useRef, useEffect, useCallback, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckSquare, Square, Loader2, ClipboardList, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { TarefaEnvioInline } from './TarefaEnvioInline'

interface Tarefa {
  id: string
  titulo: string
  status: string
  tipo: string
  data_vencimento?: string | null
  etapa_origem_id?: string | null
  etapa_nome?: string | null
  modo?: string
  assunto_email?: string | null
  corpo_mensagem?: string | null
  audio_url?: string | null
  oportunidade_id?: string | null
  contato_id?: string | null
  organizacao_id?: string
}

interface TarefasPopoverProps {
  oportunidadeId: string
  totalPendentes: number
  totalTarefas: number
  totalConcluidas: number
}

export const TarefasPopover = forwardRef<HTMLDivElement, TarefasPopoverProps>(function TarefasPopover({ oportunidadeId, totalPendentes, totalTarefas, totalConcluidas }, _ref) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(false)
  const [concluindo, setConcluindo] = useState<string | null>(null)
  const [envioAberto, setEnvioAberto] = useState<string | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popoverWidth = envioAberto ? 320 : 260
    const popoverEl = popoverRef.current
    const popoverHeight = popoverEl ? popoverEl.offsetHeight : 200

    let left = rect.right - popoverWidth
    if (left < 8) left = rect.left
    if (left + popoverWidth > window.innerWidth - 8) left = window.innerWidth - popoverWidth - 8

    let top: number
    if (rect.bottom + 6 + popoverHeight > window.innerHeight - 8) {
      top = rect.top - 6 - popoverHeight
      if (top < 8) top = 8
    } else {
      top = rect.bottom + 6
    }

    setPopoverPos({ top, left })
  }, [envioAberto])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return
      const popover = document.getElementById(`tarefas-popover-${oportunidadeId}`)
      if (popover?.contains(e.target as Node)) return
      setOpen(false)
      setEnvioAberto(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, oportunidadeId])

  useEffect(() => {
    if (!open) return
    updatePosition()
    // Re-calc after content renders
    const raf = requestAnimationFrame(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    setLoading(true)

    const loadTarefas = async () => {
      try {
        const { data, error } = await supabase
          .from('tarefas')
          .select('id, titulo, status, tipo, data_vencimento, etapa_origem_id, oportunidade_id, contato_id, organizacao_id, modo, assunto_email, corpo_mensagem, audio_url')
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
        queryClient.invalidateQueries({ queryKey: ['kanban'] })
      }
    } catch (err) {
      console.error('Erro ao concluir tarefa:', err)
    } finally {
      setConcluindo(null)
    }
  }

  const isCadencia = (t: Tarefa) => t.modo === 'cadencia' && (t.tipo === 'email' || t.tipo === 'whatsapp')

  const pendentes = tarefas.filter(t => t.status !== 'concluida' && t.status !== 'cancelada')
  const concluidas = tarefas.filter(t => t.status === 'concluida')

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
    if (open) setEnvioAberto(null)
  }

  const allDone = totalTarefas === 0 || totalPendentes === 0
  const popoverWidth = envioAberto ? 320 : 260

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
        <CheckSquare className="w-3.5 h-3.5" />
        <span>{totalConcluidas}/{totalTarefas}</span>
      </button>

      {/* Popover via Portal */}
      {open && createPortal(
        <div
          ref={popoverRef}
          id={`tarefas-popover-${oportunidadeId}`}
          className="bg-card border border-border rounded-lg shadow-lg animate-enter"
          style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            width: popoverWidth,
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
            <div className="max-h-[400px] overflow-y-auto">
              {/* Pendentes agrupados por etapa */}
              {gruposEtapa.map(([etapaKey, grupo], idx) => (
                <div key={etapaKey}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 ${idx > 0 ? 'border-t border-border' : ''}`}>
                    <ClipboardList className="w-3 h-3" />
                    <span>{grupo.nome}</span>
                  </div>
                  {grupo.tarefas.map(tarefa => (
                    <div key={tarefa.id}>
                      <div className="flex items-start gap-2 px-3 py-2 hover:bg-accent/50 transition-all duration-200">
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
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-foreground leading-tight flex-1">{tarefa.titulo}</p>
                            {isCadencia(tarefa) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setEnvioAberto(envioAberto === tarefa.id ? null : tarefa.id) }}
                                className={`flex-shrink-0 p-1 rounded transition-all duration-200 ${
                                  envioAberto === tarefa.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                                }`}
                                title="Enviar mensagem"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isCadencia(tarefa) && (
                              <span className="text-[9px] font-medium text-primary bg-primary/10 px-1 py-0.5 rounded">Cadência</span>
                            )}
                            {tarefa.data_vencimento && (
                              <p className="text-[10px] text-muted-foreground">
                                Prazo: {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Envio inline expandido */}
                      {envioAberto === tarefa.id && (
                        <TarefaEnvioInline
                          tarefa={tarefa}
                          onEnviado={() => {
                            setEnvioAberto(null)
                            setTarefas(prev => prev.map(t =>
                              t.id === tarefa.id ? { ...t, status: 'concluida' } : t
                            ))
                          }}
                          onCancelar={() => setEnvioAberto(null)}
                        />
                      )}
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
})
TarefasPopover.displayName = 'TarefasPopover'