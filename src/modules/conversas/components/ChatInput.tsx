/**
 * AIDEV-NOTE: Barra de entrada de mensagem com tabs (Responder/Nota Privada/Teclado)
 * Estilo WhatsApp: textarea expansível, Enter=enviar, Shift+Enter=nova linha
 * Integra AudioRecorder inline quando gravação está ativa
 * Ícones dentro da caixa de texto para visual mais moderno e compacto
 */

import { useState, useRef, useCallback, forwardRef, useImperativeHandle, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Send, StickyNote, MessageSquare, Plus, Mic, Smile, X, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { AgendarMensagemPopover } from './AgendarMensagemPopover'
import { AnexosMenu } from './AnexosMenu'
import { AudioRecorder } from './AudioRecorder'
import { EmojiPicker } from './EmojiPicker'
import { SugestaoCorrecao } from './SugestaoCorrecao'
import { WhatsAppFormattedOverlay } from './WhatsAppFormattedOverlay'
import { ConfiguracaoTeclado } from './ConfiguracaoTeclado'
import { useAutoCorrect } from '../hooks/useAutoCorrect'
import { useBlockedWords } from '../hooks/useBlockedWords'
import { useKeyboardLanguage } from '../hooks/useKeyboardLanguage'
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
  canal?: 'whatsapp' | 'instagram'
}

type InputTab = 'responder' | 'nota' | 'teclado'

