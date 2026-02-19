import { useState, useEffect, useCallback } from 'react'
import { LoginBannerConfig } from '../components/LoginBannerConfig'
import { Save, RefreshCw, CheckCircle, XCircle, Loader2, Eye, EyeOff, ToggleLeft, ToggleRight, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useConfigGlobais, useUpdateConfigGlobal, useTestarConfigGlobal } from '../hooks/useConfigGlobal'
import type { ConfigGlobal } from '../services/admin.api'
 import { useToolbar } from '../contexts/ToolbarContext'

/**
 * AIDEV-NOTE: Pagina de Configuracoes Globais
 * Conforme PRD-14 - Configuracoes da Plataforma
 *
 * Tabs:
 * - Meta (Facebook/Instagram)
 * - Google (Calendar/Meet)
 * - WhatsApp (WAHA)
 * - Stripe
 * - Email (SMTP)
 */

type PlataformaId = 'meta' | 'google' | 'waha' | 'stripe' | 'email' | 'login_banner'

const PLATAFORMAS = [
  { id: 'meta' as const, label: 'Meta', descricao: 'Facebook e Instagram' },
  { id: 'google' as const, label: 'Google', descricao: 'Calendar e Meet' },
  { id: 'waha' as const, label: 'WhatsApp', descricao: 'WAHA API' },
  { id: 'stripe' as const, label: 'Stripe', descricao: 'Pagamentos' },
  { id: 'email' as const, label: 'Email', descricao: 'SMTP' },
  { id: 'login_banner' as const, label: 'Login Banner', descricao: 'Banner da tela de login' },
]

