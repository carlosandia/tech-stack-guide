/**
 * AIDEV-NOTE: Popover de agendamento de mensagens (PRD-09)
 * Abre ao clicar no ícone Clock dentro do ChatInput
 * Inclui seleção de data/hora, indicador de limites e lista de agendadas
 */

import { useState, useMemo } from 'react'
import { Clock, Trash2, CalendarDays, AlertTriangle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, addMinutes, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  useAgendadas,
  useContarAgendadasConversa,
  useContarAgendadasUsuario,
  useAgendarMensagem,
  useCancelarAgendada,
  LIMITES_AGENDAMENTO,
} from '../hooks/useMensagensAgendadas'

interface AgendarMensagemPopoverProps {
  conversaId: string
  textoPreenchido?: string
  disabled?: boolean
}

export function AgendarMensagemPopover({ conversaId, textoPreenchido, disabled }: AgendarMensagemPopoverProps) {
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [dataHora, setDataHora] = useState('')
  const [tab, setTab] = useState<'agendar' | 'lista'>('agendar')

  const { data: agendadas = [] } = useAgendadas(conversaId)
  const { data: countConversa = 0 } = useContarAgendadasConversa(conversaId)
  const { data: countUsuario = 0 } = useContarAgendadasUsuario()
  const agendarMutation = useAgendarMensagem()
  const cancelarMutation = useCancelarAgendada()

  // Min datetime (5min from now)
  const minDateTime = useMemo(() => {
    const min = addMinutes(new Date(), 6)
    return format(min, "yyyy-MM-dd'T'HH:mm")
  }, [open])

  // Max datetime (30 days)
  const maxDateTime = useMemo(() => {
    const max = addDays(new Date(), 30)
    return format(max, "yyyy-MM-dd'T'HH:mm")
  }, [open])

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && textoPreenchido) {
      setTexto(textoPreenchido)
    }
    if (isOpen) {
      // Default to 1h from now
      const defaultTime = addMinutes(new Date(), 60)
      setDataHora(format(defaultTime, "yyyy-MM-dd'T'HH:mm"))
    }
    setOpen(isOpen)
  }

  const handleAgendar = () => {
    const msg = texto.trim()
    if (!msg || !dataHora) return

    agendarMutation.mutate({
      conversaId,
      tipo: 'text',
      conteudo: msg,
      agendado_para: new Date(dataHora).toISOString(),
    }, {
      onSuccess: () => {
        setTexto('')
        setDataHora('')
        setTab('lista')
      }
    })
  }

  const handleCancelar = (id: string) => {
    cancelarMutation.mutate({ id, conversaId })
  }

  const limiteConversaAtingido = countConversa >= LIMITES_AGENDAMENTO.MAX_POR_CONVERSA
  const limiteUsuarioAtingido = countUsuario >= LIMITES_AGENDAMENTO.MAX_POR_USUARIO
  const limitesAtingidos = limiteConversaAtingido || limiteUsuarioAtingido

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 disabled:opacity-50"
          title="Agendar mensagem"
        >
          <Clock className="w-[18px] h-[18px]" />
          {countConversa > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none">
              {countConversa}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-80 p-0 bg-popover border border-border shadow-lg rounded-lg"
      >
        {/* Tabs */}
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setTab('agendar')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              tab === 'agendar'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Agendar
          </button>
          <button
            onClick={() => setTab('lista')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2 relative ${
              tab === 'lista'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Agendadas
            {agendadas.length > 0 && (
              <span className="ml-1 text-[10px] bg-muted rounded-full px-1.5 py-0.5">
                {agendadas.length}
              </span>
            )}
          </button>
        </div>

        {tab === 'agendar' ? (
          <div className="p-3 space-y-3">
            {/* Limites info */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className={countConversa >= LIMITES_AGENDAMENTO.MAX_POR_CONVERSA ? 'text-destructive font-medium' : ''}>
                Conversa: {countConversa}/{LIMITES_AGENDAMENTO.MAX_POR_CONVERSA}
              </span>
              <span className={countUsuario >= LIMITES_AGENDAMENTO.MAX_POR_USUARIO ? 'text-destructive font-medium' : ''}>
                Total: {countUsuario}/{LIMITES_AGENDAMENTO.MAX_POR_USUARIO}
              </span>
            </div>

            {limitesAtingidos && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Limite de agendamentos atingido</span>
              </div>
            )}

            {/* Texto */}
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Mensagem a enviar..."
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60"
            />

            {/* Data/hora */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                Data e hora do envio
              </label>
              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                min={minDateTime}
                max={maxDateTime}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Botão */}
            <button
              onClick={handleAgendar}
              disabled={!texto.trim() || !dataHora || agendarMutation.isPending || limitesAtingidos}
              className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {agendarMutation.isPending ? 'Agendando...' : 'Agendar envio'}
            </button>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {agendadas.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma mensagem agendada
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {agendadas.map((item: any) => (
                  <div key={item.id} className="p-3 flex items-start gap-2 group">
                    <Clock className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground line-clamp-2">{item.conteudo}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(item.agendado_para), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelar(item.id)}
                      disabled={cancelarMutation.isPending}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      title="Cancelar agendamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
