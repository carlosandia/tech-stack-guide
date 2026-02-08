/**
 * AIDEV-NOTE: Modal de conexão WhatsApp via QR Code (WAHA)
 * Conforme PRD-08 Seção 1.3 - Fluxo de Pareamento
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageCircle, Loader2, RefreshCw, CheckCircle2, Smartphone, QrCode, Wifi } from 'lucide-react'
import { ModalBase } from '../ui/ModalBase'
import { useWhatsAppIniciarSessao, useWhatsAppQrCode, useWhatsAppStatus } from '../../hooks/useIntegracoes'

interface WhatsAppQrCodeModalProps {
  onClose: () => void
  onSuccess: () => void
}

const STEPS = [
  { icon: Smartphone, text: 'Abra o WhatsApp no seu celular' },
  { icon: QrCode, text: 'Toque em Menu (⋮) ou Configurações' },
  { icon: Wifi, text: 'Toque em "Aparelhos Conectados"' },
  { icon: QrCode, text: 'Aponte a câmera para o QR Code abaixo' },
]

const QR_EXPIRY_SECONDS = 60
const POLL_INTERVAL_MS = 5000

export function WhatsAppQrCodeModal({ onClose, onSuccess }: WhatsAppQrCodeModalProps) {
  const [step, setStep] = useState<'loading' | 'qr' | 'connected' | 'error'>('loading')
  const [countdown, setCountdown] = useState(QR_EXPIRY_SECONDS)
  const [errorMsg, setErrorMsg] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval>>()
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const iniciarSessao = useWhatsAppIniciarSessao()
  const obterQrCode = useWhatsAppQrCode()
  const obterStatus = useWhatsAppStatus()

  const startPolling = useCallback(() => {
    pollRef.current = setInterval(async () => {
      try {
        const result = await obterStatus.mutateAsync()
        if (result.status === 'connected') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setStep('connected')
          setTimeout(() => onSuccess(), 1500)
        }
      } catch {
        // Silently continue polling
      }
    }, POLL_INTERVAL_MS)
  }, [obterStatus, onSuccess])

  const startCountdown = useCallback(() => {
    setCountdown(QR_EXPIRY_SECONDS)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          clearInterval(pollRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const iniciar = useCallback(async () => {
    setStep('loading')
    setErrorMsg('')
    try {
      const iniciarResult = await iniciarSessao.mutateAsync()

      // Se já está conectado, pular QR
      if (iniciarResult?.status === 'WORKING' || iniciarResult?.already_connected) {
        setStep('connected')
        setTimeout(() => onSuccess(), 1500)
        return
      }

      // Pequeno delay para dar tempo ao WAHA gerar o QR (especialmente após restart)
      if (iniciarResult?.restarted) {
        await new Promise(r => setTimeout(r, 2000))
      }

      const qrResult = await obterQrCode.mutateAsync()
      if (qrResult.qr_code) {
        setStep('qr')
        startCountdown()
        startPolling()
      } else {
        if (qrResult.status === 'connected') {
          setStep('connected')
          setTimeout(() => onSuccess(), 1500)
        } else {
          setErrorMsg('Não foi possível gerar o QR Code. Tente novamente.')
          setStep('error')
        }
      }
    } catch {
      setErrorMsg('Erro ao iniciar sessão. Verifique se o serviço WAHA está configurado.')
      setStep('error')
    }
  }, [iniciarSessao, obterQrCode, startCountdown, startPolling, onSuccess])

  useEffect(() => {
    iniciar()
    return () => {
      clearInterval(pollRef.current)
      clearInterval(timerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGerarNovo = () => {
    clearInterval(pollRef.current)
    clearInterval(timerRef.current)
    iniciar()
  }

  const qrExpired = countdown === 0 && step === 'qr'

  return (
    <ModalBase
      onClose={onClose}
      title="Conectar WhatsApp"
      description="Escaneie o QR Code para conectar seu WhatsApp"
      icon={MessageCircle}
      variant="create"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Passos */}
        <div className="space-y-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">{i + 1}</span>
              </div>
              <p className="text-sm text-foreground">{s.text}</p>
            </div>
          ))}
        </div>

        {/* QR Code Area */}
        <div className="flex flex-col items-center justify-center py-4">
          {step === 'loading' && (
            <div className="w-64 h-64 rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            </div>
          )}

          {step === 'qr' && (
            <div className="space-y-3 text-center">
              <div className={`w-64 h-64 rounded-lg border-2 border-border bg-white flex items-center justify-center relative overflow-hidden ${qrExpired ? 'opacity-30' : ''}`}>
                {obterQrCode.data?.qr_code ? (
                  <img
                    src={obterQrCode.data.qr_code}
                    alt="QR Code WhatsApp"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <QrCode className="w-32 h-32 text-muted-foreground" />
                )}
                {qrExpired && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <button
                      onClick={handleGerarNovo}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Gerar novo QR
                    </button>
                  </div>
                )}
              </div>
              {!qrExpired && (
                <p className="text-xs text-muted-foreground">
                  QR Code expira em{' '}
                  <span className={`font-semibold ${countdown <= 10 ? 'text-destructive' : 'text-foreground'}`}>
                    {countdown}s
                  </span>
                </p>
              )}
            </div>
          )}

          {step === 'connected' && (
            <div className="w-64 h-64 rounded-lg bg-[hsl(var(--success-muted))] flex items-center justify-center">
              <div className="text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[hsl(var(--success-foreground))] mx-auto" />
                <p className="text-sm font-semibold text-[hsl(var(--success-foreground))]">
                  WhatsApp conectado!
                </p>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="w-64 h-64 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center justify-center">
              <div className="text-center space-y-3 p-4">
                <p className="text-sm text-destructive">{errorMsg}</p>
                <button
                  onClick={handleGerarNovo}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar novamente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  )
}
