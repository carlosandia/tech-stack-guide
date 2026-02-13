/**
 * AIDEV-NOTE: Modal de conexão API4COM - Telefonia VoIP
 * Admin do tenant configura o token API4COM da organização
 */

import { useState } from 'react'
import { Phone, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { ModalBase } from '../ui/ModalBase'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface Api4comConexaoModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function Api4comConexaoModal({ onClose, onSuccess }: Api4comConexaoModalProps) {
  const [token, setToken] = useState('')
  const [apiUrl] = useState('https://api.api4com.com')
  const [showToken, setShowToken] = useState(false)
  const [step, setStep] = useState<'form' | 'testing' | 'success' | 'error'>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleTestar = async () => {
    if (!token.trim()) {
      toast.error('Informe o token da API4COM')
      return
    }

    setStep('testing')
    setErrorMsg('')

    try {
      const { data, error } = await supabase.functions.invoke('api4com-proxy', {
        body: { action: 'validate', token: token.trim(), api_url: apiUrl.trim() },
      })

      if (error) throw new Error(error.message || 'Erro ao validar token')
      if (data && !data.valid) throw new Error(data.message || 'Token inválido')

      setStep('success')
    } catch (err: any) {
      setStep('error')
      setErrorMsg(err.message || 'Erro ao validar token')
    }
  }

  const handleSalvar = async () => {
    setIsSaving(true)

    try {
      const { data, error } = await supabase.functions.invoke('api4com-proxy', {
        body: { action: 'save', token: token.trim(), api_url: apiUrl.trim() },
      })

      if (error) throw new Error(error.message || 'Erro ao salvar conexão')
      if (data && !data.success) throw new Error(data.message || 'Falha ao salvar')

      toast.success('API4COM conectada com sucesso!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar conexão')
    } finally {
      setIsSaving(false)
    }
  }

  const footer = (
    <div className="flex items-center gap-2">
      {step === 'success' ? (
        <button
          onClick={handleSalvar}
          disabled={isSaving}
          className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-medium px-4 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Salvar Conexão
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleTestar}
          disabled={!token.trim() || step === 'testing'}
          className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-medium px-4 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {step === 'testing' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Phone className="w-3.5 h-3.5" />
              Testar Conexão
            </>
          )}
        </button>
      )}

      <button
        onClick={onClose}
        className="inline-flex items-center justify-center text-xs font-medium px-4 py-2.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
      >
        Cancelar
      </button>
    </div>
  )

  return (
    <ModalBase
      title="API4COM - Telefonia VoIP"
      description="Configure o token da API4COM para habilitar ligações no CRM"
      icon={Phone}
      onClose={onClose}
      size="md"
      footer={footer}
    >
      <div className="p-4 sm:p-6 space-y-4">
        {/* Instruções */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Como obter o token:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Acesse <strong>app.api4com.com</strong> (seu painel)</li>
                <li>No menu lateral, vá em <strong>3 - Tokens de acesso</strong></li>
                <li>Copie ou crie um token (recomendado: sem expiração, ttl=-1)</li>
              </ol>
              <p className="mt-1.5 text-[11px] text-destructive/80 font-medium">
                ⚠️ A URL da API é sempre <strong>api.api4com.com</strong>. Não confunda com a URL do seu painel (ex: renovedigital.api4com.com).
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Token da API4COM <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
                  if (step !== 'form') setStep('form')
                }}
                placeholder="Cole o token da API4COM aqui"
                className="w-full px-3 py-2 pr-10 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              URL da API
            </label>
            <input
              type="url"
              value={apiUrl}
              readOnly
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              URL fixa da API REST — não alterar
            </p>
          </div>
        </div>

        {/* Status do teste */}
        {step === 'testing' && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Validando token...</span>
          </div>
        )}

        {step === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-[hsl(var(--success-muted))] rounded-md">
            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success-foreground))]" />
            <span className="text-xs text-[hsl(var(--success-foreground))]">Token válido! Clique em Salvar para conectar.</span>
          </div>
        )}

        {step === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs text-destructive">{errorMsg}</span>
          </div>
        )}
      </div>
    </ModalBase>
  )
}
