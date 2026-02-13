/**
 * AIDEV-NOTE: Modal de Ligação VoIP com integração real API4COM
 * Verifica conexão API4COM + ramal + créditos antes de permitir ligar
 * Click-to-call via Edge Function api4com-proxy
 * Conforme Design System 10.5 - ModalBase
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, PhoneOff, Clock, AlertCircle, PhoneCall, Loader2, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type StatusLigacao = 'idle' | 'verificando' | 'pronto' | 'chamando' | 'conectada' | 'encerrada' | 'erro'

interface LigacaoModalProps {
  telefone: string
  contatoNome?: string
  onClose: () => void
}

export function LigacaoModal({ telefone, contatoNome, onClose }: LigacaoModalProps) {
  const [status, setStatus] = useState<StatusLigacao>('verificando')
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [, setApi4comConectado] = useState<boolean | null>(null)
  const [, setRamalConfigurado] = useState<boolean | null>(null)
  const [saldoInfo, setSaldoInfo] = useState<{ balance: number | null; has_credits: boolean | null } | null>(null)
  const [duracao, setDuracao] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // AIDEV-NOTE: Chamada à Edge Function api4com-proxy
  const chamarProxy = useCallback(async (action: string, extras: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Sessão expirada')

    const res = await supabase.functions.invoke('api4com-proxy', {
      body: { action, ...extras },
    })

    if (res.error) {
      const msg = typeof res.error?.message === 'string' ? res.error.message : JSON.stringify(res.error)
      throw new Error(msg || 'Erro na Edge Function')
    }
    return res.data
  }, [])

  // Verificar pré-requisitos ao abrir o modal
  useEffect(() => {
    async function verificarPreRequisitos() {
      setStatus('verificando')
      try {
        // Verificar conexão API4COM, ramal e saldo em paralelo
        const [statusRes, ramalRes, balanceRes] = await Promise.allSettled([
          chamarProxy('get-status'),
          chamarProxy('get-extension'),
          chamarProxy('get-balance'),
        ])

        // Conexão API4COM
        const conexao = statusRes.status === 'fulfilled' ? statusRes.value?.conexao : null
        const conectado = conexao?.status === 'conectado'
        setApi4comConectado(conectado)

        // Ramal do usuário
        const ramal = ramalRes.status === 'fulfilled' ? ramalRes.value?.ramal : null
        const temRamal = !!ramal?.extension
        setRamalConfigurado(temRamal)

        // Saldo/créditos
        if (balanceRes.status === 'fulfilled' && balanceRes.value?.success) {
          setSaldoInfo({
            balance: balanceRes.value.balance,
            has_credits: balanceRes.value.has_credits,
          })
        }

        if (!conectado) {
          setStatus('erro')
          setMensagemErro('Telefonia não configurada. Configure a conexão API4COM em Configurações → Conexões.')
        } else if (!temRamal) {
          setStatus('erro')
          setMensagemErro('Ramal não configurado. Configure seu ramal VoIP em Configurações → Conexões → API4COM.')
        } else if (balanceRes.status === 'fulfilled' && balanceRes.value?.has_credits === false) {
          setStatus('erro')
          setMensagemErro('Créditos insuficientes na API4COM. Recarregue seu saldo para realizar ligações.')
        } else {
          setStatus('pronto')
        }
      } catch (err) {
        console.error('[LigacaoModal] Erro ao verificar pré-requisitos:', err)
        setStatus('erro')
      setMensagemErro('Erro ao verificar configuração de telefonia.')
      setApi4comConectado(false)
      }
    }
    verificarPreRequisitos()
  }, [chamarProxy])

  // Timer de duração
  useEffect(() => {
    if (status === 'conectada') {
      setDuracao(0)
      timerRef.current = setInterval(() => setDuracao(d => d + 1), 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  const formatDuracao = (s: number) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  }

  const handleLigar = async () => {
    if (status !== 'pronto') return
    setStatus('chamando')
    setMensagemErro(null)

    try {
      const result = await chamarProxy('make-call', { numero_destino: telefone })

      if (result.success) {
        // AIDEV-NOTE: A API4COM faz o telefone do ramal tocar e depois conecta ao destino
        // Consideramos "conectada" quando a API retorna sucesso
        setStatus('conectada')
      } else {
        setStatus('erro')
        const msg = typeof result?.message === 'string' ? result.message : 'Erro ao iniciar a chamada.'
        setMensagemErro(msg)
      }
    } catch (err) {
      console.error('[LigacaoModal] Erro ao fazer chamada:', err)
      setStatus('erro')
      setMensagemErro(err instanceof Error ? err.message : 'Erro ao conectar com o servidor de telefonia.')
    }
  }

  const handleDesligar = () => {
    setStatus('encerrada')
    // AIDEV-TODO: Implementar endpoint de encerramento de chamada quando disponível na API4COM
  }

  const podeLigar = status === 'pronto'
  const emChamada = status === 'chamando' || status === 'conectada'

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={!emChamada ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-card border border-border rounded-lg shadow-lg w-[calc(100%-32px)] sm:max-w-sm animate-enter">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              emChamada ? 'bg-[hsl(var(--success))]/10' : 'bg-primary/10'
            }`}>
              {status === 'verificando' ? (
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              ) : emChamada ? (
                <PhoneCall className="w-6 h-6 text-[hsl(var(--success))] animate-pulse" />
              ) : (
                <Phone className="w-6 h-6 text-primary" />
              )}
            </div>
            {contatoNome && (
              <p className="text-sm font-semibold text-foreground">{contatoNome}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{telefone}</p>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {status === 'verificando' && (
                <>
                  <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                  <span className="text-xs text-muted-foreground">Verificando configuração...</span>
                </>
              )}
              {status === 'chamando' && (
                <>
                  <Clock className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-xs text-primary font-medium">Iniciando chamada...</span>
                </>
              )}
              {status === 'conectada' && (
                <>
                  <PhoneCall className="w-3 h-3 text-[hsl(var(--success))]" />
                  <span className="text-xs text-[hsl(var(--success))] font-medium">
                    Em chamada — {formatDuracao(duracao)}
                  </span>
                </>
              )}
              {status === 'encerrada' && (
                <>
                  <PhoneOff className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Chamada encerrada — {formatDuracao(duracao)}
                  </span>
                </>
              )}
              {status === 'pronto' && (
                <span className="text-xs text-[hsl(var(--success))] font-medium">✓ Pronto para ligar</span>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="px-6 py-4 space-y-4">
            {/* Aviso de erro */}
            {status === 'erro' && mensagemErro && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-destructive">Não é possível ligar</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{mensagemErro}</p>
                </div>
              </div>
            )}

            {/* Info de saldo quando disponível */}
            {saldoInfo?.balance !== null && saldoInfo?.balance !== undefined && status !== 'erro' && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  Saldo: <span className="font-medium text-foreground">R$ {Number(saldoInfo.balance).toFixed(2)}</span>
                </span>
              </div>
            )}

            {/* Checklist de pré-requisitos durante verificação */}
            {status === 'verificando' && (
              <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Verificando conexão API4COM...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Verificando ramal VoIP...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Verificando créditos...</span>
                </div>
              </div>
            )}

            {/* Checklist completo (pós-verificação, quando pronto) */}
            {status === 'pronto' && (
              <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[hsl(var(--success))]">✓</span>
                  <span className="text-[11px] text-muted-foreground">API4COM conectada</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[hsl(var(--success))]">✓</span>
                  <span className="text-[11px] text-muted-foreground">Ramal configurado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[hsl(var(--success))]">
                    {saldoInfo?.has_credits === null ? '—' : '✓'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {saldoInfo?.has_credits === null ? 'Saldo não disponível (a chamada será tentada)' : 'Créditos disponíveis'}
                  </span>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex items-center justify-center gap-4">
              {emChamada ? (
                <button
                  onClick={handleDesligar}
                  className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  title="Desligar"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              ) : status === 'encerrada' ? (
                <button
                  onClick={() => { setStatus('pronto'); setDuracao(0) }}
                  className="w-14 h-14 rounded-full bg-[hsl(var(--success))] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                  title="Ligar novamente"
                >
                  <Phone className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={handleLigar}
                  disabled={!podeLigar}
                  className="w-14 h-14 rounded-full bg-[hsl(var(--success))] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  title={podeLigar ? 'Ligar' : 'Verificando configuração...'}
                >
                  {status === 'verificando' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Phone className="w-6 h-6" />
                  )}
                </button>
              )}
            </div>

            {/* Info sobre como funciona o click-to-call */}
            {(status === 'pronto' || status === 'chamando') && (
              <p className="text-[11px] text-muted-foreground text-center">
                Ao clicar em Ligar, seu ramal tocará primeiro. Ao atender, a chamada será conectada ao destino.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border">
            <button
              onClick={onClose}
              disabled={status === 'chamando'}
              className="w-full text-xs font-medium py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {emChamada ? 'Encerre a chamada antes de fechar' : 'Fechar'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
