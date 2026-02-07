/**
 * AIDEV-NOTE: Aba Agenda/Reuniões (RF-14.3 Tab 5) - Implementação completa
 * CRUD reuniões, status (Agendada/Realizada/No-Show/Cancelada/Reagendada)
 * Modal No-Show com motivos
 */

import { useState, useCallback } from 'react'
import {
  Calendar, Plus, MapPin, Clock, CheckCircle2, XCircle,
  AlertTriangle, RotateCcw, Trash2, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  useReunioesOportunidade,
  useCriarReuniao,
  useAtualizarStatusReuniao,
  useExcluirReuniao,
  useMotivosNoShow,
} from '../../hooks/useDetalhes'
import type { Reuniao } from '../../services/detalhes.api'

interface AbaAgendaProps {
  oportunidadeId: string
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Calendar; class: string; bgClass: string }> = {
  agendada: { label: 'Agendada', icon: Calendar, class: 'text-blue-600', bgClass: 'bg-blue-50' },
  realizada: { label: 'Realizada', icon: CheckCircle2, class: 'text-emerald-600', bgClass: 'bg-emerald-50' },
  noshow: { label: 'No-Show', icon: AlertTriangle, class: 'text-amber-600', bgClass: 'bg-amber-50' },
  cancelada: { label: 'Cancelada', icon: XCircle, class: 'text-destructive', bgClass: 'bg-red-50' },
  reagendada: { label: 'Reagendada', icon: RotateCcw, class: 'text-purple-600', bgClass: 'bg-purple-50' },
}

export function AbaAgenda({ oportunidadeId }: AbaAgendaProps) {
  const { data: reunioes, isLoading } = useReunioesOportunidade(oportunidadeId)
  const criarReuniao = useCriarReuniao()
  const atualizarStatus = useAtualizarStatusReuniao()
  const excluirReuniao = useExcluirReuniao()

  const [showForm, setShowForm] = useState(false)
  const [showNoShowModal, setShowNoShowModal] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: '', descricao: '', local: '', data_inicio: '', hora_inicio: '', data_fim: '', hora_fim: '',
  })

  const handleCriar = useCallback(async () => {
    if (!formData.titulo.trim() || !formData.data_inicio || !formData.hora_inicio) {
      toast.error('Preencha título, data e hora')
      return
    }
    try {
      const dataInicio = `${formData.data_inicio}T${formData.hora_inicio}:00`
      const dataFim = formData.data_fim && formData.hora_fim
        ? `${formData.data_fim}T${formData.hora_fim}:00`
        : undefined

      await criarReuniao.mutateAsync({
        oportunidadeId,
        payload: {
          titulo: formData.titulo.trim(),
          descricao: formData.descricao || undefined,
          local: formData.local || undefined,
          data_inicio: dataInicio,
          data_fim: dataFim,
        },
      })
      setFormData({ titulo: '', descricao: '', local: '', data_inicio: '', hora_inicio: '', data_fim: '', hora_fim: '' })
      setShowForm(false)
      toast.success('Reunião agendada')
    } catch {
      toast.error('Erro ao criar reunião')
    }
  }, [formData, oportunidadeId, criarReuniao])

  const handleMudarStatus = useCallback(async (reuniaoId: string, status: string) => {
    if (status === 'noshow') {
      setShowNoShowModal(reuniaoId)
      return
    }
    try {
      await atualizarStatus.mutateAsync({ reuniaoId, status })
      toast.success(`Reunião marcada como ${STATUS_CONFIG[status]?.label || status}`)
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }, [atualizarStatus])

  const handleExcluir = useCallback(async (reuniaoId: string) => {
    try {
      await excluirReuniao.mutateAsync(reuniaoId)
      toast.success('Reunião excluída')
    } catch {
      toast.error('Erro ao excluir reunião')
    }
  }, [excluirReuniao])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Reuniões ({reunioes?.length || 0})
        </p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova reunião
        </button>
      </div>

      {/* Form nova reunião */}
      {showForm && (
        <div className="p-3 border border-border rounded-lg space-y-2 bg-muted/30">
          <input
            type="text"
            value={formData.titulo}
            onChange={e => setFormData(p => ({ ...p, titulo: e.target.value }))}
            placeholder="Título da reunião"
            className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={formData.data_inicio}
              onChange={e => setFormData(p => ({ ...p, data_inicio: e.target.value }))}
              className="flex-1 text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="time"
              value={formData.hora_inicio}
              onChange={e => setFormData(p => ({ ...p, hora_inicio: e.target.value }))}
              className="w-24 text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={formData.data_fim}
              onChange={e => setFormData(p => ({ ...p, data_fim: e.target.value }))}
              placeholder="Fim (opcional)"
              className="flex-1 text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="time"
              value={formData.hora_fim}
              onChange={e => setFormData(p => ({ ...p, hora_fim: e.target.value }))}
              className="w-24 text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <input
            type="text"
            value={formData.local}
            onChange={e => setFormData(p => ({ ...p, local: e.target.value }))}
            placeholder="Local / Link (opcional)"
            className="w-full text-xs bg-background border border-input rounded-md px-3 py-1.5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={formData.descricao}
            onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full text-xs bg-background border border-input rounded-md px-3 py-1.5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            <button
              type="button" onClick={handleCriar}
              disabled={!formData.titulo.trim() || !formData.data_inicio || !formData.hora_inicio || criarReuniao.isPending}
              className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >{criarReuniao.isPending ? 'Agendando...' : 'Agendar'}</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {(!reunioes || reunioes.length === 0) ? (
        <div className="text-center py-4">
          <Calendar className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground">Nenhuma reunião agendada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reunioes.map(reuniao => (
            <ReuniaoItem
              key={reuniao.id}
              reuniao={reuniao}
              onMudarStatus={handleMudarStatus}
              onExcluir={handleExcluir}
            />
          ))}
        </div>
      )}

      {/* Modal No-Show */}
      {showNoShowModal && (
        <NoShowModal
          reuniaoId={showNoShowModal}
          onClose={() => setShowNoShowModal(null)}
        />
      )}
    </div>
  )
}

