/**
 * AIDEV-NOTE: Player de áudio estilo WhatsApp
 * Botão play/pause, barra de progresso com waveform, duração e foto do remetente
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Pause, Mic } from 'lucide-react'
import { User } from 'lucide-react'

interface WhatsAppAudioPlayerProps {
  src: string
  duration?: number
  isMe: boolean
  fotoUrl?: string | null
}

// Generate a deterministic waveform pattern from the URL
function generateWaveform(seed: string, count: number): number[] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  const bars: number[] = []
  for (let i = 0; i < count; i++) {
    hash = ((hash << 5) - hash) + i
    hash |= 0
    const val = Math.abs(hash % 100) / 100
    // Create variation between 0.15 and 1.0
    bars.push(0.15 + val * 0.85)
  }
  return bars
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function WhatsAppAudioPlayer({ src, duration: propDuration, isMe, fotoUrl }: WhatsAppAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(propDuration || 0)
  const [waveform] = useState(() => generateWaveform(src, 40))

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoaded = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }, [playing])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const bar = progressRef.current
    if (!audio || !bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    audio.currentTime = pct * duration
    setCurrentTime(audio.currentTime)
  }, [duration])

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className="flex items-center gap-2 min-w-[240px] max-w-[320px]">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
          ${isMe
            ? 'bg-primary/20 text-primary hover:bg-primary/30'
            : 'bg-muted-foreground/15 text-muted-foreground hover:bg-muted-foreground/25'
          }
        `}
      >
        {playing ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform + time */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Waveform bars */}
        <div
          ref={progressRef}
          className="flex items-end gap-[1.5px] h-[28px] cursor-pointer"
          onClick={handleSeek}
        >
          {waveform.map((height, i) => {
            const barProgress = i / waveform.length
            const isPlayed = barProgress <= progress
            return (
              <div
                key={i}
                className={`
                  flex-1 rounded-full min-w-[2px] max-w-[3px] transition-colors duration-100
                  ${isPlayed
                    ? isMe ? 'bg-primary' : 'bg-foreground/60'
                    : isMe ? 'bg-primary/30' : 'bg-muted-foreground/30'
                  }
                `}
                style={{ height: `${height * 100}%` }}
              />
            )
          })}
        </div>

        {/* Time display */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {playing || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
          </span>
          {duration > 0 && (playing || currentTime > 0) && (
            <span className="text-[10px] text-muted-foreground">
              {formatTime(duration)}
            </span>
          )}
        </div>
      </div>

      {/* Mic icon + Avatar */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover border-2 border-background"
          />
        ) : (
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center border-2 border-background
            ${isMe ? 'bg-primary/15' : 'bg-muted'}
          `}>
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <Mic className={`w-3 h-3 ${isMe ? 'text-primary' : 'text-emerald-500'}`} />
      </div>
    </div>
  )
}
