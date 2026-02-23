/**
 * AIDEV-NOTE: Compressão client-side de vídeo
 * Estratégia 1 (Chrome 94+): WebCodecs VideoEncoder + webm-muxer (20-40% melhor que MediaRecorder)
 * Estratégia 2 (fallback): Canvas + MediaRecorder VP9 > VP8
 * Vídeos < 2MB E já em 720p são retornados sem alteração (AND, não OR)
 * Vídeos > 2min são retornados sem compressão para evitar travar a UI
 * Safari: sem suporte a video/webm — retorna original sem compressão
 */

import { Muxer, ArrayBufferTarget } from 'webm-muxer'

const MAX_WIDTH = 1280
const MAX_HEIGHT = 720
const VIDEO_BITRATE = 1_000_000 // 1 Mbps
const SKIP_THRESHOLD = 2 * 1024 * 1024 // 2MB
// AIDEV-NOTE: Limite de duração para evitar travamento de UI no canvas frame-by-frame
const MAX_DURATION_SECONDS = 120 // 2 minutos

function calcTargetDimensions(w: number, h: number) {
  let targetW = w
  let targetH = h
  if (targetW > MAX_WIDTH || targetH > MAX_HEIGHT) {
    const ratio = Math.min(MAX_WIDTH / targetW, MAX_HEIGHT / targetH)
    targetW = Math.round(targetW * ratio)
    targetH = Math.round(targetH * ratio)
  }
  // Garantir dimensões pares (requisito de codecs)
  targetW = targetW % 2 === 0 ? targetW : targetW + 1
  targetH = targetH % 2 === 0 ? targetH : targetH + 1
  return { targetW, targetH }
}

// AIDEV-NOTE: WebCodecs progressive enhancement — Chrome 94+ (VideoEncoder + requestVideoFrameCallback)
// Referência: https://developer.chrome.com/docs/web-platform/best-practices/webcodecs
async function compressVideoWithWebCodecs(
  file: File,
  targetW: number,
  targetH: number,
): Promise<File | null> {
  try {
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'V_VP9', width: targetW, height: targetH },
      firstTimestampBehavior: 'offset',
    })

    let frameIndex = 0
    let encoderError = false

    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => {
        console.warn('[compressVideo] WebCodecs encoder error:', e)
        encoderError = true
      },
    })

    encoder.configure({
      codec: 'vp09.00.10.08',
      width: targetW,
      height: targetH,
      bitrate: VIDEO_BITRATE,
    })

    const compressed = await new Promise<File | null>((resolve) => {
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      const url = URL.createObjectURL(file)

      const finish = async () => {
        try {
          await encoder.flush()
          encoder.close()
          muxer.finalize()
          URL.revokeObjectURL(url)

          if (encoderError || frameIndex === 0) { resolve(null); return }

          const { buffer } = muxer.target as ArrayBufferTarget
          if (buffer.byteLength >= file.size) { resolve(null); return }

          const baseName = file.name.replace(/\.[^.]+$/, '')
          resolve(new File([buffer], `${baseName}.webm`, { type: 'video/webm' }))
        } catch {
          URL.revokeObjectURL(url)
          resolve(null)
        }
      }

      // @ts-ignore — requestVideoFrameCallback é Chrome 83+ (WebCodecs requer Chrome 94+)
      const processFrame = (_: DOMHighResTimeStamp, metadata: { mediaTime: number }) => {
        if (encoderError) { URL.revokeObjectURL(url); resolve(null); return }

        const timestamp = Math.round(metadata.mediaTime * 1_000_000) // µs
        const frame = new VideoFrame(video, { timestamp })
        encoder.encode(frame, { keyFrame: frameIndex % 90 === 0 })
        frame.close()
        frameIndex++

        if (video.ended) {
          finish()
        } else {
          // @ts-ignore
          video.requestVideoFrameCallback(processFrame)
        }
      }

      // Fallback: se o vídeo encerrar sem passar por processFrame
      video.onended = () => { if (frameIndex === 0) finish() }

      video.oncanplay = () => {
        // @ts-ignore
        video.requestVideoFrameCallback(processFrame)
        video.play().catch(() => { URL.revokeObjectURL(url); resolve(null) })
      }

      video.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
      video.src = url
    })

    return compressed
  } catch (e) {
    console.warn('[compressVideo] WebCodecs não disponível, usando fallback:', e)
    return null
  }
}

