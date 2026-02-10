/**
 * AIDEV-NOTE: Seletor visual de template de layout para popup
 * 6 templates pré-definidos + upload/URL de imagem
 * Usa compressMedia.ts para compressão client-side
 */

import { useState, useRef } from 'react'
import { ImagePlus, Link2, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/shared/utils/compressMedia'
import { toast } from 'sonner'

export type PopupTemplate =
  | 'so_campos'
  | 'so_imagem'
  | 'imagem_esquerda'
  | 'imagem_direita'
  | 'imagem_topo'
  | 'imagem_fundo'
  | 'imagem_lateral_full'

interface Props {
  formularioId: string
  template: PopupTemplate
  imagemUrl: string | null
  imagemLink?: string | null
  onChangeTemplate: (t: PopupTemplate) => void
  onChangeImagemUrl: (url: string | null) => void
  onChangeImagemLink?: (link: string | null) => void
}

const TEMPLATES: { value: PopupTemplate; label: string }[] = [
  { value: 'so_campos', label: 'Sem imagem' },
  { value: 'so_imagem', label: 'Só imagem' },
  { value: 'imagem_esquerda', label: 'Imagem à esquerda' },
  { value: 'imagem_direita', label: 'Imagem à direita' },
  { value: 'imagem_topo', label: 'Imagem no topo' },
  { value: 'imagem_fundo', label: 'Imagem de fundo' },
  { value: 'imagem_lateral_full', label: 'Lateral 50/50' },
]

/** Mini-preview SVG para cada template */
function MiniPreview({ template, active }: { template: PopupTemplate; active: boolean }) {
  const base = 'w-full h-full'
  return (
    <div
      className={cn(
        'w-[80px] h-[60px] rounded border-2 overflow-hidden flex-shrink-0 transition-colors',
        active ? 'border-primary bg-primary/5' : 'border-border bg-muted/50 hover:border-muted-foreground/40'
      )}
    >
      <svg viewBox="0 0 80 60" className={base}>
        {template === 'so_campos' && (
          <>
            <rect x="10" y="8" width="60" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="10" y="18" width="60" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="10" y="28" width="60" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="20" y="42" width="40" height="10" rx="2" className="fill-primary/60" />
          </>
        )}
        {template === 'so_imagem' && (
          <>
            <rect x="0" y="0" width="80" height="60" className="fill-primary/20" />
            <rect x="28" y="20" width="24" height="18" rx="2" className="fill-primary/40" />
          </>
        )}
        {template === 'imagem_esquerda' && (
          <>
            <rect x="0" y="0" width="32" height="60" className="fill-primary/20" />
            <rect x="12" y="24" width="8" height="8" rx="1" className="fill-primary/40" />
            <rect x="38" y="8" width="36" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="38" y="18" width="36" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="38" y="28" width="36" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="42" y="42" width="28" height="10" rx="2" className="fill-primary/60" />
          </>
        )}
        {template === 'imagem_direita' && (
          <>
            <rect x="48" y="0" width="32" height="60" className="fill-primary/20" />
            <rect x="60" y="24" width="8" height="8" rx="1" className="fill-primary/40" />
            <rect x="6" y="8" width="36" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="6" y="18" width="36" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="6" y="28" width="36" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="10" y="42" width="28" height="10" rx="2" className="fill-primary/60" />
          </>
        )}
        {template === 'imagem_topo' && (
          <>
            <rect x="0" y="0" width="80" height="24" className="fill-primary/20" />
            <rect x="32" y="8" width="16" height="8" rx="1" className="fill-primary/40" />
            <rect x="10" y="30" width="60" height="5" rx="1" className="fill-muted-foreground/30" />
            <rect x="10" y="38" width="60" height="5" rx="1" className="fill-muted-foreground/30" />
            <rect x="20" y="48" width="40" height="8" rx="2" className="fill-primary/60" />
          </>
        )}
        {template === 'imagem_fundo' && (
          <>
            <rect x="0" y="0" width="80" height="60" className="fill-primary/15" />
            <rect x="0" y="0" width="80" height="60" className="fill-foreground/10" />
            <rect x="10" y="10" width="60" height="6" rx="1" className="fill-background/80" />
            <rect x="10" y="20" width="60" height="6" rx="1" className="fill-background/80" />
            <rect x="20" y="38" width="40" height="10" rx="2" className="fill-primary/60" />
          </>
        )}
        {template === 'imagem_lateral_full' && (
          <>
            <rect x="0" y="0" width="40" height="60" className="fill-primary/20" />
            <rect x="14" y="24" width="12" height="10" rx="1" className="fill-primary/40" />
            <rect x="46" y="8" width="28" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="46" y="18" width="28" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="46" y="28" width="28" height="6" rx="1" className="fill-muted-foreground/30" />
            <rect x="48" y="42" width="24" height="10" rx="2" className="fill-primary/60" />
          </>
        )}
      </svg>
    </div>
  )
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function PopupLayoutSelector({ formularioId, template, imagemUrl, imagemLink, onChangeTemplate, onChangeImagemUrl, onChangeImagemLink }: Props) {
  const [modo, setModo] = useState<'upload' | 'url'>(imagemUrl?.startsWith('http') ? 'url' : 'upload')
  const [urlInput, setUrlInput] = useState(imagemUrl || '')
  const [linkInput, setLinkInput] = useState(imagemLink || '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const needsImage = template !== 'so_campos'

  const handleUpload = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Formato não suportado. Use JPG, PNG ou WebP.')
      return
    }

    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const ext = compressed instanceof File ? compressed.name.split('.').pop() : 'jpg'
      const path = `${formularioId}/popup-image.${ext}`

      const { error } = await supabase.storage
        .from('formularios')
        .upload(path, compressed, { upsert: true })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('formularios')
        .getPublicUrl(path)

      onChangeImagemUrl(urlData.publicUrl + '?t=' + Date.now())
      toast.success('Imagem enviada com sucesso')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    try {
      // Try to delete from storage
      await supabase.storage
        .from('formularios')
        .remove([`${formularioId}/popup-image.jpg`, `${formularioId}/popup-image.png`, `${formularioId}/popup-image.webp`])
    } catch {
      // ignore
    }
    onChangeImagemUrl(null)
    setUrlInput('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold">Layout do Popup</Label>

      {/* Template grid */}
      <div className="grid grid-cols-3 gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChangeTemplate(t.value)}
            className="flex flex-col items-center gap-1 group"
          >
            <MiniPreview template={t.value} active={template === t.value} />
            <span className={cn(
              'text-[10px] leading-tight text-center',
              template === t.value ? 'text-primary font-medium' : 'text-muted-foreground'
            )}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Image config - only when template needs image */}
      {needsImage && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setModo('upload')}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                modo === 'upload' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <ImagePlus className="w-3 h-3 inline mr-1" />Upload
            </button>
            <button
              type="button"
              onClick={() => setModo('url')}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                modo === 'url' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Link2 className="w-3 h-3 inline mr-1" />URL
            </button>
          </div>

          {modo === 'upload' && (
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f)
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Enviando...</> : <><ImagePlus className="w-3 h-3 mr-1" />Escolher imagem</>}
              </Button>
            </div>
          )}

          {modo === 'url' && (
            <div className="space-y-1">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onBlur={() => {
                  if (urlInput.trim()) onChangeImagemUrl(urlInput.trim())
                }}
                placeholder="https://exemplo.com/imagem.jpg"
                className="text-xs"
              />
            </div>
          )}

          {/* Preview */}
          {imagemUrl && (
            <div className="relative">
              <img
                src={imagemUrl}
                alt="Preview popup"
                className="max-h-32 w-full object-cover rounded border border-border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={handleRemoveImage}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Link da imagem */}
          {onChangeImagemLink && (
            <div className="space-y-1">
              <Label className="text-xs">Link da imagem (ao clicar)</Label>
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onBlur={() => onChangeImagemLink(linkInput.trim() || null)}
                placeholder="https://seusite.com (opcional)"
                className="text-xs"
                type="url"
              />
              <p className="text-[10px] text-muted-foreground">Se preenchido, a imagem será clicável e abrirá este link.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
