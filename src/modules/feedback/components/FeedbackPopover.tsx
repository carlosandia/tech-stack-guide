/**
 * AIDEV-NOTE: Popover de envio de Feedback (PRD-15)
 * Formulario com tipo, descricao, contador e envio
 */

import { useState } from 'react'
import { useCriarFeedback } from '../hooks/useFeedback'
import type { TipoFeedback } from '../services/feedback.api'
import {
  Lightbulb,
  Bug,
  HelpCircle,
  Loader2,
  X,
} from 'lucide-react'

interface FeedbackPopoverProps {
  onClose: () => void
}

const TIPOS: { value: TipoFeedback; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'bug', label: 'Bug', icon: Bug, color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' },
  { value: 'sugestao', label: 'Sugestão', icon: Lightbulb, color: 'text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100' },
  { value: 'duvida', label: 'Dúvida', icon: HelpCircle, color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' },
]

const MIN_CHARS = 10
const MAX_CHARS = 10000

export function FeedbackPopover({ onClose }: FeedbackPopoverProps) {
  const [tipo, setTipo] = useState<TipoFeedback>('sugestao')
  const [descricao, setDescricao] = useState('')
  const criarFeedback = useCriarFeedback()

  const charCount = descricao.length
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS

  const handleSubmit = async () => {
    if (!isValid) return
    await criarFeedback.mutateAsync({ tipo, descricao })
    setDescricao('')
    setTipo('sugestao')
    onClose()
  }

  return (
    <div className="w-[360px] sm:w-[400px] bg-background rounded-lg shadow-xl border border-border overflow-hidden">
      {/* Header com gradiente */}
      <div
        className="px-5 py-4 text-white"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-semibold text-base">Nos ajude a melhorar</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-white/80 mt-1">
          Sua opinião é essencial para evoluirmos o produto.
        </p>
      </div>

      {/* Corpo */}
      <div className="p-5 space-y-4">
        {/* Seletor de Tipo */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Tipo</label>
          <div className="flex gap-2">
            {TIPOS.map((t) => {
              const Icon = t.icon
              const selected = tipo === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setTipo(t.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border text-sm font-medium transition-all ${
                    selected
                      ? t.color + ' ring-1 ring-offset-1 ring-current'
                      : 'border-input text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Textarea */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva em detalhes o que encontrou, sugestão ou dúvida..."
            rows={5}
            maxLength={MAX_CHARS}
            className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs ${charCount < MIN_CHARS ? 'text-destructive' : 'text-muted-foreground'}`}>
              {charCount < MIN_CHARS ? `Mínimo ${MIN_CHARS} caracteres` : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30">
        <button
          onClick={onClose}
          className="h-9 px-4 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid || criarFeedback.isPending}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {criarFeedback.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Enviar Feedback
        </button>
      </div>
    </div>
  )
}

export default FeedbackPopover
