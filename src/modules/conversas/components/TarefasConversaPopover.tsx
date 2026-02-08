/**
 * AIDEV-NOTE: Popover de tarefas do contato no header do chat
 * Lista tarefas pendentes vinculadas ao contato da conversa
 * Permite concluir tarefas diretamente
 * Usa React Portal para evitar problemas de z-index
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ListTodo, Check, Loader2, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Tarefa {
  id: string
  titulo: string
  tipo: string
  prioridade: string
  status: string
  data_vencimento: string | null
  criado_em: string
}

interface TarefasConversaPopoverProps {
  contatoId: string
}

const prioridadeCor: Record<string, string> = {
  urgente: 'text-destructive',
  alta: 'text-warning-foreground',
  media: 'text-foreground',
  baixa: 'text-muted-foreground',
}

export function TarefasConversaPopover({ contatoId }: TarefasConversaPopoverProps) {
  const [open, setOpen] = useState(false)
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(false)
  const [concluindo, setConcluindo] = useState<string | null>(null)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const calcPos = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    })
  }, [])

  const carregarTarefas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tarefas')
        .select('id, titulo, tipo, prioridade, status, data_vencimento, criado_em')
        .eq('contato_id', contatoId)
        .in('status', ['pendente', 'em_andamento'])
        .is('deletado_em', null)
        .order('data_vencimento', { ascending: true, nullsFirst: false })
        .limit(20)

      if (error) throw error
      setTarefas((data || []) as Tarefa[])
    } catch {
      setTarefas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      carregarTarefas()
      calcPos()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contatoId])

  // Recalcular posição ao redimensionar
  useEffect(() => {
    if (!open) return
    const handler = () => calcPos()
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [open, calcPos])

  const concluirTarefa = async (tarefaId: string) => {
    setConcluindo(tarefaId)
    try {
      const { error } = await supabase
        .from('tarefas')
        .update({
          status: 'concluida',
          data_conclusao: new Date().toISOString(),
        })
        .eq('id', tarefaId)

      if (error) throw error
      toast.success('Tarefa concluída!')
      setTarefas(prev => prev.filter(t => t.id !== tarefaId))
    } catch {
      toast.error('Erro ao concluir tarefa')
    } finally {
      setConcluindo(null)
    }
  }

  const totalPendentes = tarefas.length

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent transition-all duration-200 relative"
        title="Tarefas do contato"
      >
        <ListTodo className="w-4 h-4 text-muted-foreground" />
        {totalPendentes > 0 && !open && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalPendentes > 9 ? '9+' : totalPendentes}
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 590 }} onClick={() => setOpen(false)} />
          <div
            className="fixed w-80 rounded-lg shadow-lg overflow-hidden border border-border"
            style={{
              zIndex: 600,
              top: pos.top,
              right: pos.right,
              backgroundColor: 'hsl(var(--card))',
            }}
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-border" style={{ backgroundColor: 'hsl(var(--muted))' }}>
              <p className="text-sm font-semibold text-foreground">Tarefas do Contato</p>
              <p className="text-[11px] text-muted-foreground">
                {totalPendentes} pendente{totalPendentes !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Lista */}
            <div className="max-h-[320px] overflow-y-auto" style={{ backgroundColor: 'hsl(var(--card))' }}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : tarefas.length === 0 ? (
                <div className="py-8 text-center">
                  <ListTodo className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente</p>
                </div>
              ) : (
                tarefas.map((tarefa) => {
                  const vencida = tarefa.data_vencimento && isPast(new Date(tarefa.data_vencimento))
                  return (
                    <div
                      key={tarefa.id}
                      className="flex items-start gap-2.5 px-3 py-2.5 border-b border-border/50 last:border-b-0 hover:bg-accent/50 transition-colors"
                    >
                      {/* Botão concluir */}
                      <button
                        onClick={() => concluirTarefa(tarefa.id)}
                        disabled={!!concluindo}
                        className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 border-border hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
                        title="Concluir tarefa"
                      >
                        {concluindo === tarefa.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        ) : (
                          <Check className="w-3 h-3 text-transparent group-hover:text-primary" />
                        )}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${prioridadeCor[tarefa.prioridade] || 'text-foreground'}`}>
                          {tarefa.titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground capitalize">{tarefa.tipo}</span>
                          {tarefa.data_vencimento && (
                            <span className={`flex items-center gap-0.5 text-[11px] ${vencida ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              {vencida ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {format(new Date(tarefa.data_vencimento), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
