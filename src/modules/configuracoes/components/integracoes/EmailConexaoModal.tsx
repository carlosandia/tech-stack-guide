/**
 * AIDEV-NOTE: Modal de conexão Email (Gmail OAuth + SMTP Manual)
 * Conforme PRD-08 Seção 6.4 - Email Pessoal
 */

import { useState, useEffect } from 'react'
import { Mail, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff, Shield, Zap, Clock } from 'lucide-react'
import { ModalBase } from '../ui/ModalBase'
import { useEmailSmtpTestar, useEmailSmtpSalvar, useEmailSmtpDetectar, useEmailGmailAuthUrl } from '../../hooks/useIntegracoes'

interface EmailConexaoModalProps {
  onClose: () => void
  onSuccess: () => void
}

type Tab = 'gmail_oauth' | 'smtp_manual'
type TesteStatus = 'idle' | 'testing' | 'success' | 'error'

const GMAIL_BENEFITS = [
  { icon: Shield, text: 'Autenticação segura via OAuth 2.0' },
  { icon: Zap, text: 'Configuração automática sem senhas' },
  { icon: Clock, text: 'Renovação automática de credenciais' },
]

export function EmailConexaoModal({ onClose, onSuccess }: EmailConexaoModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('gmail_oauth')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [testeStatus, setTesteStatus] = useState<TesteStatus>('idle')
  const [testeMsg, setTesteMsg] = useState('')
  const [provedor, setProvedor] = useState<string | null>(null)

  const testarSmtp = useEmailSmtpTestar()
  const salvarSmtp = useEmailSmtpSalvar()
  const detectarSmtp = useEmailSmtpDetectar()
  const obterGmailAuthUrl = useEmailGmailAuthUrl()

  // Auto-detectar provedor SMTP quando email muda
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setProvedor(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const result = await detectarSmtp.mutateAsync(email)
        setProvedor(result.provedor || null)
      } catch {
        setProvedor(null)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [email]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGmailConnect = async () => {
    try {
      const result = await obterGmailAuthUrl.mutateAsync()
      if (result.url) {
        window.location.href = result.url
      }
    } catch {
      // Toast is handled by the hook
    }
  }

  const handleTestarSmtp = async () => {
    if (!email || !senha) return
    setTesteStatus('testing')
    setTesteMsg('')
    try {
      await testarSmtp.mutateAsync({ email, senha })
      setTesteStatus('success')
      setTesteMsg('Conexão SMTP validada com sucesso!')
    } catch {
      setTesteStatus('error')
      setTesteMsg('Falha na conexão. Verifique suas credenciais.')
    }
  }

  const handleSalvarSmtp = async () => {
    if (!email || !senha || testeStatus !== 'success') return
    try {
      await salvarSmtp.mutateAsync({ email, senha })
      onSuccess()
    } catch {
      // Toast is handled by the hook
    }
  }

  return (
    <ModalBase
      onClose={onClose}
      title="Conectar Email"
      description="Envie emails diretamente pelo CRM"
      icon={Mail}
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
          {activeTab === 'smtp_manual' && testeStatus === 'success' && (
            <button
              type="button"
              onClick={handleSalvarSmtp}
              disabled={salvarSmtp.isPending}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {salvarSmtp.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Salvar Conexão'
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('gmail_oauth')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'gmail_oauth'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Gmail OAuth
          </button>
          <button
            onClick={() => setActiveTab('smtp_manual')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'smtp_manual'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            SMTP Manual
          </button>
        </div>

        {/* Tab: Gmail OAuth */}
        {activeTab === 'gmail_oauth' && (
          <div className="space-y-5">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-3">
                Recomendado para contas Gmail e Google Workspace
              </p>
              <div className="space-y-2.5">
                {GMAIL_BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <b.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGmailConnect}
              disabled={obterGmailAuthUrl.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {obterGmailAuthUrl.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              Conectar com Google
            </button>
          </div>
        )}

        {/* Tab: SMTP Manual */}
        {activeTab === 'smtp_manual' && (
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {provedor && (
                <p className="text-xs text-muted-foreground">
                  Provedor detectado: <span className="font-medium text-foreground">{provedor}</span>
                </p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Senha de App</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Senha de aplicativo"
                  className="w-full px-3 py-2 pr-10 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use uma senha de aplicativo, não sua senha pessoal.
              </p>
            </div>

            {/* Botão Testar */}
            <button
              onClick={handleTestarSmtp}
              disabled={!email || !senha || testeStatus === 'testing'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {testeStatus === 'testing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Testar Conexão
            </button>

            {/* Feedback do Teste */}
            {testeStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-[hsl(var(--success-muted))]">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success-foreground))] flex-shrink-0" />
                <p className="text-xs font-medium text-[hsl(var(--success-foreground))]">{testeMsg}</p>
              </div>
            )}

            {testeStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-xs font-medium text-destructive">{testeMsg}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalBase>
  )
}