function ReuniaoItem({ reuniao, onMudarStatus, onExcluir }: {
  reuniao: Reuniao
  onMudarStatus: (id: string, status: string) => void
  onExcluir: (id: string) => void
}) {
  const config = STATUS_CONFIG[reuniao.status] || STATUS_CONFIG.agendada
  const StatusIcon = config.icon
  const passada = isPast(parseISO(reuniao.data_inicio))
  const isAgendada = reuniao.status === 'agendada'

  return (
    <div className="group border border-border rounded-md p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded-md ${config.bgClass}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${config.class}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{reuniao.titulo}</p>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {format(parseISO(reuniao.data_inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </span>
            {reuniao.local && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {reuniao.local}
              </span>
            )}
            <span className={`px-1.5 py-0.5 rounded-full font-medium ${config.class} ${config.bgClass}`}>
              {config.label}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onExcluir(reuniao.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ações de status (só para reuniões agendadas) */}
      {isAgendada && (
        <div className="flex gap-1.5 pt-1 border-t border-border">
          <button
            type="button"
            onClick={() => onMudarStatus(reuniao.id, 'realizada')}
            className="text-[10px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            ✓ Realizada
          </button>
          <button
            type="button"
            onClick={() => onMudarStatus(reuniao.id, 'noshow')}
            className="text-[10px] px-2 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
          >
            ⚠ No-Show
          </button>
          <button
            type="button"
            onClick={() => onMudarStatus(reuniao.id, 'cancelada')}
            className="text-[10px] px-2 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          >
            ✗ Cancelada
          </button>
          {passada && (
            <button
              type="button"
              onClick={() => onMudarStatus(reuniao.id, 'reagendada')}
              className="text-[10px] px-2 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
            >
              ↻ Reagendar
            </button>
          )}
        </div>
      )}

      {/* Motivo do no-show */}
      {reuniao.status === 'noshow' && reuniao.motivo_noshow && (
        <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
          Motivo: {reuniao.motivo_noshow}
        </p>
      )}
    </div>
  )
}

function NoShowModal({ reuniaoId, onClose }: { reuniaoId: string; onClose: () => void }) {
  const { data: motivos, isLoading } = useMotivosNoShow()
  const atualizarStatus = useAtualizarStatusReuniao()
  const [motivoSelecionado, setMotivoSelecionado] = useState('')
  const [motivoTexto, setMotivoTexto] = useState('')

  const handleConfirmar = useCallback(async () => {
    const textoFinal = motivoSelecionado || motivoTexto.trim()
    if (!textoFinal) {
      toast.error('Selecione ou informe um motivo')
      return
    }
    try {
      await atualizarStatus.mutateAsync({
        reuniaoId,
        status: 'noshow',
        extras: { motivo_noshow: textoFinal },
      })
      toast.success('Reunião marcada como No-Show')
      onClose()
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }, [motivoSelecionado, motivoTexto, reuniaoId, atualizarStatus, onClose])

  return (
    <>
      <div className="fixed inset-0 z-[500] bg-black/60" onClick={onClose} />
      <div className="fixed inset-0 z-[501] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-card border border-border rounded-lg shadow-lg w-[calc(100%-32px)] max-w-sm p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Registrar No-Show</h3>
          <p className="text-xs text-muted-foreground">Selecione o motivo do não comparecimento:</p>

          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
          ) : motivos && motivos.length > 0 ? (
            <div className="space-y-1.5">
              {motivos.map(m => (
                <label
                  key={m.id}
                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                    motivoSelecionado === m.nome ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="motivo_noshow"
                    checked={motivoSelecionado === m.nome}
                    onChange={() => { setMotivoSelecionado(m.nome); setMotivoTexto('') }}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">{m.nome}</span>
                </label>
              ))}
            </div>
          ) : null}

          <div>
            <input
              type="text"
              value={motivoTexto}
              onChange={e => { setMotivoTexto(e.target.value); setMotivoSelecionado('') }}
              placeholder="Ou descreva o motivo..."
              className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground">Cancelar</button>
            <button
              type="button" onClick={handleConfirmar}
              disabled={(!motivoSelecionado && !motivoTexto.trim()) || atualizarStatus.isPending}
              className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >{atualizarStatus.isPending ? 'Salvando...' : 'Confirmar'}</button>
          </div>
        </div>
      </div>
    </>
  )
}
