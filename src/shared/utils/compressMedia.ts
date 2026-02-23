/**
 * AIDEV-NOTE: Utilitário compartilhado de compressão client-side
 * Comprime imagens via Canvas API antes do upload ao Storage
 * Inclui validateFileSize para limitar uploads por tipo
 */

const COMPRESSIBLE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// AIDEV-NOTE: Limites de tamanho por tipo de arquivo para evitar uploads excessivos
const FILE_SIZE_LIMITS: Record<string, { max: number; label: string }> = {
  image: { max: 10 * 1024 * 1024, label: '10 MB' },
  video: { max: 30 * 1024 * 1024, label: '30 MB' },
  audio: { max: 10 * 1024 * 1024, label: '10 MB' },
  document: { max: 15 * 1024 * 1024, label: '15 MB' },
}

/**
 * Valida se o arquivo está dentro do limite de tamanho para o tipo.
 * @returns null se OK, ou string de erro se exceder
 */
export function validateFileSize(file: File, tipo: string): string | null {
  const limit = FILE_SIZE_LIMITS[tipo] || FILE_SIZE_LIMITS.document
  if (file.size > limit.max) {
    return `Arquivo excede o limite de ${limit.label} para ${tipo}`
  }
  return null
}
const MAX_DIMENSION = 1920
const COMPRESS_QUALITY = 0.8

/**
 * Comprime imagens (JPEG/PNG/WebP) redimensionando para max 1920px
 * e convertendo para JPEG com qualidade 0.8.
 * Retorna o arquivo original se não for imagem comprimível ou se já for pequeno.
 */
export async function compressImage(file: File | Blob, fileName?: string): Promise<File | Blob> {
  const type = file instanceof File ? file.type : (file as Blob).type
  if (!COMPRESSIBLE_IMAGE_TYPES.includes(type)) return file

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      // Skip if already small
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size < 500 * 1024) {
        resolve(file)
        return
      }

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return }
          const name = fileName || (file instanceof File ? file.name : 'image')
          const baseName = name.replace(/\.[^.]+$/, '')
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        COMPRESS_QUALITY,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}
