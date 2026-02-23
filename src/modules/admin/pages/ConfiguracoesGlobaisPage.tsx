import { useState, useEffect, useCallback } from 'react'
import { LoginBannerConfig } from '../components/LoginBannerConfig'
import { EmblemaParceiroNivel } from '../components/EmblemaParceiroNivel'
import { Save, RefreshCw, CheckCircle, XCircle, Loader2, Eye, EyeOff, ToggleLeft, ToggleRight, RotateCcw, Trash2, Plus, Trophy, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { useConfigGlobais, useUpdateConfigGlobal, useTestarConfigGlobal } from '../hooks/useConfigGlobal'
import type { ConfigGlobal } from '../services/admin.api'
 import { useToolbar } from '../contexts/ToolbarContext'
import { useConfigPrograma, useUpdateConfigPrograma } from '../hooks/useParceiros'
import type { AtualizarConfigProgramaData } from '../schemas/parceiro.schema'
import { NIVEIS_PADRAO, type NivelParceiro } from '../schemas/parceiro.schema'

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

type PlataformaId = 'meta' | 'google' | 'waha' | 'stripe' | 'email' | 'login_banner' | 'parceiros'

const PLATAFORMAS = [
  { id: 'meta' as const, label: 'Meta', descricao: 'Facebook e Instagram' },
  { id: 'google' as const, label: 'Google', descricao: 'Calendar e Meet' },
  { id: 'waha' as const, label: 'WhatsApp', descricao: 'WAHA API' },
  { id: 'stripe' as const, label: 'Stripe', descricao: 'Pagamentos' },
  { id: 'email' as const, label: 'Email', descricao: 'SMTP' },
  { id: 'login_banner' as const, label: 'Login Banner', descricao: 'Banner da tela de login' },
  // AIDEV-NOTE: Aba de parceiros usa hook separado (useConfigPrograma) — nao usa useConfigGlobais
  { id: 'parceiros' as const, label: 'Parceiros', descricao: 'Programa de parceiros' },
]

function ConfiguracoesGlobaisPage() {
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
        ) : activeTab === 'parceiros' ? (
          // AIDEV-NOTE: Aba Parceiros usa hook separado — nao usa configAtual de useConfigGlobais
          <ConfigProgramaParceiroForm />
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

// ─────────────────────────────────────────────────────────────────────────────
// Formulário de configuração do Programa de Parceiros
// AIDEV-NOTE: Usa useConfigPrograma/useUpdateConfigPrograma — hook separado das configs globais
// ─────────────────────────────────────────────────────────────────────────────
function ConfigProgramaParceiroForm() {
  const { data: config, isLoading } = useConfigPrograma()
  const updateConfig = useUpdateConfigPrograma()

  const [percentual, setPercentual] = useState('')
  const [programaAtivo, setProgramaAtivo] = useState(false)
  const [niveis, setNiveis] = useState<NivelParceiro[]>(NIVEIS_PADRAO)
  const [carencia, setCarencia] = useState('')
  const [renovacaoMeses, setRenovacaoMeses] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Sincronizar com dados carregados
  useEffect(() => {
    if (!config) return
    setPercentual(String(config.percentual_padrao ?? 10))
    setProgramaAtivo(config.regras_gratuidade?.ativo ?? false)
    if (config.regras_gratuidade?.niveis?.length) {
      setNiveis(config.regras_gratuidade.niveis)
    }
    setCarencia(String(config.regras_gratuidade?.carencia_dias ?? ''))
    setRenovacaoMeses(String(config.regras_gratuidade?.renovacao_periodo_meses ?? ''))
    setBaseUrl(config.base_url_indicacao ?? '')
    setObservacoes(config.observacoes ?? '')
  }, [config])

  const handleSalvar = () => {
    // Validar que niveis estão em ordem crescente de meta
    const niveisOrdenados = [...niveis].sort((a, b) => a.meta_indicados - b.meta_indicados)
    const data: AtualizarConfigProgramaData = {
      percentual_padrao: Number(percentual) || 10,
      regras_gratuidade: {
        ativo: programaAtivo,
        niveis: niveisOrdenados,
        carencia_dias: carencia ? Number(carencia) : undefined,
        renovacao_periodo_meses: renovacaoMeses ? Number(renovacaoMeses) : undefined,
      },
      base_url_indicacao: baseUrl || null,
      observacoes: observacoes || null,
    }
    updateConfig.mutate(data)
  }

  const updateNivel = (index: number, field: keyof NivelParceiro, value: unknown) => {
    setNiveis(prev => prev.map((n, i) => i === index ? { ...n, [field]: value } : n))
  }

  const removeNivel = (index: number) => {
    if (niveis.length <= 1) return
    setNiveis(prev => prev.filter((_, i) => i !== index))
  }

  const addNivel = () => {
    const lastMeta = niveis.length > 0 ? niveis[niveis.length - 1].meta_indicados : 0
    setNiveis(prev => [...prev, {
      nome: '',
      cor: 'emerald',
      meta_indicados: lastMeta + 5,
      percentual_comissao: 10,
      bonus_valor: 0,
      gratuidade: false,
    }])
  }

  // AIDEV-NOTE: Cores disponíveis para badges de nível
  const coresDisponiveis = [
    { value: 'amber', label: 'Bronze', bg: 'bg-amber-100', text: 'text-amber-700' },
    { value: 'gray', label: 'Prata', bg: 'bg-gray-200', text: 'text-gray-700' },
    { value: 'yellow', label: 'Ouro', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    { value: 'blue', label: 'Diamante', bg: 'bg-blue-100', text: 'text-blue-700' },
    { value: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    { value: 'purple', label: 'Roxo', bg: 'bg-purple-100', text: 'text-purple-700' },
    { value: 'rose', label: 'Rosa', bg: 'bg-rose-100', text: 'text-rose-700' },
  ]

  const getCorClasses = (cor: string) => {
    return coresDisponiveis.find(c => c.value === cor) ?? coresDisponiveis[0]
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Programa de Parceiros</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as regras globais de comissão, níveis e bonificação.
        </p>
      </div>

      {/* % Padrão de Comissão */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          Percentual padrão de comissão (%)
        </label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={percentual}
          onChange={(e) => setPercentual(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Aplicado quando o parceiro não tem percentual individual configurado.
        </p>
      </div>

      {/* Programa de Níveis */}
      <div className="space-y-4 p-4 border border-border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Programa de Níveis e Recompensas</p>
            <p className="text-xs text-muted-foreground">
              Parceiros progridem por níveis com comissões crescentes e bonificações.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setProgramaAtivo(!programaAtivo)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              programaAtivo ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                programaAtivo ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {programaAtivo && (
          <div className="space-y-4 pt-2">
            {/* Lista de Níveis — Layout em Colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {niveis.map((nivel, index) => {
                const corInfo = getCorClasses(nivel.cor)
                return (
                  <div key={index} className="relative p-4 border border-border rounded-lg bg-background flex flex-col items-center gap-3">
                    {/* Botão excluir */}
                    <button
                      type="button"
                      onClick={() => removeNivel(index)}
                      disabled={niveis.length <= 1}
                      className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Emblema */}
                    <EmblemaParceiroNivel cor={nivel.cor} size={64} />

                    {/* Badge do nome */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${corInfo.bg} ${corInfo.text}`}>
                      <Trophy className="w-3 h-3 mr-1" />
                      {nivel.nome || 'Novo Nível'}
                    </span>

                    {/* Campos empilhados */}
                    <div className="w-full space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Nome</label>
                        <input
                          type="text"
                          value={nivel.nome}
                          onChange={(e) => updateNivel(index, 'nome', e.target.value)}
                          placeholder="Ex: Bronze"
                          className="w-full px-2.5 py-1.5 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Meta (indicados)</label>
                        <input
                          type="number"
                          min={0}
                          value={nivel.meta_indicados}
                          onChange={(e) => updateNivel(index, 'meta_indicados', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Comissão (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={nivel.percentual_comissao}
                          onChange={(e) => updateNivel(index, 'percentual_comissao', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Bônus (R$)</label>
                        <input
                          type="number"
                          min={0}
                          value={nivel.bonus_valor}
                          onChange={(e) => updateNivel(index, 'bonus_valor', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Cor</label>
                        <select
                          value={nivel.cor}
                          onChange={(e) => updateNivel(index, 'cor', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                        >
                          {coresDisponiveis.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Gratuidade</label>
                        <button
                          type="button"
                          onClick={() => updateNivel(index, 'gratuidade', !nivel.gratuidade)}
                          className={`w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            nivel.gratuidade
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'bg-background border-border text-muted-foreground'
                          }`}
                        >
                          <Gift className="w-3 h-3" />
                          {nivel.gratuidade ? 'Sim' : 'Não'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addNivel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar nível
              </button>
              <button
                type="button"
                onClick={() => setNiveis([...NIVEIS_PADRAO])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-md hover:bg-accent transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar padrão
              </button>
            </div>

            {/* Carência e Período */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Carência (dias)</label>
                <input
                  type="number"
                  min={0}
                  value={carencia}
                  onChange={(e) => setCarencia(e.target.value)}
                  placeholder="Ex: 30"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Tempo mínimo que indicado precisa estar ativo para contar.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Período avaliação (meses)</label>
                <input
                  type="number"
                  min={1}
                  value={renovacaoMeses}
                  onChange={(e) => setRenovacaoMeses(e.target.value)}
                  placeholder="Ex: 12"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Janela de renovação dos benefícios.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* URL base */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">URL base de indicação</label>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://crm.renovedigital.com.br/cadastro"
          className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          URL base para links de indicação (V2).
        </p>
      </div>

      {/* Observações */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Observações internas</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          placeholder="Notas internas sobre o programa..."
          className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <button
        type="button"
        onClick={handleSalvar}
        disabled={updateConfig.isPending}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {updateConfig.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Salvar configurações
      </button>
    </div>
  )
}

export default ConfiguracoesGlobaisPage