export interface ChatInputHandle {
  focusTextarea: () => void
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({
  onSendMessage, onSendNote, onOpenQuickReplies, onFileSelected,
  onAudioSend, onOpenCamera, onOpenContato, onOpenEnquete,
  isSending, disabled, replyingTo, onCancelReply, audioSending, conversaId, canal
}, ref) {
  const [tab, setTab] = useState<InputTab>('responder')
  const [texto, setTexto] = useState('')
  const [notaTexto, setNotaTexto] = useState('')
  const [anexosOpen, setAnexosOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [cursorPos, setCursorPos] = useState(0)
  const [dismissedWord, setDismissedWord] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // AIDEV-NOTE: Hooks de blocklist e idioma do teclado
  const { blocked, blockWord, unblockWord, isBlocked } = useBlockedWords()
  const { language, setLanguage } = useKeyboardLanguage()

  useImperativeHandle(ref, () => ({
    focusTextarea: () => textareaRef.current?.focus()
  }))

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`
  }, [])

  // AIDEV-NOTE: Formata texto selecionado com marcadores WhatsApp (*bold*, _italic_, ~strike~, ```mono```)
  const wrapSelection = useCallback((marker: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const txt = tab === 'responder' ? texto : notaTexto
    const setter = tab === 'responder' ? setTexto : setNotaTexto

    if (start !== end) {
      // Envolve seleção
      const selected = txt.slice(start, end)
      const newText = txt.slice(0, start) + marker + selected + marker + txt.slice(end)
      setter(newText)
      const newEnd = start + marker.length + selected.length + marker.length
      requestAnimationFrame(() => {
        el.selectionStart = start + marker.length
        el.selectionEnd = newEnd - marker.length
        el.focus()
      })
    } else {
      // Insere marcadores vazios e posiciona cursor entre eles
      const newText = txt.slice(0, start) + marker + marker + txt.slice(start)
      setter(newText)
      const curPos = start + marker.length
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = curPos
        el.focus()
      })
    }
  }, [tab, texto, notaTexto])

  // AIDEV-NOTE: Auto-correct — detecta palavra atual e sugere correção
  const autoCorrect = useAutoCorrect(
    tab === 'responder' ? texto : notaTexto,
    cursorPos,
    language !== 'off'
  )

  // showAutoCorrect considera blocklist e dismiss temporário
  const showAutoCorrect = autoCorrect
    && dismissedWord !== autoCorrect.palavraOriginal
    && !isBlocked(autoCorrect.palavraOriginal)

  const handleAutoCorrectSelect = useCallback((correcao: string) => {
    if (!autoCorrect) return
    const { start, end } = autoCorrect
    const txt = tab === 'responder' ? texto : notaTexto
    const newText = txt.slice(0, start) + correcao + txt.slice(end)
    if (tab === 'responder') {
      setTexto(newText)
    } else {
      setNotaTexto(newText)
    }
    const newPos = start + correcao.length
    setCursorPos(newPos)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (el) {
        el.selectionStart = el.selectionEnd = newPos
        el.focus()
      }
    })
  }, [autoCorrect, tab, texto, notaTexto])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && showAutoCorrect) {
      blockWord(autoCorrect!.palavraOriginal)
      setDismissedWord(autoCorrect!.palavraOriginal)
      toast.info(`"${autoCorrect!.palavraOriginal}" não será mais sugerida`, { duration: 2000 })
      return
    }
    if (e.key === ' ' && showAutoCorrect) {
      e.preventDefault()
      handleAutoCorrectSelect(autoCorrect!.sugestoes[0])
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (el) {
          const p = el.selectionStart
          const setter = tab === 'responder' ? setTexto : setNotaTexto
          setter(prev => prev.slice(0, p) + ' ' + prev.slice(p))
          requestAnimationFrame(() => {
            if (el) {
              el.selectionStart = el.selectionEnd = p + 1
              setCursorPos(p + 1)
            }
          })
        }
      })
      return
    }
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
    } else if (tab === 'nota') {
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
  const isTeclado = tab === 'teclado'
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
        <button
          onClick={() => setTab('teclado')}
          className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all duration-200 border-b-2 ${
            tab === 'teclado'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Teclado
        </button>
      </div>

      {/* Reply preview bar */}
      {replyingTo && tab === 'responder' && (
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

      {/* Content area */}
      <div className={`p-2 sm:p-3 ${isNota ? 'bg-warning-muted/30' : ''}`}>
        {/* Tab: Teclado — painel de configurações */}
        {isTeclado ? (
          <ConfiguracaoTeclado
            language={language}
            onLanguageChange={setLanguage}
            blockedWords={blocked}
            onUnblockWord={unblockWord}
          />
        ) : (
          <>
            {isNota && (
              <p className="text-[11px] text-warning-foreground mb-2 flex items-center gap-1">
                <StickyNote className="w-3 h-3" />
                Esta nota é interna e não será enviada ao contato
              </p>
            )}

            {/* Audio recorder inline */}
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
                  flex-1 flex flex-col rounded-lg border transition-colors
                  ${isNota
                    ? 'bg-warning-muted/20 border-warning/30 focus-within:ring-1 focus-within:ring-warning/50'
                    : 'bg-background border-border focus-within:ring-1 focus-within:ring-ring'
                  }
                `}>
                  {/* Barra de sugestões de correção ortográfica */}
                  {showAutoCorrect && (
                    <SugestaoCorrecao
                      palavraOriginal={autoCorrect!.palavraOriginal}
                      sugestoes={autoCorrect!.sugestoes}
                      onSelect={handleAutoCorrectSelect}
                    />
                  )}

                  {/* AIDEV-NOTE: Barra de formatação WhatsApp — só para canal whatsapp e tab responder */}
                  {canal === 'whatsapp' && !isNota && (
                    <div className="flex items-center gap-1 px-2 py-1 border-b border-border/30">
                      <button type="button" tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); wrapSelection('*') }}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent rounded px-1.5 py-0.5 transition-colors" title="Negrito *texto*">B</button>
                      <button type="button" tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); wrapSelection('_') }}
                        className="text-xs italic text-muted-foreground hover:text-foreground hover:bg-accent rounded px-1.5 py-0.5 transition-colors" title="Itálico _texto_">I</button>
                      <button type="button" tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); wrapSelection('~') }}
                        className="text-xs line-through text-muted-foreground hover:text-foreground hover:bg-accent rounded px-1.5 py-0.5 transition-colors" title="Riscado ~texto~">S</button>
                      <button type="button" tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); wrapSelection('```') }}
                        className="text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-accent rounded px-1.5 py-0.5 transition-colors" title="Monoespaço ```texto```">{'<>'}</button>
                    </div>
                  )}

                  <div className="flex items-end">
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

                  {/* AIDEV-NOTE: Container relativo para sobrepor overlay de formatação */}
                  <div className="relative flex-1">
                    {/* Overlay de pré-visualização WhatsApp */}
                    {canal === 'whatsapp' && !isNota && (
                      <WhatsAppFormattedOverlay
                        text={currentText}
                        className="absolute inset-0 px-2 py-2.5 text-sm pointer-events-none whitespace-pre-wrap break-words overflow-hidden text-foreground"
                      />
                    )}

                    {/* Textarea */}
                    <textarea
                      ref={textareaRef}
                      value={currentText}
                      onChange={(e) => {
                        handleInputChange(e.target.value)
                        autoResize(e.target)
                        setCursorPos(e.target.selectionStart)
                      }}
                      onKeyDown={handleKeyDown}
                      onKeyUp={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
                      onClick={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
                      onPaste={!isNota ? handlePaste : undefined}
                      placeholder={isNota ? 'Escreva uma nota privada...' : 'Digite uma mensagem...'}
                      disabled={disabled}
                      spellCheck
                      lang="pt-BR"
                      rows={1}
                      className={`
                        w-full resize-none bg-transparent px-2 py-2.5 text-sm
                        focus:outline-none
                        placeholder:text-muted-foreground/60
                        disabled:opacity-50
                        overflow-hidden
                        relative z-10
                        ${canal === 'whatsapp' && !isNota && /\`\`\`[\s\S]+?\`\`\`|\*.+?\*|_.+?_|~.+?~/.test(currentText) ? 'text-transparent caret-foreground' : ''}
                      `}
                      style={{ maxHeight: '150px' }}
                    />
                  </div>


                  {/* Right icons inside input */}
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
                </div>

                {/* Send button */}
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
          </>
        )}
      </div>
    </div>
  )
})
ChatInput.displayName = 'ChatInput'
