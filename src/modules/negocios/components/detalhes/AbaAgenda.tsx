/**
 * AIDEV-NOTE: Aba Agenda/Reuniões (RF-14.3 Tab 5) - Completa
 * Formulário estilo Google Calendar, ações pós-reunião,
 * integração com Google Calendar para Meet links
 */

import { useState, useCallback, useEffect } from 'react'
import {
  Calendar, Plus, MapPin, Clock, CheckCircle2, XCircle,
  AlertTriangle, RotateCcw, Trash2, Loader2, Video, Phone,
  Users, Link as LinkIcon, Bell, ExternalLink,
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
  useReunioesOportunidade,
  useCriarReuniao,
  useAtualizarStatusReuniao,
  useExcluirReuniao,
  useMotivosNoShow,
  useConexaoGoogle,
  useReagendarReuniao,
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

const TIPO_ICONS = {
  video: Video,
  presencial: MapPin,
  telefone: Phone,
}

const NOTIFICACAO_OPTIONS = [
  { value: 0, label: 'Sem lembrete' },
  { value: 5, label: '5 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 1440, label: '1 dia antes' },
]

interface ReuniaoFormData {
  titulo: string
  descricao: string
  tipo: string
  local: string
  data_inicio: string
  hora_inicio: string
  data_fim: string
  hora_fim: string
  participantes: string
  google_meet: boolean
  notificacao_minutos: number
}

const DEFAULT_FORM: ReuniaoFormData = {
  titulo: '', descricao: '', tipo: 'video', local: '',
  data_inicio: '', hora_inicio: '', data_fim: '', hora_fim: '',
  participantes: '', google_meet: false, notificacao_minutos: 30,
}

export function AbaAgenda({ oportunidadeId }: AbaAgendaProps) {
  const { data: reunioes, isLoading } = useReunioesOportunidade(oportunidadeId)
  const criarReuniao = useCriarReuniao()
  const excluirReuniao = useExcluirReuniao()
  const reagendar = useReagendarReuniao()
  const { data: conexaoGoogle } = useConexaoGoogle()

  const [showForm, setShowForm] = useState(false)
  const [showNoShowModal, setShowNoShowModal] = useState<string | null>(null)
  const [showCancelarModal, setShowCancelarModal] = useState<string | null>(null)
  const [showRealizadaModal, setShowRealizadaModal] = useState<string | null>(null)
  const [reagendandoReuniao, setReagendandoReuniao] = useState<Reuniao | null>(null)
  const [formData, setFormData] = useState<ReuniaoFormData>(DEFAULT_FORM)

  // Preencher data fim automática
  useEffect(() => {
    if (formData.data_inicio && formData.hora_inicio && !formData.data_fim) {
      const dt = new Date(`${formData.data_inicio}T${formData.hora_inicio}:00`)
      const end = addHours(dt, 1)
      setFormData(p => ({
        ...p,
        data_fim: format(end, 'yyyy-MM-dd'),
        hora_fim: format(end, 'HH:mm'),
      }))
    }
  }, [formData.data_inicio, formData.hora_inicio])

  const handleCriar = useCallback(async () => {
    if (!formData.titulo.trim() || !formData.data_inicio || !formData.hora_inicio) {
      toast.error('Preencha título, data e hora')
      return
    }

    try {
      const tzOffset = getTimezoneOffset()
      const dataInicio = `${formData.data_inicio}T${formData.hora_inicio}:00${tzOffset}`
      const dataFim = formData.data_fim && formData.hora_fim
        ? `${formData.data_fim}T${formData.hora_fim}:00${tzOffset}`
        : addHours(new Date(dataInicio), 1).toISOString()

      // Parse participantes
      const participantes = formData.participantes
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0)
        .map(email => ({ email }))

      await criarReuniao.mutateAsync({
        oportunidadeId,
        payload: {
          titulo: formData.titulo.trim(),
          descricao: formData.descricao || undefined,
          tipo: formData.tipo,
          local: formData.local || undefined,
          data_inicio: dataInicio,
          data_fim: dataFim,
          participantes,
          google_meet: formData.google_meet,
          notificacao_minutos: formData.notificacao_minutos,
          // AIDEV-NOTE: Sincronizar com Google Calendar sempre que conectado, independente do Meet
          sincronizar_google: !!conexaoGoogle?.conectado,
        },
      })
      setFormData(DEFAULT_FORM)
      setShowForm(false)
      setReagendandoReuniao(null)
      toast.success('Reunião agendada')
    } catch {
      toast.error('Erro ao criar reunião')
    }
  }, [formData, oportunidadeId, criarReuniao, conexaoGoogle])

  const handleReagendar = useCallback((reuniao: Reuniao) => {
    setReagendandoReuniao(reuniao)
    setFormData({
      titulo: reuniao.titulo,
      descricao: reuniao.descricao || '',
      tipo: reuniao.tipo || 'video',
      local: reuniao.local || '',
      data_inicio: '', hora_inicio: '',
      data_fim: '', hora_fim: '',
      participantes: (reuniao.participantes || []).map((p: any) => p.email).join(', '),
      google_meet: !!reuniao.google_meet_link,
      notificacao_minutos: reuniao.notificacao_minutos || 30,
    })
    setShowForm(true)
  }, [])

  const handleCriarReagendamento = useCallback(async () => {
    if (!reagendandoReuniao) return handleCriar()

    if (!formData.titulo.trim() || !formData.data_inicio || !formData.hora_inicio) {
      toast.error('Preencha título, data e hora')
      return
    }

    try {
      const tzOffset = getTimezoneOffset()
      const dataInicio = `${formData.data_inicio}T${formData.hora_inicio}:00${tzOffset}`
      const dataFim = formData.data_fim && formData.hora_fim
        ? `${formData.data_fim}T${formData.hora_fim}:00${tzOffset}`
        : addHours(new Date(dataInicio), 1).toISOString()

      const participantes = formData.participantes
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0)
        .map(email => ({ email }))

      await reagendar.mutateAsync({
        reuniaoOriginalId: reagendandoReuniao.id,
        oportunidadeId,
        payload: {
          titulo: formData.titulo.trim(),
          descricao: formData.descricao || undefined,
          tipo: formData.tipo,
          local: formData.local || undefined,
          data_inicio: dataInicio,
          data_fim: dataFim,
          participantes,
          google_meet: formData.google_meet,
          notificacao_minutos: formData.notificacao_minutos,
          sincronizar_google: !!conexaoGoogle?.conectado,
        },
      })
      setFormData(DEFAULT_FORM)
      setShowForm(false)
      setReagendandoReuniao(null)
      toast.success('Reunião reagendada')
    } catch {
      toast.error('Erro ao reagendar')
    }
  }, [reagendandoReuniao, formData, oportunidadeId, reagendar, handleCriar])

  const handleMudarStatus = useCallback(async (reuniaoId: string, status: string) => {
    if (status === 'noshow') { setShowNoShowModal(reuniaoId); return }
    if (status === 'cancelada') { setShowCancelarModal(reuniaoId); return }
    if (status === 'realizada') { setShowRealizadaModal(reuniaoId); return }
  }, [])

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
          onClick={() => { setShowForm(!showForm); setReagendandoReuniao(null); setFormData(DEFAULT_FORM) }}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova reunião
        </button>
      </div>

      {/* Form nova reunião (expandido) */}
      {showForm && (
        <ReuniaoForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={reagendandoReuniao ? handleCriarReagendamento : handleCriar}
          onCancel={() => { setShowForm(false); setReagendandoReuniao(null); setFormData(DEFAULT_FORM) }}
          isPending={criarReuniao.isPending || reagendar.isPending}
          isReagendamento={!!reagendandoReuniao}
          googleConectado={!!conexaoGoogle?.conectado}
        />
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
              onReagendar={handleReagendar}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      {showNoShowModal && (
        <NoShowModal reuniaoId={showNoShowModal} onClose={() => setShowNoShowModal(null)} />
      )}
      {showCancelarModal && (
        <CancelarModal reuniaoId={showCancelarModal} onClose={() => setShowCancelarModal(null)} />
      )}
      {showRealizadaModal && (
        <RealizadaModal reuniaoId={showRealizadaModal} onClose={() => setShowRealizadaModal(null)} />
      )}
    </div>
  )
}

// =====================================================
// Formulário de Reunião (Estilo Google Calendar)
// =====================================================

function ReuniaoForm({ formData, setFormData, onSubmit, onCancel, isPending, isReagendamento, googleConectado }: {
  formData: ReuniaoFormData
  setFormData: React.Dispatch<React.SetStateAction<ReuniaoFormData>>
  onSubmit: () => void
  onCancel: () => void
  isPending: boolean
  isReagendamento: boolean
  googleConectado: boolean
}) {
  const update = (field: keyof ReuniaoFormData, value: any) =>
    setFormData(p => ({ ...p, [field]: value }))

  return (
    <div className="p-4 border border-border rounded-lg space-y-3 bg-muted/30 overflow-hidden">
      {isReagendamento && (
        <div className="text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-md">
          ↻ Reagendando reunião — selecione nova data/hora
        </div>
      )}

      {/* Título */}
      <input
        type="text"
        value={formData.titulo}
        onChange={e => update('titulo', e.target.value)}
        placeholder="Título da reunião"
        className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        autoFocus
      />

      {/* Tipo de reunião */}
      <div className="flex gap-1.5">
        {(['video', 'presencial', 'telefone'] as const).map(tipo => {
          const Icon = TIPO_ICONS[tipo]
          const selected = formData.tipo === tipo
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => update('tipo', tipo)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors ${
                selected
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tipo === 'video' ? 'Vídeo' : tipo === 'presencial' ? 'Presencial' : 'Telefone'}
            </button>
          )
        })}
      </div>

      {/* Data/Hora início e fim */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="min-w-0">
          <label className="text-[10px] font-medium text-muted-foreground uppercase mb-0.5 block">Início</label>
          <div className="flex gap-1.5">
            <input
              type="date"
              value={formData.data_inicio}
              onChange={e => update('data_inicio', e.target.value)}
              className="flex-1 min-w-0 text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="time"
              value={formData.hora_inicio}
              onChange={e => update('hora_inicio', e.target.value)}
              className="w-[72px] flex-shrink-0 text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="min-w-0">
          <label className="text-[10px] font-medium text-muted-foreground uppercase mb-0.5 block">Fim</label>
          <div className="flex gap-1.5">
            <input
              type="date"
              value={formData.data_fim}
              onChange={e => update('data_fim', e.target.value)}
              className="flex-1 min-w-0 text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="time"
              value={formData.hora_fim}
              onChange={e => update('hora_fim', e.target.value)}
              className="w-[72px] flex-shrink-0 text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Google Meet */}
      {googleConectado && formData.tipo === 'video' && (
        <label className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/30 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={formData.google_meet}
            onChange={e => update('google_meet', e.target.checked)}
            className="accent-primary"
          />
          <Video className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-foreground">Adicionar videoconferência do Google Meet</span>
        </label>
      )}

      {/* Local/Link */}
      <div className="relative">
        <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={formData.local}
          onChange={e => update('local', e.target.value)}
          placeholder={formData.tipo === 'video' ? 'Link de vídeo (se não usar Meet)' : formData.tipo === 'presencial' ? 'Endereço do local' : 'Número de telefone'}
          className="w-full text-xs bg-background border border-input rounded-md pl-8 pr-3 py-1.5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Participantes */}
      <div className="relative">
        <Users className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={formData.participantes}
          onChange={e => update('participantes', e.target.value)}
          placeholder="Emails dos participantes (separados por vírgula)"
          className="w-full text-xs bg-background border border-input rounded-md pl-8 pr-3 py-1.5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Notificação */}
      <div className="flex items-center gap-2">
        <Bell className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <select
          value={formData.notificacao_minutos}
          onChange={e => update('notificacao_minutos', Number(e.target.value))}
          className="text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {NOTIFICACAO_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Descrição */}
      <textarea
        value={formData.descricao}
        onChange={e => update('descricao', e.target.value)}
        placeholder="Descrição / pauta da reunião (opcional)"
        rows={2}
        className="w-full text-xs bg-background border border-input rounded-md px-3 py-1.5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />

      {/* Ações */}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">
          Cancelar
        </button>
        <button
          type="button" onClick={onSubmit}
          disabled={!formData.titulo.trim() || !formData.data_inicio || !formData.hora_inicio || isPending}
          className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
          {isReagendamento ? 'Reagendar' : 'Agendar'}
        </button>
      </div>
    </div>
  )
}

// =====================================================
// Card de Reunião
// =====================================================

function ReuniaoItem({ reuniao, onMudarStatus, onExcluir, onReagendar }: {
  reuniao: Reuniao
  onMudarStatus: (id: string, status: string) => void
  onExcluir: (id: string) => void
  onReagendar: (reuniao: Reuniao) => void
}) {
  const config = STATUS_CONFIG[reuniao.status] || STATUS_CONFIG.agendada
  const StatusIcon = config.icon
  const TipoIcon = TIPO_ICONS[reuniao.tipo as keyof typeof TIPO_ICONS] || Calendar
  const isAgendada = reuniao.status === 'agendada'
  const meetLink = reuniao.google_meet_link || (reuniao.local?.startsWith('http') ? reuniao.local : null)

  return (
    <div className="group border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded-md ${config.bgClass}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${config.class}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{reuniao.titulo}</p>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {format(parseISO(reuniao.data_inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
              {reuniao.data_fim && (
                <> — {format(parseISO(reuniao.data_fim), "HH:mm", { locale: ptBR })}</>
              )}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <TipoIcon className="w-3 h-3" />
              {reuniao.tipo === 'video' ? 'Vídeo' : reuniao.tipo === 'presencial' ? 'Presencial' : 'Telefone'}
            </span>
            {reuniao.local && !reuniao.local.startsWith('http') && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {reuniao.local}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${config.class} ${config.bgClass}`}>
              {config.label}
            </span>
          </div>

          {/* Participantes */}
          {reuniao.participantes && Array.isArray(reuniao.participantes) && reuniao.participantes.length > 0 && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
              <Users className="w-2.5 h-2.5" />
              {reuniao.participantes.map((p: any) => p.email || p).join(', ')}
            </div>
          )}

          {/* Meet Link */}
          {meetLink && (
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Video className="w-2.5 h-2.5" />
              Entrar na reunião
              <ExternalLink className="w-2 h-2" />
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={() => onExcluir(reuniao.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Descrição */}
      {reuniao.descricao && (
        <p className="text-[11px] text-muted-foreground pl-9 line-clamp-2">{reuniao.descricao}</p>
      )}

      {/* Ações de status (só para reuniões agendadas) */}
      {isAgendada && (
        <div className="flex gap-1.5 pt-1 border-t border-border">
          <button type="button" onClick={() => onMudarStatus(reuniao.id, 'realizada')}
            className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
            ✓ Realizada
          </button>
          <button type="button" onClick={() => onMudarStatus(reuniao.id, 'noshow')}
            className="text-[11px] px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
            ⚠ No-Show
          </button>
          <button type="button" onClick={() => onMudarStatus(reuniao.id, 'cancelada')}
            className="text-[11px] px-2.5 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
            ✗ Cancelar
          </button>
          <button type="button" onClick={() => onReagendar(reuniao)}
            className="text-[11px] px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
            ↻ Reagendar
          </button>
        </div>
      )}

      {/* Infos pós-reunião */}
      {reuniao.status === 'noshow' && (reuniao.motivo_noshow || reuniao.observacoes_noshow) && (
        <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
          Motivo: {reuniao.motivo_noshow || reuniao.observacoes_noshow}
        </p>
      )}
      {reuniao.status === 'cancelada' && reuniao.motivo_cancelamento && (
        <p className="text-[10px] text-destructive bg-red-50 rounded px-2 py-1">
          Motivo: {reuniao.motivo_cancelamento}
        </p>
      )}
      {reuniao.status === 'realizada' && reuniao.observacoes_realizacao && (
        <p className="text-[10px] text-emerald-600 bg-emerald-50 rounded px-2 py-1">
          Observações: {reuniao.observacoes_realizacao}
        </p>
      )}
    </div>
  )
}

// =====================================================
// Modal Marcar Realizada
// =====================================================

function RealizadaModal({ reuniaoId, onClose }: { reuniaoId: string; onClose: () => void }) {
  const atualizarStatus = useAtualizarStatusReuniao()
  const [observacoes, setObservacoes] = useState('')

  const handleConfirmar = useCallback(async () => {
    try {
      await atualizarStatus.mutateAsync({
        reuniaoId, status: 'realizada',
        extras: { observacoes_realizacao: observacoes.trim() || undefined },
      })
      toast.success('Reunião marcada como realizada')
      onClose()
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }, [observacoes, reuniaoId, atualizarStatus, onClose])

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="text-sm font-semibold text-foreground">Marcar como Realizada</h3>
      <textarea
        value={observacoes}
        onChange={e => setObservacoes(e.target.value)}
        placeholder="Observações sobre a reunião (opcional)"
        rows={3}
        className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground">Cancelar</button>
        <button type="button" onClick={handleConfirmar} disabled={atualizarStatus.isPending}
          className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50">
          {atualizarStatus.isPending ? 'Salvando...' : '✓ Confirmar'}
        </button>
      </div>
    </ModalOverlay>
  )
}

// =====================================================
// Modal Cancelar
// =====================================================

function CancelarModal({ reuniaoId, onClose }: { reuniaoId: string; onClose: () => void }) {
  const atualizarStatus = useAtualizarStatusReuniao()
  const [motivo, setMotivo] = useState('')

  const handleConfirmar = useCallback(async () => {
    if (!motivo.trim()) {
      toast.error('Informe o motivo do cancelamento')
      return
    }
    try {
      await atualizarStatus.mutateAsync({
        reuniaoId, status: 'cancelada',
        extras: { motivo_cancelamento: motivo.trim() },
      })
      toast.success('Reunião cancelada')
      onClose()
    } catch {
      toast.error('Erro ao cancelar')
    }
  }, [motivo, reuniaoId, atualizarStatus, onClose])

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="text-sm font-semibold text-foreground">Cancelar Reunião</h3>
      <p className="text-xs text-muted-foreground">Informe o motivo do cancelamento:</p>
      <textarea
        value={motivo}
        onChange={e => setMotivo(e.target.value)}
        placeholder="Motivo do cancelamento..."
        rows={3}
        className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        autoFocus
      />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground">Voltar</button>
        <button type="button" onClick={handleConfirmar} disabled={!motivo.trim() || atualizarStatus.isPending}
          className="text-xs px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50">
          {atualizarStatus.isPending ? 'Cancelando...' : 'Confirmar cancelamento'}
        </button>
      </div>
    </ModalOverlay>
  )
}

// =====================================================
// Modal No-Show
// =====================================================

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
        reuniaoId, status: 'noshow',
        extras: { motivo_noshow: textoFinal },
      })
      toast.success('Reunião marcada como No-Show')
      onClose()
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }, [motivoSelecionado, motivoTexto, reuniaoId, atualizarStatus, onClose])

  return (
    <ModalOverlay onClose={onClose}>
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
              <input type="radio" name="motivo_noshow" checked={motivoSelecionado === m.nome}
                onChange={() => { setMotivoSelecionado(m.nome); setMotivoTexto('') }} className="accent-primary" />
              <span className="text-sm text-foreground">{m.nome}</span>
            </label>
          ))}
        </div>
      ) : null}

      <input
        type="text"
        value={motivoTexto}
        onChange={e => { setMotivoTexto(e.target.value); setMotivoSelecionado('') }}
        placeholder="Ou descreva o motivo..."
        className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground">Cancelar</button>
        <button type="button" onClick={handleConfirmar}
          disabled={(!motivoSelecionado && !motivoTexto.trim()) || atualizarStatus.isPending}
          className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
          {atualizarStatus.isPending ? 'Salvando...' : 'Confirmar'}
        </button>
      </div>
    </ModalOverlay>
  )
}

// =====================================================
// Modal Overlay reutilizável
// =====================================================

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[500] bg-black/60" onClick={onClose} />
      <div className="fixed inset-0 z-[501] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-card border border-border rounded-lg shadow-lg w-[calc(100%-32px)] max-w-sm p-4 space-y-3">
          {children}
        </div>
      </div>
    </>
  )
}
