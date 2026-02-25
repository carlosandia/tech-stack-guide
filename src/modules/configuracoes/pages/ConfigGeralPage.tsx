/**
 * AIDEV-NOTE: Página de Configurações Gerais do Tenant (Admin Only)
 * Conforme PRD-05 - Seção 4. Configurações Gerais
 * Campos: moeda, timezone, formato data, notificações, horários comerciais
 * Inclui: banner de email desconectado + editor rico para assinatura + Widget WhatsApp
 */

import { useState, useEffect } from 'react'
import { Save, Loader2, Settings, AlertTriangle, ArrowRight, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useConfigTenant, useAtualizarConfigTenant } from '../hooks/useConfigTenant'
import { RichTextEditor } from '../components/editor/RichTextEditor'
import { WidgetWhatsAppConfig } from '../components/whatsapp-widget/WidgetWhatsAppConfig'
import { DEFAULT_WIDGET_CONFIG, type WidgetWhatsAppConfig as WidgetConfig } from '../components/whatsapp-widget/types'
import { supabase } from '@/lib/supabase'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

// =====================================================
// Constantes
// =====================================================

const MOEDAS = [
  { value: 'BRL', label: 'Real (R$)' },
  { value: 'USD', label: 'Dólar (US$)' },
  { value: 'EUR', label: 'Euro (€)' },
]

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belém (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
]

const FORMATOS_DATA = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA' },
  { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD' },
]

// =====================================================
// Hook - Verificar conexão de email
// =====================================================

function useTemConexaoEmail() {
  return useQuery({
    queryKey: ['conexao-email-ativa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conexoes_email')
        .select('id, status')
        .is('deletado_em', null)
        .in('status', ['connected', 'conectado', 'ativo', 'active'])
        .limit(1)

      if (error) throw error
      return (data?.length ?? 0) > 0
    },
    staleTime: 60_000,
  })
}

// =====================================================
// Sub-componentes
// =====================================================

function BannerEmailDesconectado() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 mb-4">
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        <p className="font-medium">Conexão de email necessária</p>
        <p className="text-amber-700 mt-0.5">
          Para enviar notificações por email, conecte primeiro uma conta de email nas Conexões.
        </p>
        <Link
          to="/configuracoes/conexoes"
          className="inline-flex items-center gap-1 mt-1.5 text-sm font-medium text-amber-900 hover:text-amber-950 underline underline-offset-2 transition-colors"
        >
          Ir para Conexões
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

interface NotificationToggleProps {
  label: string
  desc: string
  checked: boolean
  onChange: (checked: boolean) => void
  children?: React.ReactNode
}

function NotificationToggle({ label, desc, checked, onChange, children }: NotificationToggleProps) {
  return (
    <div className="py-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
      {checked && children && (
        <div className="pl-0 mt-1">
          {children}
        </div>
      )}
    </div>
  )
}

