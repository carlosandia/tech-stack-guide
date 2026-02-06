/**
 * AIDEV-NOTE: Página de Configurações Gerais do Tenant (Admin Only)
 * Conforme PRD-05 - Seção 4. Configurações Gerais
 * Campos: moeda, timezone, formato data, notificações, horários comerciais
 * Inclui: banner de email desconectado + editor rico para assinatura
 */

import { useState, useEffect } from 'react'
import { Save, Loader2, Settings, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useConfigTenant, useAtualizarConfigTenant } from '../hooks/useConfigTenant'
import { RichTextEditor } from '../components/editor/RichTextEditor'
import { supabase } from '@/lib/supabase'

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
        .in('status', ['connected', 'ativo'])
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
          to="/app/configuracoes/conexoes"
          className="inline-flex items-center gap-1 mt-1.5 text-sm font-medium text-amber-900 hover:text-amber-950 underline underline-offset-2 transition-colors"
        >
          Ir para Conexões
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

interface ToggleItemProps {
  label: string
  desc: string
  checked: boolean
  onChange: () => void
}

function ToggleItem({ label, desc, checked, onChange }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
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
  const { role } = useAuth()
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
    assinatura_mensagem: '',
    horario_inicio_envio: '08:00',
    horario_fim_envio: '18:00',
  })
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
        assinatura_mensagem: config.assinatura_mensagem || '',
        horario_inicio_envio: config.horario_inicio_envio || '08:00',
        horario_fim_envio: config.horario_fim_envio || '18:00',
      })
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

  const handleSave = async () => {
    try {
      await atualizarConfig.mutateAsync(form)
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
    <div className="max-w-2xl space-y-8">
      {/* Localização */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Localização</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="Moeda Padrão" value={form.moeda_padrao} onChange={v => updateField('moeda_padrao', v)} options={MOEDAS} />
          <SelectField label="Fuso Horário" value={form.timezone} onChange={v => updateField('timezone', v)} options={TIMEZONES} />
          <SelectField label="Formato de Data" value={form.formato_data} onChange={v => updateField('formato_data', v)} options={FORMATOS_DATA} />
        </div>
      </section>

      {/* Notificações */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Notificações</h2>

        {/* Banner de email desconectado */}
        {!loadingEmail && !temEmailConectado && <BannerEmailDesconectado />}

        <ToggleItem
          label="Nova Oportunidade"
          desc="Enviar email ao criar oportunidade"
          checked={form.notificar_nova_oportunidade}
          onChange={() => updateField('notificar_nova_oportunidade', !form.notificar_nova_oportunidade)}
        />
        <ToggleItem
          label="Tarefa Vencida"
          desc="Enviar email quando tarefa vencer"
          checked={form.notificar_tarefa_vencida}
          onChange={() => updateField('notificar_tarefa_vencida', !form.notificar_tarefa_vencida)}
        />
        <ToggleItem
          label="Mudança de Etapa"
          desc="Enviar email ao mover etapa no funil"
          checked={form.notificar_mudanca_etapa}
          onChange={() => updateField('notificar_mudanca_etapa', !form.notificar_mudanca_etapa)}
        />
      </section>

      {/* Automação */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Automação</h2>
        <ToggleItem
          label="Criar Tarefa Automática"
          desc="Criar tarefas da etapa automaticamente ao mover oportunidade"
          checked={form.criar_tarefa_automatica}
          onChange={() => updateField('criar_tarefa_automatica', !form.criar_tarefa_automatica)}
        />
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Dias para Alerta de Inatividade
          </label>
          <input
            type="number"
            min={1}
            max={90}
            value={form.dias_alerta_inatividade}
            onChange={e => updateField('dias_alerta_inatividade', parseInt(e.target.value) || 7)}
            className="w-32 h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
          />
          <p className="text-xs text-muted-foreground mt-1">Alertar após X dias sem atividade na oportunidade</p>
        </div>
      </section>

      {/* Horário Comercial */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Horário Comercial</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Início</label>
            <input
              type="time"
              value={form.horario_inicio_envio}
              onChange={e => updateField('horario_inicio_envio', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Fim</label>
            <input
              type="time"
              value={form.horario_fim_envio}
              onChange={e => updateField('horario_fim_envio', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Mensagens programadas serão enviadas dentro deste horário</p>
      </section>

      {/* Assinatura - Editor Rico */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Assinatura de Mensagem</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Crie uma assinatura com formatação, imagens e tabelas para seus emails e mensagens.
          </p>
        </div>
        <RichTextEditor
          value={form.assinatura_mensagem}
          onChange={html => updateField('assinatura_mensagem', html)}
          placeholder="Crie sua assinatura profissional..."
        />
      </section>

      {/* Botão salvar (condicional) */}
      {temAlteracoes && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={atualizarConfig.isPending}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-md shadow-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
          >
            {atualizarConfig.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Alterações
          </button>
        </div>
      )}
    </div>
  )
}
