/**
 * AIDEV-NOTE: Popover rápido de agenda no card do Kanban
 * - Mobile: overlay centralizado com backdrop escuro
 * - Desktop: Popover flutuante do Radix
 * - Sem reunião: formulário compacto para criar reunião rápida
 * - Com reunião: exibe próxima reunião e ações de status
 */

import { useState, useCallback, useEffect, forwardRef } from 'react'
import {
  Calendar, CheckCircle2, XCircle, AlertTriangle, RotateCcw,
  Video, MapPin, Phone, Loader2, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO, addHours } from 'date-fns'

// AIDEV-NOTE: Helper para obter offset de timezone do navegador (ex: "-03:00")
function getTimezoneOffset(): string {
  const offset = new Date().getTimezoneOffset()
  const sign = offset > 0 ? '-' : '+'
  const hours = Math.floor(Math.abs(offset) / 60)
  const minutes = Math.abs(offset) % 60
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}
import { ptBR } from 'date-fns/locale'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  useReunioesOportunidade,
  useCriarReuniao,
  useAtualizarStatusReuniao,
  useConexaoGoogle,
} from '../../hooks/useDetalhes'

interface AgendaQuickPopoverProps {
  oportunidadeId: string
  oportunidadeTitulo: string
  children: React.ReactNode
}

const TIPO_ICONS: Record<string, typeof Video> = {
  video: Video,
  presencial: MapPin,
  telefone: Phone,
}

// AIDEV-NOTE: Hook para detectar mobile (< 640px = sm breakpoint do Tailwind)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return isMobile
}

