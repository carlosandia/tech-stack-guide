/**
 * AIDEV-NOTE: Upload de mídia (imagem, áudio, documento) para ações WhatsApp
 * Usa bucket chat-media (público) do Supabase Storage
 * Suporta gravação de áudio via MediaRecorder API
 */

import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Upload, Mic, MicOff, Loader2, X, FileAudio, Image, File } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage } from '@/shared/utils/compressMedia'

interface MediaUploaderProps {
  tipo: 'imagem' | 'audio' | 'documento'
  midiaUrl: string
  onUrlChange: (url: string) => void
}

export function MediaUploader({ tipo, midiaUrl, onUrlChange }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [gravando, setGravando] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getAccept = () => {
    switch (tipo) {
      case 'imagem': return 'image/*'
      case 'audio': return 'audio/*'
      case 'documento': return '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
      default: return '*/*'
    }
  }

  const getIcon = () => {
    switch (tipo) {
      case 'imagem': return <Image className="w-4 h-4" />
      case 'audio': return <FileAudio className="w-4 h-4" />
      case 'documento': return <File className="w-4 h-4" />
    }
  }

  const uploadFile = useCallback(async (file: File | Blob, fileName: string) => {
    setUploading(true)
    try {
      let fileToUpload: File | Blob = file
      if (tipo === 'imagem') {
        fileToUpload = await compressImage(file, fileName)
      }

      const ext = fileName.split('.').pop() || 'bin'
      const path = `automacoes/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('chat-media')
        .upload(path, fileToUpload, { upsert: true, cacheControl: '86400' })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(path)

      onUrlChange(urlData.publicUrl)
      toast.success('Arquivo enviado com sucesso')
    } catch (err) {
      console.error('[MediaUploader] Upload error:', err)
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }, [tipo, onUrlChange])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadFile(file, file.name)
    e.target.value = '' // reset input
  }, [uploadFile])

  // Gravação de áudio
  const iniciarGravacao = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        uploadFile(blob, `gravacao_${Date.now()}.webm`)
        setGravando(false)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setGravando(true)
    } catch {
      toast.error('Não foi possível acessar o microfone')
    }
  }, [uploadFile])

  const pararGravacao = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  const limparMidia = () => {
    onUrlChange('')
  }

  return (
    <div className="space-y-2">
      {/* Preview da mídia atual */}
      {midiaUrl && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50 border border-border">
          {getIcon()}
          <span className="text-xs text-foreground truncate flex-1">{midiaUrl.split('/').pop()}</span>
          <button type="button" onClick={limparMidia} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex items-center gap-2">
        {/* Upload de arquivo */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Anexar arquivo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={getAccept()}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Gravação de áudio (apenas para tipo audio) */}
        {tipo === 'audio' && (
          <button
            type="button"
            onClick={gravando ? pararGravacao : iniciarGravacao}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              gravando
                ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                : 'border-border hover:bg-accent'
            }`}
          >
            {gravando ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                Parar gravação
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                Gravar áudio
              </>
            )}
          </button>
        )}
      </div>

      {/* Fallback: campo URL manual */}
      <div>
        <label className="text-[11px] text-muted-foreground">Ou cole uma URL pública:</label>
        <input
          type="url"
          value={midiaUrl}
          onChange={e => onUrlChange(e.target.value)}
          placeholder="https://exemplo.com/arquivo.png"
          className="w-full mt-0.5 px-3 py-1.5 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
