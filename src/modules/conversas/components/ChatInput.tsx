/**
 * AIDEV-NOTE: Barra de entrada de mensagem com tabs (Responder/Nota Privada)
 * Estilo WhatsApp: textarea expansível, Enter=enviar, Shift+Enter=nova linha
 * Integra AudioRecorder inline quando gravação está ativa
 * Ícones dentro da caixa de texto para visual mais moderno e compacto
 */

import { useState, useRef, useCallback, forwardRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Send, StickyNote, MessageSquare, Plus, Mic, Smile, X } from 'lucide-react'
import { AgendarMensagemPopover } from './AgendarMensagemPopover'
import { AnexosMenu } from './AnexosMenu'
import { AudioRecorder } from './AudioRecorder'
import { EmojiPicker } from './EmojiPicker'
import type { Mensagem } from '../services/conversas.api'

interface ChatInputProps {
  onSendMessage: (texto: string) => void
  onSendNote: (texto: string) => void
  onOpenQuickReplies: () => void
  onFileSelected: (file: File, tipo: string) => void
  onAudioSend: (blob: Blob, duration: number) => void
  onOpenCamera: () => void
  onOpenContato: () => void
  onOpenEnquete: () => void
  isSending: boolean
  disabled?: boolean
  replyingTo?: Mensagem | null
  onCancelReply?: () => void
  audioSending?: boolean
  conversaId?: string
}

type InputTab = 'responder' | 'nota'

