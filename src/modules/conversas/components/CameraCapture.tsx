/**
 * AIDEV-NOTE: Captura de foto via câmera do navegador (PRD-09)
 * Modal fullscreen com preview da câmera e botão de captura
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Camera, RotateCcw, Send } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setError(null)
    } catch (err) {
      console.error('[CameraCapture] Error:', err)
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
    }
  }, [stream])

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob)
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.85))
      }
    }, 'image/jpeg', 0.85)
  }, [])

  const handleRetake = useCallback(() => {
    setCapturedImage(null)
    setCapturedBlob(null)
  }, [])

  const handleSend = useCallback(() => {
    if (capturedBlob) {
      onCapture(capturedBlob)
    }
  }, [capturedBlob, onCapture])

  const handleFlipCamera = useCallback(() => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)
    startCamera(newFacing)
  }, [facingMode, startCamera])

  const handleClose = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
    }
    onClose()
  }, [stream, onClose])

  return (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10">
        <button onClick={handleClose} className="p-2 text-white hover:bg-white/10 rounded-full">
          <X className="w-5 h-5" />
        </button>
        <span className="text-white text-sm font-medium">Câmera</span>
        <button onClick={handleFlipCamera} className="p-2 text-white hover:bg-white/10 rounded-full">
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center relative">
        {error ? (
          <div className="text-center px-6">
            <Camera className="w-12 h-12 text-white/50 mx-auto mb-3" />
            <p className="text-white/70 text-sm">{error}</p>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-white/10 text-white rounded-md text-sm hover:bg-white/20"
            >
              Fechar
            </button>
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captura" className="max-w-full max-h-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8 p-6 bg-black/50">
        {capturedImage ? (
          <>
            <button
              onClick={handleRetake}
              className="p-3 text-white hover:bg-white/10 rounded-full transition-colors"
              title="Tirar outra"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            <button
              onClick={handleSend}
              className="p-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              title="Enviar foto"
            >
              <Send className="w-6 h-6" />
            </button>
          </>
        ) : (
          <button
            onClick={handleCapture}
            disabled={!!error}
            className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
            title="Capturar foto"
          >
            <div className="w-full h-full rounded-full bg-white/90" />
          </button>
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