export function ConfiguracoesGlobaisPage() {
  const [activeTab, setActiveTab] = useState<PlataformaId>('meta')
  const { data: configs, isLoading, error } = useConfigGlobais()
   const { setSubtitle } = useToolbar()
 
   useEffect(() => {
     setSubtitle('Configure as integrações da plataforma')
     return () => setSubtitle(null)
   }, [setSubtitle])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">Erro ao carregar configuracoes</p>
      </div>
    )
  }

  const configAtual = configs?.find((c) => c.plataforma === activeTab)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6 overflow-x-auto">
          {PLATAFORMAS.map((plat) => {
            const config = configs?.find((c) => c.plataforma === plat.id)
            return (
              <button
                key={plat.id}
                onClick={() => setActiveTab(plat.id)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === plat.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {plat.label}
                {config?.configurado && (
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-card rounded-lg border border-border p-6">
        {activeTab === 'login_banner' ? (
          <LoginBannerConfig />
        ) : (
          <ConfigPlataformaForm
            plataforma={activeTab}
            config={configAtual}
          />
        )}
      </div>
    </div>
  )
}

// Formulario de configuracao por plataforma
function ConfigPlataformaForm({
  plataforma,
  config,
}: {
  plataforma: PlataformaId
  config?: ConfigGlobal
}) {
  const [valores, setValores] = useState<Record<string, string>>({})
  const [mostrarSecrets, setMostrarSecrets] = useState<Record<string, boolean>>({})

  const updateMutation = useUpdateConfigGlobal()
  const testMutation = useTestarConfigGlobal()

  const gerarToken = useCallback((tamanho = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let resultado = ''
    const array = new Uint32Array(tamanho)
    crypto.getRandomValues(array)
    for (let i = 0; i < tamanho; i++) {
      resultado += chars.charAt(array[i] % chars.length)
    }
    return resultado
  }, [])

  // Auto-gerar webhook_verify_token para Meta se não existir
  useEffect(() => {
    if (plataforma === 'meta') {
      const tokenExistente = (config?.configuracoes as Record<string, unknown>)?.webhook_verify_token
      if (!tokenExistente || tokenExistente === '' || tokenExistente === '********') {
        const token = gerarToken()
        setValores((prev) => ({ ...prev, webhook_verify_token: token }))
      }
    }
  }, [plataforma, config, gerarToken])

  // Verifica se há alterações pendentes
  const temAlteracoes = Object.keys(valores).length > 0

  // Campos por plataforma
  const campos = getCamposPorPlataforma(plataforma)
  const plataformaInfo = PLATAFORMAS.find((p) => p.id === plataforma)

  // Separar campos principais e de trial
  const camposMain = campos.filter((c) => c.section !== 'trial')
  const camposTrial = campos.filter((c) => c.section === 'trial')

  const handleSalvar = useCallback(() => {
    updateMutation.mutate(
      { plataforma, configuracoes: valores },
      {
        onSuccess: () => {
          toast.success('Configurações salvas com sucesso!')
          setValores({})
        },
        onError: (err) => {
          toast.error(`Erro ao salvar: ${err.message}`)
        },
      }
    )
  }, [plataforma, valores, updateMutation])

  const handleTestar = useCallback(() => {
    // Se há alterações pendentes, salva primeiro e depois testa
    if (temAlteracoes) {
      updateMutation.mutate(
        { plataforma, configuracoes: valores },
        {
          onSuccess: () => {
            setValores({})
            toast.success('Configurações salvas!')
            // Agora sim, testa
            testMutation.mutate(plataforma, {
              onSuccess: (resultado) => {
                if (resultado.sucesso) {
                  toast.success(resultado.mensagem)
                } else {
                  toast.error(resultado.mensagem)
                }
              },
              onError: (err) => {
                toast.error(`Erro ao testar: ${err.message}`)
              },
            })
          },
          onError: (err) => {
            toast.error(`Erro ao salvar antes de testar: ${err.message}`)
          },
        }
      )
    } else {
      testMutation.mutate(plataforma, {
        onSuccess: (resultado) => {
          if (resultado.sucesso) {
            toast.success(resultado.mensagem)
          } else {
            toast.error(resultado.mensagem)
          }
        },
        onError: (err) => {
          toast.error(`Erro ao testar: ${err.message}`)
        },
      })
    }
  }, [temAlteracoes, plataforma, valores, updateMutation, testMutation])

  const toggleMostrarSecret = (campo: string) => {
    setMostrarSecrets((prev) => ({ ...prev, [campo]: !prev[campo] }))
  }

  const getValor = (campo: string) => {
    if (valores[campo] !== undefined) return valores[campo]
    const configValue = (config?.configuracoes as Record<string, unknown>)?.[campo]
    return typeof configValue === 'string' ? configValue : ''
  }

  const isBusy = updateMutation.isPending || testMutation.isPending

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSalvar() }} className="space-y-6">
      {/* Header da Plataforma */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{plataformaInfo?.label}</h2>
          <p className="text-sm text-muted-foreground">{plataformaInfo?.descricao}</p>
        </div>
        <div className="flex items-center gap-2">
          {config?.configurado ? (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Configurado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <XCircle className="w-4 h-4" />
              Nao configurado
            </span>
          )}
        </div>
      </div>

      {/* Ultimo erro */}
      {config?.ultimo_erro && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{config.ultimo_erro}</p>
        </div>
      )}

      {/* Campos */}
      <div className="space-y-4">
        {camposMain.map((campo) => (
          <div key={campo.name} className="flex items-end gap-2">
            <div className="flex-1">
              <CampoFormulario
                campo={campo}
                valor={getValor(campo.name)}
                onChange={(value) => setValores((prev) => ({ ...prev, [campo.name]: value }))}
                mostrarSecret={mostrarSecrets[campo.name]}
                onToggleSecret={() => toggleMostrarSecret(campo.name)}
              />
            </div>
            {campo.name === 'webhook_verify_token' && plataforma === 'meta' && (
              <button
                type="button"
                onClick={() => {
                  const novoToken = gerarToken()
                  setValores((prev) => ({ ...prev, webhook_verify_token: novoToken }))
                  toast.info('Novo token gerado. Salve para aplicar.')
                }}
                className="h-11 px-3 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Gerar novo token"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Seção de Trial (apenas para Stripe) */}
      {camposTrial.length > 0 && (
        <div className="pt-6 mt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Configurações de Trial
          </h3>
          <div className="space-y-4">
            {camposTrial.map((campo) => (
              <CampoFormulario
                key={campo.name}
                campo={campo}
                valor={getValor(campo.name)}
                onChange={(value) => setValores((prev) => ({ ...prev, [campo.name]: value }))}
                mostrarSecret={mostrarSecrets[campo.name]}
                onToggleSecret={() => toggleMostrarSecret(campo.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleTestar}
          disabled={isBusy}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          {testMutation.isPending || (temAlteracoes && updateMutation.isPending) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {temAlteracoes ? 'Salvar e Testar' : 'Testar Conexao'}
        </button>
        <button
          type="submit"
          disabled={!temAlteracoes || isBusy}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {updateMutation.isPending && !testMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Alteracoes
        </button>
      </div>
    </form>
  )
}

// Componente de campo do formulário
function CampoFormulario({
  campo,
  valor,
  onChange,
  mostrarSecret,
  onToggleSecret,
}: {
  campo: CampoConfig
  valor: string
  onChange: (value: string) => void
  mostrarSecret?: boolean
  onToggleSecret?: () => void
}) {
  // Toggle
  if (campo.type === 'toggle') {
    const isEnabled = valor === 'true'
    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {campo.label}
        </label>
        <button
          type="button"
          onClick={() => onChange(isEnabled ? 'false' : 'true')}
          className="flex items-center gap-3"
        >
          {isEnabled ? (
            <ToggleRight className="w-10 h-6 text-primary" />
          ) : (
            <ToggleLeft className="w-10 h-6 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {isEnabled ? 'Habilitado' : 'Desabilitado'}
          </span>
        </button>
        {campo.hint && (
          <p className="mt-1.5 text-xs text-muted-foreground">{campo.hint}</p>
        )}
      </div>
    )
  }

  // Number
  if (campo.type === 'number') {
    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {campo.label}
          {campo.required && <span className="text-destructive"> *</span>}
        </label>
        <input
          type="number"
          min="1"
          max="365"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          className="w-32 h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-center"
        />
        {campo.hint && (
          <p className="mt-1 text-xs text-muted-foreground">{campo.hint}</p>
        )}
      </div>
    )
  }

  // Text (default)
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {campo.label}
        {campo.required && <span className="text-destructive"> *</span>}
      </label>
      <div className="relative">
        <input
          type={campo.secret && !mostrarSecret ? 'password' : 'text'}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          className="w-full h-11 px-4 pr-12 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        {campo.secret && (
          <button
            type="button"
            onClick={onToggleSecret}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {mostrarSecret ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {campo.hint && (
        <p className="mt-1 text-xs text-muted-foreground">{campo.hint}</p>
      )}
    </div>
  )
}

// Definicao de campos por plataforma
interface CampoConfig {
  name: string
  label: string
  placeholder: string
  secret?: boolean
  required?: boolean
  hint?: string
  type?: 'text' | 'toggle' | 'number'
  section?: 'main' | 'trial'
}

function getCamposPorPlataforma(plataforma: PlataformaId): CampoConfig[] {
  switch (plataforma) {
    case 'meta':
      return [
        { name: 'app_id', label: 'App ID', placeholder: '123456789012345', required: true },
        { name: 'app_secret', label: 'App Secret', placeholder: '********************************', secret: true, required: true },
        { name: 'webhook_verify_token', label: 'Webhook Verify Token', placeholder: 'Token de verificacao', secret: true },
      ]
    case 'google':
      return [
        { name: 'client_id', label: 'Client ID', placeholder: 'xxx.apps.googleusercontent.com', required: true },
        { name: 'client_secret', label: 'Client Secret', placeholder: '********************************', secret: true, required: true },
        { name: 'redirect_uri', label: 'Redirect URI', placeholder: 'https://...', hint: 'URL de callback OAuth' },
      ]
    case 'waha':
      return [
        { name: 'api_url', label: 'WAHA API URL', placeholder: 'https://waha.example.com', required: true },
        { name: 'api_key', label: 'API Key', placeholder: '********************************', secret: true, required: true },
      ]
     case 'stripe':
       return [
         { name: 'public_key', label: 'Publishable Key', placeholder: 'pk_live_...', required: true, section: 'main' },
         { name: 'secret_key_encrypted', label: 'Secret Key', placeholder: 'sk_live_...', secret: true, required: true, hint: 'Armazenada como secret no Supabase', section: 'main' },
         { name: 'webhook_secret_encrypted', label: 'Webhook Secret', placeholder: 'whsec_...', secret: true, section: 'main' },
         { name: 'trial_habilitado', label: 'Permitir Trial', placeholder: '', type: 'toggle', hint: 'Novos usuários podem iniciar período de teste gratuito', section: 'trial' },
         { name: 'trial_dias', label: 'Dias de Trial', placeholder: '14', type: 'number', hint: 'Duração do período de trial (1-365 dias)', section: 'trial' },
       ]
    case 'email':
      return [
        { name: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.example.com', required: true },
        { name: 'smtp_port', label: 'SMTP Port', placeholder: '587' },
        { name: 'smtp_user', label: 'Usuario', placeholder: 'user@example.com', required: true },
        { name: 'smtp_pass', label: 'Senha', placeholder: '********************************', secret: true, required: true },
        { name: 'from_email', label: 'Email Remetente', placeholder: 'noreply@example.com' },
        { name: 'from_name', label: 'Nome Remetente', placeholder: 'CRM Renove' },
      ]
    default:
      return []
  }
}

export default ConfiguracoesGlobaisPage
