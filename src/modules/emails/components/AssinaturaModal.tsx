/**
 * AIDEV-NOTE: Modal de configuração de assinatura de email (RF-012)
 * Editor TipTap + checkboxes de inclusão
 */

import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { EmailRichEditor } from './EmailRichEditor'
import { useAssinatura, useSalvarAssinatura } from '../hooks/useEmails'

interface AssinaturaModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AssinaturaModal({ isOpen, onClose }: AssinaturaModalProps) {
  const { data: assinatura, isLoading } = useAssinatura()
  const salvar = useSalvarAssinatura()
  const [html, setHtml] = useState('')
  const [incluirRespostas, setIncluirRespostas] = useState(true)
  const [incluirNovos, setIncluirNovos] = useState(true)
  const [editorKey, setEditorKey] = useState(0)

  useEffect(() => {
    if (assinatura) {
      setHtml(assinatura.assinatura_html || '')
      setIncluirRespostas(assinatura.incluir_em_respostas)
      setIncluirNovos(assinatura.incluir_em_novos)
      setEditorKey((k) => k + 1)
    }
  }, [assinatura])

  if (!isOpen) return null

  const handleSave = () => {
    salvar.mutate(
      {
        assinatura_html: html || null,
        incluir_em_respostas: incluirRespostas,
        incluir_em_novos: incluirNovos,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-foreground/20" onClick={onClose} />
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[401] w-auto md:w-[560px] max-h-[80vh] bg-background border border-border rounded-lg shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Assinatura de Email</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <EmailRichEditor key={editorKey} content={html} onChange={setHtml} minHeight="150px" />
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirNovos}
                    onChange={(e) => setIncluirNovos(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-foreground">Incluir em novos emails</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirRespostas}
                    onChange={(e) => setIncluirRespostas(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-foreground">Incluir em respostas e encaminhamentos</span>
                </label>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="h-8 px-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={salvar.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {salvar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>
    </>
  )
}
