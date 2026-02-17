/**
 * AIDEV-NOTE: Popover de agendamento de mensagens (PRD-09)
 * Suporta agendamento de texto e áudio
 * Inclui gravação de áudio inline com upload para Supabase Storage
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Clock, Trash2, CalendarDays, AlertTriangle, Mic, Square, Type } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, addMinutes, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/integrations/supabase/client'
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

type TipoMensagem = 'text' | 'audio'

export function AgendarMensagemPopover({ conversaId, textoPreenchido, disabled }: AgendarMensagemPopoverProps) {
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [dataHora, setDataHora] = useState('')
  const [tab, setTab] = useState<'agendar' | 'lista'>('agendar')
  const [tipoMsg, setTipoMsg] = useState<TipoMensagem>('text')

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const durationRef = useRef(0)

  const { data: agendadas = [] } = useAgendadas(conversaId)
  const { data: countConversa = 0 } = useContarAgendadasConversa(conversaId)
  const { data: countUsuario = 0 } = useContarAgendadasUsuario()
  const agendarMutation = useAgendarMensagem()
  const cancelarMutation = useCancelarAgendada()

  const minDateTime = useMemo(() => {
    const min = addMinutes(new Date(), 6)
    return format(min, "yyyy-MM-dd'T'HH:mm")
  }, [open])

  const maxDateTime = useMemo(() => {
    const max = addDays(new Date(), 30)
    return format(max, "yyyy-MM-dd'T'HH:mm")
  }, [open])

  // Audio recording helpers
  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    setIsRecording(false)
    setRecordingDuration(0)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setAudioError(null)
      setAudioBlob(null)
      setAudioDuration(0)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 }
      })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        if (blob.size > 0) {
          setAudioBlob(blob)
          setAudioDuration(durationRef.current)
        }
        cleanupRecording()
      }

      recorder.start()
      setIsRecording(true)
      setRecordingDuration(0)
      durationRef.current = 0

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const next = prev + 1
          durationRef.current = next
          return next
        })
      }, 1000)
    } catch (err) {
      console.error('[AgendarAudio] Error:', err)
      setAudioError('Não foi possível acessar o microfone')
    }
  }, [cleanupRecording])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    cleanupRecording()
    setAudioBlob(null)
    setAudioDuration(0)
  }, [cleanupRecording])

  const discardAudio = () => {
    setAudioBlob(null)
    setAudioDuration(0)
  }

  // Cleanup on unmount / close
  useEffect(() => {
    if (!open) {
      cancelRecording()
      setAudioBlob(null)
      setAudioDuration(0)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && textoPreenchido) {
      setTexto(textoPreenchido)
    }
    if (isOpen) {
      const defaultTime = addMinutes(new Date(), 60)
      setDataHora(format(defaultTime, "yyyy-MM-dd'T'HH:mm"))
      setTipoMsg('text')
    }
    setOpen(isOpen)
  }

  const uploadAudio = async (blob: Blob): Promise<string> => {
    const ext = blob.type.includes('ogg') ? 'ogg' : 'webm'
    const fileName = `agendado_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const path = `scheduled/${conversaId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(path, blob, { contentType: blob.type })

    if (uploadError) throw new Error(`Erro ao fazer upload do áudio: ${uploadError.message}`)

    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(path)

    return urlData.publicUrl
  }

  const handleAgendar = async () => {
    if (!dataHora) return

    if (tipoMsg === 'text') {
      const msg = texto.trim()
      if (!msg) return

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
    } else {
      if (!audioBlob) return

      try {
        setIsUploading(true)
        const mediaUrl = await uploadAudio(audioBlob)

        agendarMutation.mutate({
          conversaId,
          tipo: 'audio',
          conteudo: `Áudio (${formatTime(audioDuration)})`,
          agendado_para: new Date(dataHora).toISOString(),
          media_url: mediaUrl,
        }, {
          onSuccess: () => {
            setAudioBlob(null)
            setAudioDuration(0)
            setDataHora('')
            setTab('lista')
          }
        })
      } catch (err) {
        setAudioError(err instanceof Error ? err.message : 'Erro no upload')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleCancelar = (id: string) => {
    cancelarMutation.mutate({ id, conversaId })
  }

  const limiteConversaAtingido = countConversa >= LIMITES_AGENDAMENTO.MAX_POR_CONVERSA
  const limiteUsuarioAtingido = countUsuario >= LIMITES_AGENDAMENTO.MAX_POR_USUARIO
  const limitesAtingidos = limiteConversaAtingido || limiteUsuarioAtingido

  const canSubmit = tipoMsg === 'text'
    ? !!texto.trim() && !!dataHora
    : !!audioBlob && !!dataHora

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

            {/* Toggle Texto / Áudio */}
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => { setTipoMsg('text'); cancelRecording() }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors ${
                  tipoMsg === 'text'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                Texto
              </button>
              <button
                type="button"
                onClick={() => { setTipoMsg('audio'); setTexto('') }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors ${
                  tipoMsg === 'audio'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                Áudio
              </button>
            </div>

            {/* Conteúdo: Texto ou Áudio */}
            {tipoMsg === 'text' ? (
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Mensagem a enviar..."
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60"
              />
            ) : (
              <div className="space-y-2">
                {audioError && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{audioError}</span>
                  </div>
                )}

                {!audioBlob && !isRecording && (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={limitesAtingidos}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-md border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <Mic className="w-5 h-5" />
                    <span className="text-sm">Clique para gravar áudio</span>
                  </button>
                )}

                {isRecording && (
                  <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-md animate-in fade-in duration-200">
                    <button
                      onClick={cancelRecording}
                      className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
                      title="Cancelar gravação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm font-mono text-foreground">{formatTime(recordingDuration)}</span>
                      <span className="text-[11px] text-muted-foreground">Gravando...</span>
                    </div>
                    <button
                      onClick={stopRecording}
                      disabled={recordingDuration < 1}
                      className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      title="Parar gravação"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {audioBlob && !isRecording && (
                  <div className="flex items-center gap-2 p-3 bg-accent/30 border border-border rounded-md">
                    <Mic className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm text-foreground">Áudio gravado</span>
                      <span className="text-[11px] text-muted-foreground ml-2">{formatTime(audioDuration)}</span>
                    </div>
                    <button
                      onClick={discardAudio}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Descartar áudio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={startRecording}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Regravar"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

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
              disabled={!canSubmit || agendarMutation.isPending || limitesAtingidos || isUploading}
              className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Enviando áudio...' : agendarMutation.isPending ? 'Agendando...' : 'Agendar envio'}
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
                    {item.tipo === 'audio' ? (
                      <Mic className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground line-clamp-2">
                        {item.tipo === 'audio' ? `🎙️ ${item.conteudo}` : item.conteudo}
                      </p>
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
