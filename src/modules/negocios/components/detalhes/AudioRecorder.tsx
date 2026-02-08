/**
 * AIDEV-NOTE: Componente de gravação de áudio para anotações
 * Usa MediaRecorder API com codec WebM/Opus (32kbps)
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void
  disabled?: boolean
}

export function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Determinar mimeType suportado
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Parar tracks
        stream.getTracks().forEach(track => track.stop())

        const blob = new Blob(chunksRef.current, { type: mimeType })
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)
        onRecordingComplete(blob, durationSeconds)
      }

      mediaRecorderRef.current = mediaRecorder
      startTimeRef.current = Date.now()
      mediaRecorder.start(250) // chunks a cada 250ms
      setIsRecording(true)
      setDuration(0)

      // Timer visual
      timerRef.current = setInterval(() => {
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (err) {
      console.error('Erro ao acessar microfone:', err)
    }
  }, [onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive/10 border border-destructive/20">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-medium text-destructive tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>
        <button
          type="button"
          onClick={stopRecording}
          className="p-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          title="Parar gravação"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Gravar áudio"
    >
      <Mic className="w-4 h-4" />
    </button>
  )
}

// =====================================================
// Mini Player de Áudio (para exibição inline)
// =====================================================

interface AudioPlayerProps {
  src: string
  duration?: number | null
}

export function AudioPlayer({ src, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration || 0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setTotalDuration(Math.round(audio.duration) || duration || 0)
      setIsLoading(false)
    }
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0) }
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [duration])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !totalDuration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * totalDuration
    setCurrentTime(audio.currentTime)
  }, [totalDuration])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/50 rounded-md border border-border">
      <audio ref={audioRef} src={src} preload="metadata" />

      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
      ) : (
        <button
          type="button"
          onClick={togglePlay}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground 
            flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          {isPlaying ? (
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="2" width="3" height="8" rx="0.5" />
              <rect x="7" y="2" width="3" height="8" rx="0.5" />
            </svg>
          ) : (
            <svg className="w-3 h-3 ml-0.5" viewBox="0 0 12 12" fill="currentColor">
              <polygon points="3,1 11,6 3,11" />
            </svg>
          )}
        </button>
      )}

      {/* Progress bar */}
      <div
        className="flex-1 h-1.5 bg-border rounded-full cursor-pointer relative"
        onClick={handleSeek}
      >
        <div
          className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
        {formatTime(currentTime)} / {formatTime(totalDuration)}
      </span>
    </div>
  )
}
