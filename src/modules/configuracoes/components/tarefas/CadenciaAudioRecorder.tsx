/**
 * AIDEV-NOTE: Gravador de áudio para templates de cadência WhatsApp
 * Grava áudio via MediaRecorder, faz upload para Supabase Storage
 * e retorna a URL pública do arquivo
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Trash2, Play, Pause, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CadenciaAudioRecorderProps {
  audioUrl: string | null
  onChange: (url: string | null) => void
}

export function CadenciaAudioRecorder({ audioUrl, onChange }: CadenciaAudioRecorderProps) {
  const [gravando, setGravando] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [duracao, setDuracao] = useState(0)
  const [playing, setPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      audioRef.current?.pause()
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const iniciarGravacao = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        setGravando(false)

        if (chunksRef.current.length === 0) return

        const blob = new Blob(chunksRef.current, { type: mimeType })
        setUploading(true)

        try {
          // AIDEV-NOTE: Buscar organizacao_id para cumprir RLS do bucket chat-media
          const { data: { user } } = await supabase.auth.getUser()
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('organizacao_id')
            .eq('auth_id', user?.id || '')
            .single()

          if (!usuario?.organizacao_id) {
            toast.error('Organização não encontrada')
            setUploading(false)
            return
          }

          const ext = mimeType.includes('webm') ? 'webm' : 'mp4'
          const path = `${usuario.organizacao_id}/template-audios/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

          const { data, error } = await supabase.storage
            .from('chat-media')
            .upload(path, blob, { contentType: mimeType, upsert: true, cacheControl: '86400' })

          if (error) throw error

          const { data: urlData } = supabase.storage
            .from('chat-media')
            .getPublicUrl(data.path)

          onChange(urlData.publicUrl)
          toast.success('Áudio gravado com sucesso')
        } catch (err) {
          console.error('Erro upload áudio:', err)
          toast.error('Erro ao salvar áudio')
        } finally {
          setUploading(false)
        }
      }

      recorder.start(250)
      mediaRecorderRef.current = recorder
      setGravando(true)
      setDuracao(0)
      timerRef.current = setInterval(() => setDuracao(d => d + 1), 1000)
    } catch {
      toast.error('Não foi possível acessar o microfone')
    }
  }, [onChange])

  const pararGravacao = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  const removerAudio = useCallback(() => {
    audioRef.current?.pause()
    setPlaying(false)
    onChange(null)
  }, [onChange])

  const togglePlay = useCallback(() => {
    if (!audioUrl) return
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }, [audioUrl, playing])

  // Se tem áudio gravado, mostrar player
  if (audioUrl) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-md border border-primary/20 bg-primary/5">
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <div className="flex-1">
          <p className="text-sm text-foreground font-medium">Áudio gravado</p>
          <p className="text-[10px] text-muted-foreground">Este áudio será enviado no lugar da mensagem de texto</p>
        </div>
        <button
          type="button"
          onClick={removerAudio}
          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Remover áudio"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Se está fazendo upload
  if (uploading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md border border-border bg-muted/30">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Salvando áudio...</span>
      </div>
    )
  }

  // Gravando
  if (gravando) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-md border border-destructive/30 bg-destructive/5">
        <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
        <span className="text-sm font-medium text-destructive">{formatTime(duracao)}</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={pararGravacao}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
        >
          <Square className="w-3.5 h-3.5" />
          Parar
        </button>
      </div>
    )
  }

  // Estado inicial - botão para gravar
  return (
    <button
      type="button"
      onClick={iniciarGravacao}
      className="flex items-center gap-2 w-full p-3 rounded-md border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200"
    >
      <Mic className="w-4 h-4" />
      <span className="text-sm">Gravar áudio</span>
    </button>
  )
}