function AdminBadge() {
  return (
    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 font-medium text-xs">
      <Shield className="w-3 h-3" />
      Somente Administradores
    </Badge>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// =====================================================
// Componente Principal
// =====================================================

export function ConfigGeralPage() {
  const { role, user } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const { data: config, isLoading } = useConfigTenant()
  const atualizarConfig = useAtualizarConfigTenant()
  const { data: temEmailConectado, isLoading: loadingEmail } = useTemConexaoEmail()

  const [form, setForm] = useState({
    moeda_padrao: 'BRL',
    timezone: 'America/Sao_Paulo',
    formato_data: 'DD/MM/YYYY',
    notificar_nova_oportunidade: true,
    notificar_tarefa_vencida: true,
    notificar_mudanca_etapa: false,
    criar_tarefa_automatica: true,
    dias_alerta_inatividade: 7,
    notificar_inatividade: true,
    assinatura_mensagem: '',
    horario_inicio_envio: '08:00',
    horario_fim_envio: '18:00',
  })

  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(DEFAULT_WIDGET_CONFIG)
  const [temAlteracoes, setTemAlteracoes] = useState(false)

  useEffect(() => {
    if (config) {
      setForm({
        moeda_padrao: config.moeda_padrao || 'BRL',
        timezone: config.timezone || 'America/Sao_Paulo',
        formato_data: config.formato_data || 'DD/MM/YYYY',
        notificar_nova_oportunidade: config.notificar_nova_oportunidade ?? true,
        notificar_tarefa_vencida: config.notificar_tarefa_vencida ?? true,
        notificar_mudanca_etapa: config.notificar_mudanca_etapa ?? false,
        criar_tarefa_automatica: config.criar_tarefa_automatica ?? true,
        dias_alerta_inatividade: config.dias_alerta_inatividade ?? 7,
        notificar_inatividade: (config.dias_alerta_inatividade ?? 7) > 0,
        assinatura_mensagem: config.assinatura_mensagem || '',
        horario_inicio_envio: config.horario_inicio_envio || '08:00',
        horario_fim_envio: config.horario_fim_envio || '18:00',
      })
      // AIDEV-NOTE: Seg — cast seguro sem 'as any'; validação da estrutura garante spread seguro
      const raw = (config as { widget_whatsapp_config?: unknown })?.widget_whatsapp_config
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        setWidgetConfig({ ...DEFAULT_WIDGET_CONFIG, ...(raw as Partial<WidgetConfig>) })
      }
      setTemAlteracoes(false)
    }
  }, [config])

  useEffect(() => {
    setSubtitle('Configure moeda, fuso horário, notificações e automações da sua organização')
    setActions(null)
    return () => { setSubtitle(null); setActions(null) }
  }, [setActions, setSubtitle])

  const updateField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setTemAlteracoes(true)
  }

  const handleWidgetChange = (newConfig: WidgetConfig) => {
    setWidgetConfig(newConfig)
    setTemAlteracoes(true)
  }

  const handleSave = async () => {
    // AIDEV-NOTE: Seg — validar que horario_fim é após horario_inicio
    if (form.horario_inicio_envio >= form.horario_fim_envio) {
      toast.error('Horário de fim deve ser posterior ao horário de início')
      return
    }
    try {
      // Derivar dias_alerta_inatividade do toggle
      const payload = {
        ...form,
        dias_alerta_inatividade: form.notificar_inatividade ? form.dias_alerta_inatividade : 0,
        widget_whatsapp_ativo: widgetConfig.ativo,
        widget_whatsapp_config: widgetConfig,
      }
      // Remover campo local do form antes de enviar
      const { notificar_inatividade, ...rest } = payload
      await atualizarConfig.mutateAsync(rest)
      setTemAlteracoes(false)
    } catch (err) {
      console.error('Erro ao salvar configurações:', err)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Settings className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas administradores podem acessar as configurações gerais.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Localização */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Localização</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectField label="Moeda Padrão" value={form.moeda_padrao} onChange={v => updateField('moeda_padrao', v)} options={MOEDAS} />
          <SelectField label="Fuso Horário" value={form.timezone} onChange={v => updateField('timezone', v)} options={TIMEZONES} />
          <SelectField label="Formato de Data" value={form.formato_data} onChange={v => updateField('formato_data', v)} options={FORMATOS_DATA} />
        </div>
      </section>

      {/* Notificações por Email */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">Notificações por Email</h2>
            <AdminBadge />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Controle quais eventos enviam email automático para os membros da equipe.
          </p>
        </div>

        {!loadingEmail && !temEmailConectado && <BannerEmailDesconectado />}

        {/* Janela de envio */}
        <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Janela de envio</p>
            <p className="text-xs text-muted-foreground mt-0.5">Emails serão enviados apenas dentro deste horário.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-xs">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Início</label>
              <input type="time" value={form.horario_inicio_envio} onChange={e => updateField('horario_inicio_envio', e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Fim</label>
              <input type="time" value={form.horario_fim_envio} onChange={e => updateField('horario_fim_envio', e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground" />
            </div>
          </div>
        </div>

        {/* Eventos */}
        <div className="space-y-1 divide-y divide-border">
          <NotificationToggle
            label="Oportunidade criada"
            desc="Envia email ao responsável quando uma nova oportunidade for criada no pipeline."
            checked={form.notificar_nova_oportunidade}
            onChange={v => updateField('notificar_nova_oportunidade', v)}
          />
          <NotificationToggle
            label="Tarefa vencida"
            desc="Envia email ao responsável quando uma tarefa ultrapassar a data de vencimento."
            checked={form.notificar_tarefa_vencida}
            onChange={v => updateField('notificar_tarefa_vencida', v)}
          />
          <NotificationToggle
            label="Oportunidade movida de etapa"
            desc="Envia email ao responsável quando a oportunidade mudar de etapa no funil."
            checked={form.notificar_mudanca_etapa}
            onChange={v => updateField('notificar_mudanca_etapa', v)}
          />
          <NotificationToggle
            label="Oportunidade inativa"
            desc="Envia email ao responsável quando a oportunidade ficar sem atividade. Também destaca o card no Kanban com badge visual de inatividade."
            checked={form.notificar_inatividade}
            onChange={v => {
              updateField('notificar_inatividade', v)
              if (!v) updateField('dias_alerta_inatividade', 0)
              else if (form.dias_alerta_inatividade === 0) updateField('dias_alerta_inatividade', 7)
            }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Alertar após</span>
              <input
                type="number"
                min={1}
                max={90}
                value={form.dias_alerta_inatividade}
                onChange={e => updateField('dias_alerta_inatividade', parseInt(e.target.value) || 7)}
                className="w-16 h-8 px-2 rounded-md border border-input bg-background text-sm text-foreground text-center"
              />
              <span>dias sem atividade</span>
            </div>
          </NotificationToggle>
        </div>
      </section>

      {/* Automações do Pipeline */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">Automações do Pipeline</h2>
            <AdminBadge />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure ações automáticas que acontecem ao movimentar oportunidades entre etapas.
          </p>
        </div>

        <div className="space-y-1">
          <NotificationToggle
            label="Criar tarefas automaticamente"
            desc="Ao mover uma oportunidade para uma nova etapa, as tarefas configuradas naquela etapa serão criadas automaticamente."
            checked={form.criar_tarefa_automatica}
            onChange={v => updateField('criar_tarefa_automatica', v)}
          />
        </div>
      </section>

      {/* Assinatura - Editor Rico */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Assinatura de Mensagem</h2>
          <p className="text-xs text-muted-foreground mt-1">Crie uma assinatura com formatação, imagens e tabelas para seus emails e mensagens.</p>
        </div>
        <RichTextEditor value={form.assinatura_mensagem} onChange={html => updateField('assinatura_mensagem', html)} placeholder="Crie sua assinatura profissional..." />
      </section>

      {/* Widget WhatsApp */}
      <WidgetWhatsAppConfig value={widgetConfig} onChange={handleWidgetChange} organizacaoId={user?.organizacao_id || ''} />

      {/* Botão salvar (condicional) */}
      {temAlteracoes && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={atualizarConfig.isPending}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-md shadow-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
          >
            {atualizarConfig.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Alterações
          </button>
        </div>
      )}
    </div>
  )
}

export default ConfigGeralPage
