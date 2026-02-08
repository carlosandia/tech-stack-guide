/**
 * AIDEV-NOTE: Barra de entrada de mensagem com tabs (Responder/Nota Privada)
 * Estilo WhatsApp: textarea expansível, Enter=enviar, Shift+Enter=nova linha
 */

import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import { Send, Zap, StickyNote, MessageSquare } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (texto: string) => void
  onSendNote: (texto: string) => void
  onOpenQuickReplies: () => void
  isSending: boolean
  disabled?: boolean
}

type InputTab = 'responder' | 'nota'

export function ChatInput({ onSendMessage, onSendNote, onOpenQuickReplies, isSending, disabled }: ChatInputProps) {
  const [tab, setTab] = useState<InputTab>('responder')
  const [texto, setTexto] = useState('')
  const [notaTexto, setNotaTexto] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (tab === 'responder') {
      const msg = texto.trim()
      if (!msg || isSending) return
      onSendMessage(msg)
      setTexto('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } else {
      const nota = notaTexto.trim()
      if (!nota) return
      onSendNote(nota)
      setNotaTexto('')
    }
  }

  const handleInputChange = (value: string) => {
    if (tab === 'responder') {
      setTexto(value)
      // Trigger quick replies on "/"
      if (value === '/') {
        onOpenQuickReplies()
      }
    } else {
      setNotaTexto(value)
    }
  }

  const currentText = tab === 'responder' ? texto : notaTexto
  const isNota = tab === 'nota'

  return (
    <div className="flex-shrink-0 border-t border-border">
      {/* Tabs */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setTab('responder')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all duration-200 border-b-2 ${
            tab === 'responder'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Responder
        </button>
        <button
          onClick={() => setTab('nota')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all duration-200 border-b-2 ${
            tab === 'nota'
              ? 'border-warning text-warning-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <StickyNote className="w-3.5 h-3.5" />
          Nota Privada
        </button>
      </div>

      {/* Input area */}
      <div className={`p-3 ${isNota ? 'bg-warning-muted/30' : ''}`}>
        {isNota && (
          <p className="text-[11px] text-warning-foreground mb-2 flex items-center gap-1">
            <StickyNote className="w-3 h-3" />
            Esta nota é interna e não será enviada ao contato
          </p>
        )}

        <div className="flex items-end gap-2">
          {/* Action buttons (only for reply mode) */}
          {!isNota && (
            <div className="flex items-center gap-1 pb-1">
              <button
                type="button"
                onClick={onOpenQuickReplies}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                title="Mensagens prontas"
              >
                <Zap className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

          {/* Textarea */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={currentText}
              onChange={(e) => {
                handleInputChange(e.target.value)
                autoResize(e.target)
              }}
              onKeyDown={handleKeyDown}
              placeholder={isNota ? 'Escreva uma nota privada...' : 'Digite uma mensagem...'}
              disabled={disabled}
              rows={1}
              className={`
                w-full resize-none rounded-md border px-3 py-2 text-sm
                focus:outline-none focus:ring-1
                placeholder:text-muted-foreground
                disabled:opacity-50
                ${isNota
                  ? 'bg-warning-muted/20 border-warning/30 focus:ring-warning/50'
                  : 'bg-background border-border focus:ring-ring'
                }
              `}
              style={{ maxHeight: '150px' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!currentText.trim() || isSending || disabled}
            className={`
              p-2 rounded-md transition-all duration-200 flex-shrink-0 mb-0.5
              ${currentText.trim()
                ? isNota
                  ? 'bg-warning text-white hover:bg-warning/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }
            `}
            title={isNota ? 'Salvar nota' : 'Enviar mensagem'}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
