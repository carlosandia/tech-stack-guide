/**
 * AIDEV-NOTE: Modal de composição de email com editor TipTap (RF-005, RF-006)
 * Suporta: novo, responder, responder todos, encaminhar
 * Inclui assinatura do usuário automaticamente + salvar como rascunho
 * Suporte a múltiplos anexos com compressão de imagens (max 25MB total)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, Loader2, FileText, Paperclip, Trash2, User, Search, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { EmailRichEditor } from './EmailRichEditor'
import { useAssinatura } from '../hooks/useEmails'
import { compressImage } from '@/shared/utils/compressMedia'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getOrganizacaoId } from '@/shared/services/auth-context'

export type ComposerMode = 'novo' | 'responder' | 'responder_todos' | 'encaminhar'

const MAX_TOTAL_SIZE = 25 * 1024 * 1024 // 25MB
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB por arquivo

// AIDEV-NOTE: Seg #4 — whitelist de MIME types permitidos para upload de anexos
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-zip-compressed',
])

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface ComposeEmailModalProps {
  mode: ComposerMode
  isOpen: boolean
  onClose: () => void
  onSend: (data: {
    para_email: string
    cc_email?: string
    bcc_email?: string
    assunto: string
    corpo_html: string
    anexos?: File[]
  }) => void
  onSaveDraft?: (data: {
    para_email?: string
    cc_email?: string
    bcc_email?: string
    assunto?: string
    corpo_html?: string
    tipo?: 'novo' | 'resposta' | 'encaminhar'
  }) => void
  isSending: boolean
  isSavingDraft?: boolean
  defaults?: {
    para_email?: string
    cc_email?: string
    assunto?: string
    corpo_html?: string
  }
  resetKey?: number
}

export const ComposeEmailModal = React.forwardRef<HTMLDivElement, ComposeEmailModalProps>(
  function ComposeEmailModalInner({
  mode,
  isOpen,
  onClose,
  onSend,
  onSaveDraft,
  isSending,
  isSavingDraft,
  defaults,
  resetKey = 0,
}, _ref) {
  const [para, setPara] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [anexos, setAnexos] = useState<File[]>([])
  const [contatoSearchOpen, setContatoSearchOpen] = useState(false)
  const [contatoSearch, setContatoSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contatoRef = useRef<HTMLDivElement>(null)

  const { data: assinatura } = useAssinatura()

  // Busca contatos para inserir no campo "Para"
  const { data: contatosBusca, isFetching: buscandoContatos } = useQuery({
    queryKey: ['contatos-email-picker', contatoSearch],
    queryFn: async () => {
      // AIDEV-NOTE: Seg #6 — filtro por organizacao_id obrigatório para isolamento de tenant
      const orgId = await getOrganizacaoId()
      let query = supabase
        .from('contatos')
        .select('id, nome, sobrenome, email, tipo')
        .eq('organizacao_id', orgId)
        .eq('tipo', 'pessoa')
        .is('deletado_em', null)
        .not('email', 'is', null)
        .limit(8)

      if (contatoSearch.trim().length > 0) {
        // AIDEV-NOTE: Seg #7 — escape de caracteres especiais do LIKE
        const buscaEscapada = contatoSearch.replace(/[%_\\]/g, '\\$&')
        query = query.or(`nome.ilike.%${buscaEscapada}%,sobrenome.ilike.%${buscaEscapada}%,email.ilike.%${buscaEscapada}%`)
      }

      const { data } = await query.order('nome')
      return data || []
    },
    enabled: contatoSearchOpen,
    staleTime: 10000,
  })

  // Fechar popover ao clicar fora
  useEffect(() => {
    if (!contatoSearchOpen) return
    function handleClick(e: MouseEvent) {
      if (contatoRef.current && !contatoRef.current.contains(e.target as Node)) {
        setContatoSearchOpen(false)
        setContatoSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [contatoSearchOpen])

  const totalAnexosSize = anexos.reduce((acc, f) => acc + f.size, 0)

  const buildInitialContent = () => {
    const defaultBody = defaults?.corpo_html || ''
    let signatureHtml = ''

    const isNewEmail = mode === 'novo'
    const isReplyOrForward = mode === 'responder' || mode === 'responder_todos' || mode === 'encaminhar'

    if (assinatura?.assinatura_html) {
      const shouldInclude =
        (isNewEmail && assinatura.incluir_em_novos !== false) ||
        (isReplyOrForward && assinatura.incluir_em_respostas !== false)

      if (shouldInclude) {
        signatureHtml = `<br/><div class="email-signature" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">${assinatura.assinatura_html}</div>`
      }
    }

    if (isNewEmail) return signatureHtml
    return signatureHtml + defaultBody
  }

  useEffect(() => {
    setPara(defaults?.para_email || '')
    setCc(defaults?.cc_email || '')
    setBcc('')
    setAssunto(defaults?.assunto || '')
    setCorpo(buildInitialContent())
    setShowCc(!!defaults?.cc_email)
    setShowBcc(false)
    setEditorKey((k) => k + 1)
    setAnexos([])
  }, [resetKey, assinatura]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newFiles: File[] = []
    let currentTotal = totalAnexosSize

    for (const file of Array.from(files)) {
      // AIDEV-NOTE: Seg #4 — validação de MIME type antes de processar
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        toast.error(`${file.name}: tipo de arquivo não permitido`)
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} excede o limite de 20MB`)
        continue
      }

      // Comprimir imagens
      const processed = await compressImage(file, file.name) as File
      
      if (currentTotal + processed.size > MAX_TOTAL_SIZE) {
        toast.error('Limite total de 25MB atingido')
        break
      }

      currentTotal += processed.size
      newFiles.push(processed)
    }

    if (newFiles.length > 0) {
      setAnexos(prev => [...prev, ...newFiles])
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [totalAnexosSize])

  const removeAnexo = useCallback((index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index))
  }, [])

  if (!isOpen) return null

  const titulos: Record<ComposerMode, string> = {
    novo: 'Novo Email',
    responder: 'Responder',
    responder_todos: 'Responder Todos',
    encaminhar: 'Encaminhar',
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!para || !assunto) return
    onSend({
      para_email: para,
      cc_email: cc || undefined,
      bcc_email: bcc || undefined,
      assunto,
      corpo_html: corpo,
      anexos: anexos.length > 0 ? anexos : undefined,
    })
  }

  const handleSaveDraft = () => {
    if (!onSaveDraft) return
    const tipoMap: Record<ComposerMode, 'novo' | 'resposta' | 'encaminhar'> = {
      novo: 'novo',
      responder: 'resposta',
      responder_todos: 'resposta',
      encaminhar: 'encaminhar',
    }
    onSaveDraft({
      para_email: para || undefined,
      cc_email: cc || undefined,
      bcc_email: bcc || undefined,
      assunto: assunto || undefined,
      corpo_html: corpo || undefined,
      tipo: tipoMap[mode],
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-foreground/20" onClick={onClose} />
      <div className="fixed bottom-4 right-4 z-[401] w-[560px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{titulos[mode]}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-3 px-4 py-3 border-b border-border/60">
            {/* Para */}
            <div className="flex items-center gap-2">
              <label className="w-10 text-xs text-muted-foreground font-medium">Para</label>
              <div className="flex-1 relative flex items-center gap-1">
                <input
                  value={para}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPara(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="flex-1 h-8 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  type="email"
                  required
                />
                {/* Botão buscar contato */}
                <div className="relative" ref={contatoRef}>
                  <button
                    type="button"
                    onClick={() => setContatoSearchOpen(!contatoSearchOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-md border border-input hover:bg-accent transition-colors text-muted-foreground hover:text-primary flex-shrink-0"
                    title="Buscar contato"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {contatoSearchOpen && (
                    <div className="absolute right-0 top-full mt-1 w-72 bg-background border border-border rounded-lg shadow-lg z-[600] py-1">
                      <div className="px-2 py-1.5">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={contatoSearch}
                            onChange={(e) => setContatoSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="max-h-[200px] overflow-y-auto">
                        {buscandoContatos && (
                          <div className="flex items-center justify-center py-3">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        )}

                        {!buscandoContatos && contatosBusca && contatosBusca.length === 0 && (
                          <p className="px-3 py-2 text-xs text-muted-foreground text-center">
                            Nenhum contato com email encontrado
                          </p>
                        )}

                        {!buscandoContatos && contatosBusca?.map((c) => {
                          const nomeDisplay = [c.nome, c.sobrenome].filter(Boolean).join(' ') || '(sem nome)'
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                if (c.email) {
                                  setPara(c.email)
                                  setContatoSearchOpen(false)
                                  setContatoSearch('')
                                }
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                            >
                              <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{nomeDisplay}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {!showCc && (
                  <button type="button" onClick={() => setShowCc(true)} className="text-xs text-muted-foreground hover:text-primary">
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button type="button" onClick={() => setShowBcc(true)} className="text-xs text-muted-foreground hover:text-primary">
                    Bcc
                  </button>
                )}
              </div>
            </div>

            {/* Cc */}
            {showCc && (
              <div className="flex items-center gap-2">
                <label className="w-10 text-xs text-muted-foreground font-medium">Cc</label>
                <input
                  value={cc}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCc(e.target.value)}
                  placeholder="cc@exemplo.com"
                  className="flex-1 h-8 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  type="email"
                />
              </div>
            )}

            {/* Bcc */}
            {showBcc && (
              <div className="flex items-center gap-2">
                <label className="w-10 text-xs text-muted-foreground font-medium">Bcc</label>
                <input
                  value={bcc}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBcc(e.target.value)}
                  placeholder="bcc@exemplo.com"
                  className="flex-1 h-8 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  type="email"
                />
              </div>
            )}

            {/* Assunto */}
            <div className="flex items-center gap-2">
              <label className="w-10 text-xs text-muted-foreground font-medium">Assunto</label>
              <input
                value={assunto}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssunto(e.target.value)}
                placeholder="Assunto do email"
                className="flex-1 h-8 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          {/* Editor TipTap */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <EmailRichEditor key={editorKey} content={corpo} onChange={setCorpo} minHeight="180px" />
          </div>

          {/* Anexos */}
          {anexos.length > 0 && (
            <div className="px-4 py-2 border-t border-border/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {anexos.length} anexo{anexos.length > 1 ? 's' : ''} ({formatFileSize(totalAnexosSize)} / 25MB)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {anexos.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-foreground border border-border/40"
                  >
                    <Paperclip className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                    <button
                      type="button"
                      onClick={() => removeAnexo(idx)}
                      className="p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              {onSaveDraft && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors"
                >
                  {isSavingDraft ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Rascunho
                </button>
              )}
              {/* Botão de anexo */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleAddFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Anexar arquivos (max 25MB total)"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={isSending || !para || !assunto}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar
            </button>
          </div>
        </form>
      </div>
    </>
  )
})

ComposeEmailModal.displayName = 'ComposeEmailModal'