export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(function ChatInput({
  onSendMessage, onSendNote, onOpenQuickReplies, onFileSelected,
  onAudioSend, onOpenCamera, onOpenContato, onOpenEnquete,
  isSending, disabled, replyingTo, onCancelReply, audioSending, conversaId
}, _ref) {
  const [tab, setTab] = useState<InputTab>('responder')
  const [texto, setTexto] = useState('')
  const [notaTexto, setNotaTexto] = useState('')
  const [anexosOpen, setAnexosOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
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

  const handlePaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files
    if (files && files.length > 0) {
      e.preventDefault()
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const tipo = file.type.startsWith('image/') ? 'image'
          : file.type.startsWith('video/') ? 'video'
          : file.type.startsWith('audio/') ? 'audio'
          : 'document'
        onFileSelected(file, tipo)
      }
    }
  }, [onFileSelected])

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
      if (value === '/') {
        onOpenQuickReplies()
      }
    } else {
      setNotaTexto(value)
    }
  }

  const currentText = tab === 'responder' ? texto : notaTexto
  const isNota = tab === 'nota'
  const hasText = currentText.trim().length > 0

  return (
    <div className="flex-shrink-0 border-t border-border">
      {/* Tabs */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setTab('responder')}
          className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all duration-200 border-b-2 ${
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
          className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all duration-200 border-b-2 ${
            tab === 'nota'
              ? 'border-warning text-warning-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <StickyNote className="w-3.5 h-3.5" />
          Nota Privada
        </button>
      </div>

      {/* Reply preview bar */}
      {replyingTo && !isNota && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border/30">
          <div className="w-1 h-10 rounded-full bg-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-primary">
              {replyingTo.from_me ? 'Você' : 'Contato'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {replyingTo.tipo === 'text' ? replyingTo.body :
               replyingTo.tipo === 'image' ? '📷 Foto' :
               replyingTo.tipo === 'video' ? '🎥 Vídeo' :
               replyingTo.tipo === 'audio' ? '🎵 Áudio' :
               replyingTo.tipo === 'document' ? `📄 ${replyingTo.media_filename || 'Documento'}` :
               'Mensagem'}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className={`p-2 sm:p-3 ${isNota ? 'bg-warning-muted/30' : ''}`}>
        {isNota && (
          <p className="text-[11px] text-warning-foreground mb-2 flex items-center gap-1">
            <StickyNote className="w-3 h-3" />
            Esta nota é interna e não será enviada ao contato
          </p>
        )}

        {/* Audio recorder inline (replaces input when recording) */}
        {isRecording && !isNota ? (
          <AudioRecorder
            onSend={(blob, dur) => {
              setIsRecording(false)
              onAudioSend(blob, dur)
            }}
            onCancel={() => setIsRecording(false)}
          />
        ) : (
          <div className="flex items-end gap-1.5 sm:gap-2">
            {/* Input container with icons inside */}
            <div className={`
              flex-1 flex items-end rounded-lg border transition-colors
              ${isNota
                ? 'bg-warning-muted/20 border-warning/30 focus-within:ring-1 focus-within:ring-warning/50'
                : 'bg-background border-border focus-within:ring-1 focus-within:ring-ring'
              }
            `}>
              {/* Left icons inside input (only for reply mode) */}
              {!isNota && (
                <div className="flex items-center gap-0 pl-1 pb-[7px] flex-shrink-0">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEmojiOpen(!emojiOpen)}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        emojiOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                      title="Emojis"
                    >
                      <Smile className="w-[18px] h-[18px]" />
                    </button>
                    {emojiOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setEmojiOpen(false)} />
                        <div className="absolute bottom-10 left-0 z-50">
                          <EmojiPicker
                            onSelect={(emoji) => {
                              if (tab === 'responder') {
                                const el = textareaRef.current
                                if (el) {
                                  const start = el.selectionStart
                                  const end = el.selectionEnd
                                  const newText = texto.slice(0, start) + emoji + texto.slice(end)
                                  setTexto(newText)
                                  requestAnimationFrame(() => {
                                    el.selectionStart = el.selectionEnd = start + emoji.length
                                    el.focus()
                                  })
                                } else {
                                  setTexto(t => t + emoji)
                                }
                              } else {
                                setNotaTexto(t => t + emoji)
                              }
                            }}
                            onClose={() => setEmojiOpen(false)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAnexosOpen(!anexosOpen)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                      title="Anexar / Mensagens prontas"
                    >
                      <Plus className="w-[18px] h-[18px]" />
                    </button>
                    <AnexosMenu
                      isOpen={anexosOpen}
                      onClose={() => setAnexosOpen(false)}
                      onFileSelected={onFileSelected}
                      onAudioRecord={() => { setAnexosOpen(false); setIsRecording(true) }}
                      onCamera={() => { setAnexosOpen(false); onOpenCamera() }}
                      onContato={() => { setAnexosOpen(false); onOpenContato() }}
                      onEnquete={() => { setAnexosOpen(false); onOpenEnquete() }}
                      onMensagensProntas={() => { setAnexosOpen(false); onOpenQuickReplies() }}
                    />
                  </div>
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={currentText}
                onChange={(e) => {
                  handleInputChange(e.target.value)
                  autoResize(e.target)
                }}
                onKeyDown={handleKeyDown}
                onPaste={!isNota ? handlePaste : undefined}
                placeholder={isNota ? 'Escreva uma nota privada...' : 'Digite uma mensagem...'}
                disabled={disabled}
                rows={1}
                className="
                  flex-1 w-full resize-none bg-transparent px-2 py-2.5 text-sm
                  focus:outline-none
                  placeholder:text-muted-foreground/60
                  disabled:opacity-50
                  overflow-hidden
                "
                style={{ maxHeight: '150px' }}
              />

              {/* Right icons inside input: clock always, mic only when no text */}
              {!isNota && (
                <div className="flex items-center pr-1 pb-[7px] flex-shrink-0 gap-0">
                  {conversaId && (
                    <AgendarMensagemPopover
                      conversaId={conversaId}
                      textoPreenchido={texto}
                      disabled={disabled}
                    />
                  )}
                  {!hasText && (
                    <>
                      {audioSending ? (
                        <div className="flex items-center gap-1 px-1.5">
                          <div className="w-4 h-4 border-2 border-muted-foreground/40 border-t-primary rounded-full animate-spin" />
                        </div>
                      ) : (
                        <button
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                          title="Gravar áudio"
                          onClick={() => setIsRecording(true)}
                        >
                          <Mic className="w-[18px] h-[18px]" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Send button (outside, appears when has text) */}
            {hasText && (
              <button
                onClick={handleSend}
                disabled={!currentText.trim() || isSending || disabled}
                className={`
                  p-2.5 rounded-lg transition-all duration-200 flex-shrink-0
                  ${currentText.trim()
                    ? isNota
                      ? 'bg-warning text-white hover:bg-warning/90'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }
                `}
                title={isNota ? 'Salvar nota' : 'Enviar mensagem'}
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
ChatInput.displayName = 'ChatInput'
