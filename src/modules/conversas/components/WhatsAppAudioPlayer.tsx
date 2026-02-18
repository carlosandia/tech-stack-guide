/**
 * AIDEV-NOTE: Player de áudio estilo WhatsApp
 * Botão play/pause, barra de progresso com waveform, duração, foto do remetente
 * Controle de velocidade (1x, 1.5x, 2x) e microfone posicionado sobre o avatar
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Pause, Mic } from 'lucide-react'
import { User } from 'lucide-react'

interface WhatsAppAudioPlayerProps {
  src: string
  duration?: number
  isMe: boolean
  fotoUrl?: string | null
  timestamp?: string
  ackIndicator?: React.ReactNode
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

const SPEED_OPTIONS = [1, 1.5, 2] as const

export function WhatsAppAudioPlayer({ src, duration: propDuration, isMe, fotoUrl, timestamp, ackIndicator }: WhatsAppAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(propDuration || 0)
  const [speed, setSpeed] = useState<number>(1)
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
      audio.playbackRate = speed
      audio.play()
      setPlaying(true)
    }
  }, [playing, speed])

  const cycleSpeed = useCallback(() => {
    const currentIdx = SPEED_OPTIONS.indexOf(speed as typeof SPEED_OPTIONS[number])
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length
    const newSpeed = SPEED_OPTIONS[nextIdx]
    setSpeed(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }, [speed])

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
    <div className="flex items-center gap-2.5 min-w-[260px] max-w-[340px]">
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

      {/* Waveform + time row */}
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

        {/* Time + speed + timestamp control */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground leading-none">
            {playing || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
          </span>
          <div className="flex items-center gap-1.5">
            {duration > 0 && (playing || currentTime > 0) && (
              <span className="text-[10px] text-muted-foreground leading-none">
                {formatTime(duration)}
              </span>
            )}
            <button
              onClick={cycleSpeed}
              className={`
                text-[9px] font-bold leading-none px-1 py-0.5 rounded transition-colors
                ${speed !== 1
                  ? isMe ? 'bg-primary/20 text-primary' : 'bg-foreground/10 text-foreground/70'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
              title="Velocidade de reprodução"
            >
              {speed}x
            </button>
            {timestamp && (
              <span className="text-[10px] text-muted-foreground leading-none flex items-center gap-1">
                {timestamp}
                {ackIndicator}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Avatar with mic badge */}
      <div className="relative flex-shrink-0">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt=""
            className="w-11 h-11 rounded-full object-cover border-2 border-background"
          />
        ) : (
          <div className={`
            w-11 h-11 rounded-full flex items-center justify-center border-2 border-background
            ${isMe ? 'bg-primary/15' : 'bg-muted'}
          `}>
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        {/* Mic badge - positioned at bottom-left of avatar */}
        <div className={`
          absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full flex items-center justify-center
          ${isMe ? 'bg-primary/10' : 'bg-background'}
        `}>
          <Mic className={`w-2.5 h-2.5 ${isMe ? 'text-primary' : 'text-emerald-500'}`} />
        </div>
      </div>
    </div>
  )
}
