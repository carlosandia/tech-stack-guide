/**
 * AIDEV-NOTE: Gravador de áudio inline para chat (PRD-09)
 * Usa MediaRecorder API com codec WebM/Opus
 * UI: barra inline com Cancelar | Tempo | Enviar
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Trash2, Send, Mic } from 'lucide-react'

interface AudioRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
}

export function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 }
      })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        if (blob.size > 0) {
          onSend(blob, duration)
        }
        cleanup()
      }

      recorder.start(100)
      setIsRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('[AudioRecorder] Error:', err)
      setError('Não foi possível acessar o microfone')
    }
  }, [duration, onSend])

  const cleanup = useCallback(() => {
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
  }, [])

  const handleCancel = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    cleanup()
    onCancel()
  }, [cleanup, onCancel])

  const handleSend = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // Auto-start recording on mount
  useEffect(() => {
    startRecording()
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.ondataavailable = null
        mediaRecorderRef.current.onstop = null
        mediaRecorderRef.current.stop()
      }
      cleanup()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
        <Mic className="w-4 h-4 text-destructive" />
        <span className="text-xs text-destructive flex-1">{error}</span>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
          Fechar
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-md animate-in fade-in duration-200">
      {/* Cancel */}
      <button
        onClick={handleCancel}
        className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
        title="Cancelar gravação"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Recording indicator + timer */}
      <div className="flex items-center gap-2 flex-1">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
        <span className="text-sm font-mono text-foreground">{formatTime(duration)}</span>
        <span className="text-xs text-muted-foreground">Gravando...</span>
      </div>

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={!isRecording || duration < 1}
        className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        title="Enviar áudio"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}
