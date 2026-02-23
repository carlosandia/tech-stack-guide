/**
 * AIDEV-NOTE: Compressão client-side de áudio importado (MP3/WAV/M4A)
 * Converte para OGG/Opus 64kbps via AudioContext + MediaRecorder
 * Áudios já em OGG ou < 200KB são retornados sem alteração
 */

const SKIP_THRESHOLD = 200 * 1024 // 200KB
const AUDIO_BITRATE = 64_000 // 64kbps

const COMPRESSIBLE_AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
  'audio/wave', 'audio/mp4', 'audio/m4a', 'audio/x-m4a',
  'audio/aac', 'audio/flac',
]

export async function compressAudio(file: File): Promise<File> {
  // Áudios pequenos não precisam de compressão
  if (file.size < SKIP_THRESHOLD) return file

  // OGG/Opus já é otimizado
  if (file.type.includes('ogg') || file.type.includes('opus')) return file

  // Só comprimir tipos conhecidos
  if (!COMPRESSIBLE_AUDIO_TYPES.includes(file.type)) return file

  // Verificar suporte do browser
  const mimeType = MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')
    ? 'audio/ogg; codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm; codecs=opus')
      ? 'audio/webm; codecs=opus'
      : null

  if (!mimeType) {
    console.warn('[compressAudio] MediaRecorder não suporta OGG/Opus neste browser')
    return file
  }

  try {
    const audioCtx = new AudioContext()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

    // Criar um OfflineAudioContext para renderizar o áudio
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate,
    )

    const source = offlineCtx.createBufferSource()
    source.buffer = audioBuffer

    // Criar MediaStreamDestination para capturar o áudio
    const dest = audioCtx.createMediaStreamDestination()
    const liveSource = audioCtx.createBufferSource()
    liveSource.buffer = audioBuffer
    liveSource.connect(dest)

    const recorder = new MediaRecorder(dest.stream, {
      mimeType,
      audioBitsPerSecond: AUDIO_BITRATE,
    })

    return new Promise<File>((resolve) => {
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

      recorder.onstop = () => {
        audioCtx.close()
        const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
        const blob = new Blob(chunks, { type: mimeType })
        // Se resultado maior que original, usar original
        if (blob.size >= file.size) {
          resolve(file)
          return
        }
        const baseName = file.name.replace(/\.[^.]+$/, '')
        resolve(new File([blob], `${baseName}.${ext}`, { type: mimeType }))
      }

      recorder.onerror = () => {
        audioCtx.close()
        resolve(file)
      }

      recorder.start()
      liveSource.start(0)

      // Parar gravação quando o áudio terminar
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop()
        liveSource.stop()
      }, (audioBuffer.duration * 1000) + 200) // +200ms de margem
    })
  } catch (err) {
    console.warn('[compressAudio] Erro ao comprimir:', err)
    return file
  }
}
