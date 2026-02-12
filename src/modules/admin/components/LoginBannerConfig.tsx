import { useState, useCallback, useRef } from 'react'
import { Upload, Trash2, Save, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useConfigGlobais, useUpdateConfigGlobal } from '../hooks/useConfigGlobal'
import { compressImage } from '@/shared/utils/compressMedia'

/**
 * AIDEV-NOTE: Componente de configuração do banner de login
 * Permite upload de imagens para Desktop, Tablet e Mobile
 * Salva URLs no JSONB de configuracoes_globais (plataforma = 'login_banner')
 */

interface BannerSlot {
  key: 'desktop_image_url' | 'tablet_image_url' | 'mobile_image_url'
  label: string
  dimensao: string
  aspecto: string
}

const SLOTS: BannerSlot[] = [
  { key: 'desktop_image_url', label: 'Desktop', dimensao: '960 × 1080px', aspecto: '9:10' },
  { key: 'tablet_image_url', label: 'Tablet', dimensao: '768 × 1024px', aspecto: '3:4' },
  { key: 'mobile_image_url', label: 'Mobile', dimensao: '390 × 300px', aspecto: '13:10' },
]

const BUCKET = 'login-banner'

export function LoginBannerConfig() {
  const { data: configs } = useConfigGlobais()
  const updateMutation = useUpdateConfigGlobal()
  const [uploading, setUploading] = useState<string | null>(null)
  const [localValues, setLocalValues] = useState<Record<string, string>>({})

  const config = configs?.find((c) => c.plataforma === 'login_banner')
  const currentConfig = config?.configuracoes as Record<string, string> | undefined

  const getVal = (key: string) => localValues[key] ?? currentConfig?.[key] ?? ''

  const hasChanges = Object.keys(localValues).length > 0

  const handleUpload = useCallback(async (slot: BannerSlot, file: File) => {
    setUploading(slot.key)
    try {
      const compressed = await compressImage(file, `${slot.key}.jpg`)
      const fileName = `${slot.key.replace('_image_url', '')}.jpg`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, compressed, { upsert: true, cacheControl: '3600' })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath)

      // Adicionar timestamp para cache busting
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`
      setLocalValues((prev) => ({ ...prev, [slot.key]: publicUrl }))
      toast.success(`Imagem ${slot.label} enviada!`)
    } catch (err) {
      toast.error(`Erro ao enviar imagem: ${(err as Error).message}`)
    } finally {
      setUploading(null)
    }
  }, [])

  const handleRemove = useCallback((slot: BannerSlot) => {
    setLocalValues((prev) => ({ ...prev, [slot.key]: '' }))
  }, [])

  const handleSave = useCallback(() => {
    const merged = {
      desktop_image_url: getVal('desktop_image_url'),
      tablet_image_url: getVal('tablet_image_url'),
      mobile_image_url: getVal('mobile_image_url'),
      link_url: getVal('link_url'),
      background_color: getVal('background_color') || '#F8FAFC',
    }

    updateMutation.mutate(
      { plataforma: 'login_banner', configuracoes: merged },
      {
        onSuccess: () => {
          toast.success('Banner de login salvo!')
          setLocalValues({})
        },
        onError: (err) => toast.error(`Erro: ${err.message}`),
      }
    )
  }, [localValues, currentConfig, updateMutation])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Banner de Login</h2>
        <p className="text-sm text-muted-foreground">
          Configure as imagens exibidas na tela de login para cada tamanho de tela.
        </p>
      </div>

      {/* Slots de upload */}
      <div className="grid gap-6 md:grid-cols-3">
        {SLOTS.map((slot) => (
          <BannerUploadSlot
            key={slot.key}
            slot={slot}
            currentUrl={getVal(slot.key)}
            isUploading={uploading === slot.key}
            onUpload={(file) => handleUpload(slot, file)}
            onRemove={() => handleRemove(slot)}
          />
        ))}
      </div>

      {/* Cor de fundo fallback */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Cor de Fundo (fallback)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={getVal('background_color') || '#F8FAFC'}
              onChange={(e) =>
                setLocalValues((prev) => ({ ...prev, background_color: e.target.value }))
              }
              className="w-10 h-10 rounded-md border border-input cursor-pointer"
            />
            <input
              type="text"
              value={getVal('background_color') || '#F8FAFC'}
              onChange={(e) =>
                setLocalValues((prev) => ({ ...prev, background_color: e.target.value }))
              }
              placeholder="#F8FAFC"
              className="w-32 h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Exibida quando não houver imagem ou durante carregamento
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Link do Banner (opcional)
          </label>
          <input
            type="url"
            value={getVal('link_url')}
            onChange={(e) =>
              setLocalValues((prev) => ({ ...prev, link_url: e.target.value }))
            }
            placeholder="https://..."
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            URL aberta ao clicar no banner (nova aba)
          </p>
        </div>
      </div>

      {/* Salvar */}
      <div className="flex justify-end pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Alterações
        </button>
      </div>
    </div>
  )
}

// Componente de slot individual de upload
function BannerUploadSlot({
  slot,
  currentUrl,
  isUploading,
  onUpload,
  onRemove,
}: {
  slot: BannerSlot
  currentUrl: string
  isUploading: boolean
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{slot.label}</label>
        <span className="text-xs text-muted-foreground">{slot.dimensao}</span>
      </div>

      <div
        className="relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center"
        style={{ aspectRatio: slot.aspecto.replace(':', '/') }}
      >
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt={`Banner ${slot.label}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-foreground/0 hover:bg-foreground/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="p-2 bg-background rounded-md shadow-md"
                >
                  <Upload className="w-4 h-4 text-foreground" />
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="p-2 bg-background rounded-md shadow-md"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-4"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <ImageIcon className="w-8 h-8" />
            )}
            <span className="text-xs">{isUploading ? 'Enviando...' : 'Clique para enviar'}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
