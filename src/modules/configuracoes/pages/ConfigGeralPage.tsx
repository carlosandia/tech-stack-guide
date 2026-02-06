/**
 * AIDEV-NOTE: Página de Configurações Gerais do Tenant (Admin Only)
 * Conforme PRD-05 - Seção 4. Configurações Gerais
 * Campos: moeda, timezone, formato data, notificações, horários comerciais
 */

import { useState, useEffect } from 'react'
import { Save, Loader2, Settings } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useConfigTenant, useAtualizarConfigTenant } from '../hooks/useConfigTenant'

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

export function ConfigGeralPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const { data: config, isLoading } = useConfigTenant()
  const atualizarConfig = useAtualizarConfigTenant()

  // Estado local para tracking de mudanças
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

  // Carregar dados do backend
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
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Moeda Padrão</label>
            <select
              value={form.moeda_padrao}
              onChange={e => updateField('moeda_padrao', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
            >
              {MOEDAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Fuso Horário</label>
            <select
              value={form.timezone}
              onChange={e => updateField('timezone', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
            >
              {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Formato de Data</label>
            <select
              value={form.formato_data}
              onChange={e => updateField('formato_data', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
            >
              {FORMATOS_DATA.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Notificações */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Notificações</h2>

        {[
          { key: 'notificar_nova_oportunidade' as const, label: 'Nova Oportunidade', desc: 'Enviar email ao criar oportunidade' },
          { key: 'notificar_tarefa_vencida' as const, label: 'Tarefa Vencida', desc: 'Enviar email quando tarefa vencer' },
          { key: 'notificar_mudanca_etapa' as const, label: 'Mudança de Etapa', desc: 'Enviar email ao mover etapa no funil' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <button
              onClick={() => updateField(item.key, !form[item.key])}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                form[item.key] ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                form[item.key] ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        ))}
      </section>

      {/* Automação */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Automação</h2>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Criar Tarefa Automática</p>
            <p className="text-xs text-muted-foreground">Criar tarefas da etapa automaticamente ao mover oportunidade</p>
          </div>
          <button
            onClick={() => updateField('criar_tarefa_automatica', !form.criar_tarefa_automatica)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              form.criar_tarefa_automatica ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
              form.criar_tarefa_automatica ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

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

      {/* Assinatura */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Assinatura de Mensagem</h2>
        <textarea
          value={form.assinatura_mensagem}
          onChange={e => updateField('assinatura_mensagem', e.target.value)}
          placeholder="Assinatura padrão para mensagens enviadas pelo CRM..."
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground resize-none"
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
