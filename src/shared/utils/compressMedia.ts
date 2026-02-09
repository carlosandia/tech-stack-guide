/**
 * AIDEV-NOTE: Utilitário compartilhado de compressão client-side
 * Comprime imagens via Canvas API antes do upload ao Storage
 */

const COMPRESSIBLE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
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
