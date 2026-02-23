/**
 * AIDEV-NOTE: Compressão client-side de vídeo via Canvas + MediaRecorder
 * Redimensiona para max 720p (1280x720) e re-encoda em WebM VP8 a 1Mbps
 * Vídeos < 2MB ou já em 720p são retornados sem alteração
 */

const MAX_WIDTH = 1280
const MAX_HEIGHT = 720
const VIDEO_BITRATE = 1_000_000 // 1 Mbps
const SKIP_THRESHOLD = 2 * 1024 * 1024 // 2MB

export async function compressVideo(file: File): Promise<File> {
  // Vídeos pequenos não precisam de compressão
  if (file.size < SKIP_THRESHOLD) return file

  return new Promise<File>((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight } = video

      // Se já é 720p ou menor e < 2MB, pular
      if (videoWidth <= MAX_WIDTH && videoHeight <= MAX_HEIGHT) {
        URL.revokeObjectURL(url)
        resolve(file)
        return
      }

      // Calcular dimensões alvo mantendo aspect ratio
      let targetW = videoWidth
      let targetH = videoHeight
      if (targetW > MAX_WIDTH || targetH > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / targetW, MAX_HEIGHT / targetH)
        targetW = Math.round(targetW * ratio)
        targetH = Math.round(targetH * ratio)
      }
      // Garantir dimensões pares (requisito de codecs)
      targetW = targetW % 2 === 0 ? targetW : targetW + 1
      targetH = targetH % 2 === 0 ? targetH : targetH + 1

      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return }

      // AIDEV-NOTE: Verificar suporte a MediaRecorder com VP8/WebM
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
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
        // Se o resultado for maior que o original, usar original
        if (blob.size >= file.size) {
          resolve(file)
          return
        }
        const baseName = file.name.replace(/\.[^.]+$/, '')
        resolve(new File([blob], `${baseName}.webm`, { type: 'video/webm' }))
      }

      recorder.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(file)
      }

      recorder.start()

      // Desenhar frames do vídeo no canvas
      video.play()
      const drawFrame = () => {
        if (video.ended || video.paused) {
          recorder.stop()
          return
        }
        ctx.drawImage(video, 0, 0, targetW, targetH)
        requestAnimationFrame(drawFrame)
      }
      requestAnimationFrame(drawFrame)

      video.onended = () => {
        if (recorder.state !== 'inactive') recorder.stop()
      }
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    video.src = url
  })
}
