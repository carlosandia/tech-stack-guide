/**
 * AIDEV-NOTE: Modal de Ligação VoIP
 * Estrutura visual para futuro WebRTC real
 * Inclui placeholders para gravação e insights IA
 * Conforme Design System 10.5 - ModalBase
 */

import { useState } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Volume2, Brain, Clock } from 'lucide-react'

interface LigacaoModalProps {
  telefone: string
  contatoNome?: string
  onClose: () => void
}

export function LigacaoModal({ telefone, contatoNome, onClose }: LigacaoModalProps) {
  const [chamando, setChamando] = useState(false)
  const [muted, setMuted] = useState(false)

  const handleLigar = () => {
    setChamando(true)
    // AIDEV-TODO: Integrar WebRTC/SIP real via libwebphone.js
  }

  const handleDesligar = () => {
    setChamando(false)
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-card border border-border rounded-lg shadow-lg w-[calc(100%-32px)] sm:max-w-sm animate-enter">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            {contatoNome && (
              <p className="text-sm font-semibold text-foreground">{contatoNome}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{telefone}</p>
            {chamando && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Clock className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-xs text-primary font-medium">Chamando...</span>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="px-6 py-4 space-y-4">
            {/* Botões de controle */}
            <div className="flex items-center justify-center gap-4">
              {chamando ? (
                <>
                  <button
                    onClick={() => setMuted(!muted)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      muted ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                    title={muted ? 'Ativar microfone' : 'Mutar'}
                  >
                    {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleDesligar}
                    className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    title="Desligar"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button
                    className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-accent transition-colors"
                    title="Volume"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLigar}
                  className="w-14 h-14 rounded-full bg-[hsl(var(--success))] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                  title="Ligar"
                >
                  <Phone className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Gravação placeholder */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Mic className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Gravação</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                A gravação ficará disponível após a chamada ser encerrada.
              </p>
            </div>

            {/* Insights IA placeholder */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Insights de IA</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Após a ligação, a IA analisará o conteúdo e gerará resumo, sentimento e próximos passos.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border">
            <button
              onClick={onClose}
              className="w-full text-xs font-medium py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
