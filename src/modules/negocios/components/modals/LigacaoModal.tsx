/**
 * AIDEV-NOTE: Modal de Ligação VoIP
 * Verifica conexão API4COM antes de permitir ligar
 * Som de chamando ao iniciar ligação
 * Conforme Design System 10.5 - ModalBase
 */

import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Volume2, Brain, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface LigacaoModalProps {
  telefone: string
  contatoNome?: string
  onClose: () => void
}

export function LigacaoModal({ telefone, contatoNome, onClose }: LigacaoModalProps) {
  const [chamando, setChamando] = useState(false)
  const [muted, setMuted] = useState(false)
  const [api4comConectado, setApi4comConectado] = useState<boolean | null>(null) // null = loading
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Verificar se API4COM está conectada
  useEffect(() => {
    async function checkApi4com() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setApi4comConectado(false); return }

        // AIDEV-NOTE: organizacao_id fica na tabela usuarios, nao em user_metadata
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('organizacao_id')
          .eq('auth_id', user.id)
          .maybeSingle()

        const orgId = usuario?.organizacao_id
        if (!orgId) { setApi4comConectado(false); return }

        const { data } = await supabase
          .from('conexoes_api4com')
          .select('id, status')
          .eq('organizacao_id', orgId)
          .is('deletado_em', null)
          .maybeSingle()

        setApi4comConectado(data?.status === 'conectado')
      } catch {
        setApi4comConectado(false)
      }
    }
    checkApi4com()
  }, [])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleLigar = () => {
    if (!api4comConectado) return
    setChamando(true)

    // Tocar som de chamando
    try {
      const ctx = new AudioContext()
      const playRingTone = () => {
        // Simular tom de chamada brasileira: 1s de tom, 4s de silêncio
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 425 // Frequência padrão de ringback brasileiro
        gain.gain.value = 0.15
        osc.start()
        osc.stop(ctx.currentTime + 1)
        return { osc, gain }
      }

      let interval: ReturnType<typeof setInterval>
      playRingTone()
      interval = setInterval(() => {
        playRingTone()
      }, 5000)

      // Store cleanup
      audioRef.current = { pause: () => { clearInterval(interval); ctx.close() } } as any
    } catch {
      // Fallback silencioso se Web Audio API não estiver disponível
    }

    // AIDEV-TODO: Integrar WebRTC/SIP real via libwebphone.js
  }

  const handleDesligar = () => {
    setChamando(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
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
            {/* Aviso se não tem API4COM */}
            {api4comConectado === false && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(var(--warning-muted))]">
                <AlertCircle className="w-4 h-4 text-[hsl(var(--warning-foreground))] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-[hsl(var(--warning-foreground))]">
                    Telefonia não configurada
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Configure a conexão API4COM em Configurações → Conexões para realizar ligações.
                  </p>
                </div>
              </div>
            )}

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
                  disabled={!api4comConectado}
                  className="w-14 h-14 rounded-full bg-[hsl(var(--success))] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  title={api4comConectado ? 'Ligar' : 'Conexão VoIP não configurada'}
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