// ---- Conteúdo compartilhado (usado tanto no Popover quanto no overlay mobile) ----
function AgendaContent({
  oportunidadeId,
  oportunidadeTitulo,
  onClose,
}: {
  oportunidadeId: string
  oportunidadeTitulo: string
  onClose: () => void
}) {
  const { data: reunioes, isLoading } = useReunioesOportunidade(oportunidadeId)
  const criarReuniao = useCriarReuniao()
  const atualizarStatus = useAtualizarStatusReuniao()
  const { data: conexaoGoogle } = useConexaoGoogle()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'video' as string,
    data_inicio: '',
    hora_inicio: '',
    google_meet: false,
  })

  const reunioesAgendadas = reunioes?.filter(r => r.status === 'agendada') || []
  const proximaReuniao = reunioesAgendadas[0]

  const resetForm = useCallback(() => {
    setForm({ titulo: '', tipo: 'video', data_inicio: '', hora_inicio: '', google_meet: false })
    setShowForm(false)
  }, [])

  const handleCriar = useCallback(async () => {
    if (!form.data_inicio || !form.hora_inicio) {
      toast.error('Informe data e hora')
      return
    }
    const tzOffset = getTimezoneOffset()
    const dataInicio = `${form.data_inicio}T${form.hora_inicio}:00${tzOffset}`
    const dataFim = addHours(new Date(dataInicio), 1).toISOString()
    try {
      await criarReuniao.mutateAsync({
        oportunidadeId,
        payload: {
          titulo: form.titulo || oportunidadeTitulo,
          tipo: form.tipo,
          data_inicio: dataInicio,
          data_fim: dataFim,
          google_meet: form.google_meet,
          // AIDEV-NOTE: Sincronizar com Google Calendar sempre que conectado
          sincronizar_google: !!conexaoGoogle?.conectado,
        },
      })
      toast.success('Reunião agendada!')
      resetForm()
      onClose()
    } catch {
      toast.error('Erro ao criar reunião')
    }
  }, [form, oportunidadeId, oportunidadeTitulo, criarReuniao, conexaoGoogle, resetForm, onClose])

  const handleStatus = useCallback(async (reuniaoId: string, status: string) => {
    // AIDEV-NOTE: O mapeamento noshow -> nao_compareceu é feito na camada de serviço
    try {
      await atualizarStatus.mutateAsync({ reuniaoId, status })
      toast.success(
        status === 'realizada' ? 'Reunião marcada como realizada!' :
        status === 'noshow' ? 'Registrado como No-Show' :
        status === 'cancelada' ? 'Reunião cancelada' : 'Status atualizado'
      )
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }, [atualizarStatus])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (proximaReuniao && !showForm) {
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          {(() => {
            const TipoIcon = TIPO_ICONS[proximaReuniao.tipo as string] || Calendar
            return <TipoIcon className="w-4 h-4 text-primary flex-shrink-0" />
          })()}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{proximaReuniao.titulo}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(proximaReuniao.data_inicio), "dd/MM · HH:mm", { locale: ptBR })}
              {proximaReuniao.data_fim && ` – ${format(parseISO(proximaReuniao.data_fim), "HH:mm")}`}
            </p>
          </div>
        </div>

        {proximaReuniao.google_meet_link && (
          <a
            href={proximaReuniao.google_meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Abrir Google Meet
          </a>
        )}

        <div className="border-t border-border pt-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Ações rápidas</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleStatus(proximaReuniao.id, 'realizada')}
              disabled={atualizarStatus.isPending}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-foreground transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'hsl(var(--success))' }} />
              Realizada
            </button>
            <button
              onClick={() => handleStatus(proximaReuniao.id, 'noshow')}
              disabled={atualizarStatus.isPending}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-foreground transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-warning-foreground" />
              No-Show
            </button>
            <button
              onClick={() => handleStatus(proximaReuniao.id, 'cancelada')}
              disabled={atualizarStatus.isPending}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-foreground transition-colors"
            >
              <XCircle className="w-3.5 h-3.5 text-destructive" />
              Cancelar
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-foreground transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" />
              Reagendar
            </button>
          </div>
        </div>

        {reunioesAgendadas.length > 1 && (
          <p className="text-[10px] text-muted-foreground text-center">
            +{reunioesAgendadas.length - 1} reunião(ões) agendada(s)
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {showForm && proximaReuniao ? 'Reagendar reunião' : 'Agendar reunião'}
        </p>
        {showForm && proximaReuniao && (
          <button
            onClick={() => setShowForm(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Voltar
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Título (opcional)"
        value={form.titulo}
        onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
        className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <div className="flex gap-1">
        {(['video', 'presencial', 'telefone'] as const).map(tipo => {
          const Icon = TIPO_ICONS[tipo]
          const labels = { video: 'Vídeo', presencial: 'Presencial', telefone: 'Telefone' }
          return (
            <button
              key={tipo}
              onClick={() => setForm(f => ({ ...f, tipo }))}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors ${
                form.tipo === tipo
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              <Icon className="w-3 h-3" />
              {labels[tipo]}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground uppercase">Data</label>
          <input
            type="date"
            value={form.data_inicio}
            onChange={(e) => setForm(f => ({ ...f, data_inicio: e.target.value }))}
            className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="w-24">
          <label className="text-[10px] text-muted-foreground uppercase">Hora</label>
          <input
            type="time"
            value={form.hora_inicio}
            onChange={(e) => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
            className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {conexaoGoogle?.conectado && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.google_meet}
            onChange={(e) => setForm(f => ({ ...f, google_meet: e.target.checked }))}
            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/30"
          />
          <Video className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-foreground">Google Meet</span>
        </label>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={() => { resetForm(); onClose() }}
          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleCriar}
          disabled={criarReuniao.isPending}
          className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {criarReuniao.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            'Agendar'
          )}
        </button>
      </div>
    </div>
  )
}

export const AgendaQuickPopover = forwardRef<HTMLDivElement, AgendaQuickPopoverProps>(function AgendaQuickPopover({ oportunidadeId, oportunidadeTitulo, children }, _ref) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleClose = useCallback(() => setOpen(false), [])

  // AIDEV-NOTE: Mobile usa overlay fixo com backdrop; Desktop usa Popover do Radix
  if (isMobile) {
    return (
      <>
        <div onClickCapture={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true) }}>
          {children}
        </div>
        {open && (
          <div
            className="fixed inset-0 z-[500] flex items-center justify-center bg-foreground/30"
            onClick={(e) => { e.stopPropagation(); handleClose() }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div
              className="mx-4 w-full max-w-sm rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <AgendaContent
                oportunidadeId={oportunidadeId}
                oportunidadeTitulo={oportunidadeTitulo}
                onClose={handleClose}
              />
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        side="top"
        align="end"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <AgendaContent
          oportunidadeId={oportunidadeId}
          oportunidadeTitulo={oportunidadeTitulo}
          onClose={handleClose}
        />
      </PopoverContent>
    </Popover>
  )
})
AgendaQuickPopover.displayName = 'AgendaQuickPopover'