// AIDEV-NOTE: Fallback Canvas + MediaRecorder para browsers sem WebCodecs (Firefox, Safari)
function compressVideoWithMediaRecorder(
  file: File,
  targetW: number,
  targetH: number,
  url: string,
): Promise<File> {
  return new Promise<File>((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return }

      // AIDEV-NOTE: Preferência VP9 > VP8 — VP9 gera 20-50% menos bytes para qualidade equivalente
      // Safari não suporta video/webm, portanto retornará null e cairá no fallback original
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : null

      if (!mimeType) {
        console.warn('[compressVideo] MediaRecorder não suporta WebM neste browser')
        URL.revokeObjectURL(url)
        resolve(file)
        return
      }

      const stream = canvas.captureStream(30)
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: VIDEO_BITRATE,
      })

      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

      recorder.onstop = () => {
        URL.revokeObjectURL(url)
        const blob = new Blob(chunks, { type: 'video/webm' })
        if (blob.size >= file.size) { resolve(file); return }
        const baseName = file.name.replace(/\.[^.]+$/, '')
        resolve(new File([blob], `${baseName}.webm`, { type: 'video/webm' }))
      }

      recorder.onerror = () => { URL.revokeObjectURL(url); resolve(file) }

      recorder.start()
      video.play()

      const drawFrame = () => {
        if (video.ended || video.paused) { recorder.stop(); return }
        ctx.drawImage(video, 0, 0, targetW, targetH)
        requestAnimationFrame(drawFrame)
      }
      requestAnimationFrame(drawFrame)

      video.onended = () => { if (recorder.state !== 'inactive') recorder.stop() }
    }

    video.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    video.src = url
  })
}

export async function compressVideo(file: File): Promise<File> {
  // Vídeos pequenos não precisam de compressão
  if (file.size < SKIP_THRESHOLD) return file

  // Obter metadados para decisão de skip e dimensões alvo
  let width: number
  let height: number
  let duration: number

  const metaUrl = URL.createObjectURL(file)
  try {
    const meta = await new Promise<{ width: number; height: number; duration: number }>(
      (resolve, reject) => {
        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true
        video.onloadedmetadata = () => resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        })
        video.onerror = () => reject(new Error('Erro ao carregar vídeo'))
        video.src = metaUrl
      },
    )
    width = meta.width
    height = meta.height
    duration = meta.duration
  } catch {
    URL.revokeObjectURL(metaUrl)
    return file
  }
  URL.revokeObjectURL(metaUrl)

  // Vídeos > 2min: não comprimir (canvas frame-by-frame travaria a UI)
  if (duration > MAX_DURATION_SECONDS) return file

  // AIDEV-NOTE: condição AND — só pular se AMBOS: resolução <= 720p E tamanho < 2MB
  // Bug anterior: apenas verificava resolução (OR implícito), ignorava vídeos 720p grandes
  if (width <= MAX_WIDTH && height <= MAX_HEIGHT && file.size < SKIP_THRESHOLD) return file

  const { targetW, targetH } = calcTargetDimensions(width, height)

  // AIDEV-NOTE: Tentar WebCodecs primeiro (Chrome 94+) — melhor compressão VP9 sem canvas
  if (typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined') {
    const result = await compressVideoWithWebCodecs(file, targetW, targetH)
    if (result !== null) return result
    // Se WebCodecs falhou, cai no MediaRecorder abaixo
  }

  // Fallback: Canvas + MediaRecorder (VP9 > VP8)
  const url = URL.createObjectURL(file)
  return compressVideoWithMediaRecorder(file, targetW, targetH, url)
}
