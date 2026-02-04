import { useState } from 'react'
import { Save, RefreshCw, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { useConfigGlobais, useUpdateConfigGlobal, useTestarConfigGlobal } from '../hooks/useConfigGlobal'
import type { ConfigGlobal } from '../services/admin.api'

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

type PlataformaId = 'meta' | 'google' | 'waha' | 'stripe' | 'email'

const PLATAFORMAS = [
  { id: 'meta' as const, label: 'Meta', descricao: 'Facebook e Instagram' },
  { id: 'google' as const, label: 'Google', descricao: 'Calendar e Meet' },
  { id: 'waha' as const, label: 'WhatsApp', descricao: 'WAHA API' },
  { id: 'stripe' as const, label: 'Stripe', descricao: 'Pagamentos' },
  { id: 'email' as const, label: 'Email', descricao: 'SMTP' },
]

export function ConfiguracoesGlobaisPage() {
  const [activeTab, setActiveTab] = useState<PlataformaId>('meta')
  const { data: configs, isLoading, error } = useConfigGlobais()

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuracoes Globais</h1>
        <p className="text-muted-foreground mt-1">
          Configure as integracoes da plataforma
        </p>
      </div>

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
        <ConfigPlataformaForm
          plataforma={activeTab}
          config={configAtual}
        />
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

  const { mutate: atualizar, isPending: salvando } = useUpdateConfigGlobal()
  const { mutate: testar, isPending: testando, data: resultadoTeste } = useTestarConfigGlobal()

  // Campos por plataforma
  const campos = getCamposPorPlataforma(plataforma)
  const plataformaInfo = PLATAFORMAS.find((p) => p.id === plataforma)

  const handleSalvar = () => {
    atualizar({
      plataforma,
      configuracoes: valores,
    })
  }

  const handleTestar = () => {
    testar(plataforma)
  }

  const toggleMostrarSecret = (campo: string) => {
    setMostrarSecrets((prev) => ({ ...prev, [campo]: !prev[campo] }))
  }

  const getValor = (campo: string) => {
    if (valores[campo] !== undefined) return valores[campo]
    const configValue = (config?.configuracoes as Record<string, unknown>)?.[campo]
    return typeof configValue === 'string' ? configValue : ''
  }

  return (
    <div className="space-y-6">
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
        {campos.map((campo) => (
          <div key={campo.name}>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {campo.label}
              {campo.required && <span className="text-destructive"> *</span>}
            </label>
            <div className="relative">
              <input
                type={campo.secret && !mostrarSecrets[campo.name] ? 'password' : 'text'}
                value={getValor(campo.name)}
                onChange={(e) => setValores((prev) => ({ ...prev, [campo.name]: e.target.value }))}
                placeholder={campo.placeholder}
                className="w-full h-11 px-4 pr-12 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {campo.secret && (
                <button
                  type="button"
                  onClick={() => toggleMostrarSecret(campo.name)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mostrarSecrets[campo.name] ? (
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
        ))}
      </div>

      {/* Resultado do teste */}
      {resultadoTeste && (
        <div
          className={`p-3 rounded-lg ${
            resultadoTeste.sucesso
              ? 'bg-green-50 border border-green-200'
              : 'bg-destructive/10 border border-destructive/20'
          }`}
        >
          <p
            className={`text-sm ${
              resultadoTeste.sucesso ? 'text-green-700' : 'text-destructive'
            }`}
          >
            {resultadoTeste.mensagem}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={handleTestar}
          disabled={testando}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          {testando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Testar Conexao
        </button>
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {salvando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Alteracoes
        </button>
      </div>
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
        { name: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...', required: true },
        { name: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...', secret: true, required: true },
        { name: 'webhook_secret', label: 'Webhook Secret', placeholder: 'whsec_...', secret: true },
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
