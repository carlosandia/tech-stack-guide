/**
 * AIDEV-NOTE: Modal de composição de email (novo, responder, encaminhar)
 */

import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'

export type ComposerMode = 'novo' | 'responder' | 'encaminhar'

interface ComposeEmailModalProps {
  mode: ComposerMode
  isOpen: boolean
  onClose: () => void
  onSend: (data: {
    para_email: string
    cc_email?: string
    assunto: string
    corpo_html: string
  }) => void
  isSending: boolean
  defaults?: {
    para_email?: string
    assunto?: string
    corpo_html?: string
  }
}

export function ComposeEmailModal({
  mode,
  isOpen,
  onClose,
  onSend,
  isSending,
  defaults,
}: ComposeEmailModalProps) {
  const [para, setPara] = useState(defaults?.para_email || '')
  const [cc, setCc] = useState('')
  const [assunto, setAssunto] = useState(defaults?.assunto || '')
  const [corpo, setCorpo] = useState(defaults?.corpo_html || '')
  const [showCc, setShowCc] = useState(false)

  if (!isOpen) return null

  const titulo =
    mode === 'responder' ? 'Responder' : mode === 'encaminhar' ? 'Encaminhar' : 'Novo Email'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!para || !assunto) return
    onSend({
      para_email: para,
      cc_email: cc || undefined,
      assunto,
      corpo_html: corpo,
    })
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[400] bg-foreground/20" onClick={onClose} />

      {/* Modal */}
      <div className="fixed bottom-4 right-4 z-[401] w-[520px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-3 px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <label className="w-10 text-xs text-muted-foreground font-medium">Para</label>
              <input
                value={para}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPara(e.target.value)}
                placeholder="email@exemplo.com"
                className="flex-1 h-8 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                type="email"
                required
              />
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Cc
                </button>
              )}
            </div>

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

          {/* Corpo */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <textarea
              value={corpo}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCorpo(e.target.value)}
              placeholder="Escreva sua mensagem..."
              className="w-full min-h-[200px] text-sm resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-4 py-3 border-t border-border">
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
}
