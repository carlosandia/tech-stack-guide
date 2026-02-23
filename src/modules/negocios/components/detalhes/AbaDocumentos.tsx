/**
 * AIDEV-NOTE: Aba Documentos (RF-14.3 Tab 3) - Implementação completa
 * Upload drag&drop, lista, download, preview, exclusão soft delete
 * Inclui: barra de progresso visual, feedback de cota e deduplicação
 */

import { useState, useCallback, useRef } from 'react'
import { FileText, Upload, Download, Trash2, File, Image, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  useDocumentosOportunidade,
  useUploadDocumento,
  useExcluirDocumento,
} from '../../hooks/useDetalhes'
import { detalhesApi, type Documento } from '../../services/detalhes.api'

interface AbaDocumentosProps {
  oportunidadeId: string
}

interface UploadingFile {
  name: string
  size: number
  progress: number // 0-100 simulado
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(tipo: string) {
  if (tipo.startsWith('image/')) return Image
  if (tipo.includes('spreadsheet') || tipo.includes('excel') || tipo.includes('csv')) return FileSpreadsheet
  if (tipo.includes('pdf')) return FileText
  return File
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.txt'

export function AbaDocumentos({ oportunidadeId }: AbaDocumentosProps) {
  const { data: documentos, isLoading } = useDocumentosOportunidade(oportunidadeId)
  const uploadDoc = useUploadDocumento()
  const excluirDoc = useExcluirDocumento()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  // AIDEV-NOTE: Progresso simulado baseado no tamanho do arquivo
  const simulateProgress = useCallback((fileName: string, fileSize: number) => {
    const steps = Math.max(3, Math.min(10, Math.ceil(fileSize / (1024 * 1024))))
    const increment = 90 / steps
    let step = 0

    const interval = setInterval(() => {
      step++
      if (step >= steps) {
        clearInterval(interval)
        return
      }
      setUploadingFiles(prev =>
        prev.map(f => f.name === fileName ? { ...f, progress: Math.min(90, f.progress + increment) } : f)
      )
    }, 300)

    return () => clearInterval(interval)
  }, [])

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: arquivo muito grande (máx. 10MB)`)
        continue
      }

      // Adicionar à lista de uploading
      setUploadingFiles(prev => [...prev, { name: file.name, size: file.size, progress: 5 }])
      const stopProgress = simulateProgress(file.name, file.size)

      try {
        await uploadDoc.mutateAsync({ oportunidadeId, file })
        // Completar progresso
        setUploadingFiles(prev =>
          prev.map(f => f.name === file.name ? { ...f, progress: 100 } : f)
        )
        toast.success(`${file.name} enviado`)
      } catch (err: any) {
        const msg = err?.message || ''
        if (msg.startsWith('COTA_EXCEDIDA:')) {
          toast.error(msg.replace('COTA_EXCEDIDA:', ''))
        } else {
          toast.error(`Erro ao enviar ${file.name}`)
        }
      } finally {
        stopProgress()
        // Remover da lista após breve delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.name !== file.name))
        }, 800)
      }
    }
  }, [oportunidadeId, uploadDoc, simulateProgress])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }, [handleUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDownload = useCallback(async (doc: Documento) => {
    try {
      const url = await detalhesApi.getDocumentoUrl(doc.storage_path)
      window.open(url, '_blank')
    } catch {
      toast.error('Erro ao gerar link de download')
    }
  }, [])

  const handleExcluir = useCallback(async (doc: Documento) => {
    try {
      await excluirDoc.mutateAsync({ documentoId: doc.id, storagePath: doc.storage_path })
      toast.success('Documento excluído')
    } catch {
      toast.error('Erro ao excluir documento')
    }
  }, [excluirDoc])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isUploading = uploadingFiles.length > 0

  return (
    <div className="space-y-4">
      {/* Zona de upload drag & drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-all
          ${isUploading ? 'cursor-default' : 'cursor-pointer'}
          ${isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/30'
          }
        `}
      >
        {isUploading ? (
          <div className="space-y-2">
            {uploadingFiles.map(uf => (
              <div key={uf.name} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                  <p className="text-xs text-foreground truncate flex-1 text-left">{uf.name}</p>
                  <span className="text-[10px] text-muted-foreground">{Math.round(uf.progress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-md h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-md transition-all duration-300 ease-out"
                    style={{ width: `${uf.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <Upload className={`w-6 h-6 mx-auto mb-2 ${isDragOver ? 'text-primary' : 'text-muted-foreground/40'}`} />
            <p className="text-xs text-muted-foreground">
              Arraste arquivos ou clique para enviar
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              PDF, DOC, XLS, JPG, PNG — máx. 10MB
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={e => {
            if (e.target.files) handleUpload(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* Lista de documentos */}
      {(!documentos || documentos.length === 0) ? (
        <div className="text-center py-4">
          <FileText className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground">Nenhum documento anexado</p>
        </div>
      ) : (
        <div className="space-y-1">
          {documentos.map(doc => {
            const IconComp = getFileIcon(doc.tipo_arquivo || '')
            return (
              <div
                key={doc.id}
                className="group flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
              >
                <IconComp className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{doc.nome_arquivo}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(doc.tamanho_bytes || 0)}
                    {doc.usuario && ` • ${doc.usuario.nome}`}
                    {' • '}
                    {format(parseISO(doc.criado_em), 'dd/MM/yy', { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExcluir(doc)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
