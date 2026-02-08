/**
 * AIDEV-NOTE: Configuração de pipeline para pré-oportunidades WhatsApp
 * Permite toggle de criação automática e seleção de pipeline destino
 * Ao ativar, configura webhook no WAHA para receber mensagens
 */

import { useState, useEffect } from 'react'
import { Loader2, MessageSquarePlus, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface WhatsAppPipelineConfigProps {
  sessaoId: string
  sessionName?: string
  onUpdate?: () => void
}

interface Funil {
  id: string
  nome: string
}

interface SessaoConfig {
  auto_criar_pre_oportunidade: boolean
  funil_destino_id: string | null
  session_name: string
  webhook_url: string | null
}

export function WhatsAppPipelineConfig({ sessaoId, sessionName, onUpdate }: WhatsAppPipelineConfigProps) {
  const [config, setConfig] = useState<SessaoConfig | null>(null)
  const [funis, setFunis] = useState<Funil[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [sessaoRes, funisRes] = await Promise.all([
          supabase
            .from('sessoes_whatsapp')
            .select('auto_criar_pre_oportunidade, funil_destino_id, session_name, webhook_url')
            .eq('id', sessaoId)
            .single(),
          supabase
            .from('funis')
            .select('id, nome')
            .eq('ativo', true)
            .eq('arquivado', false)
            .is('deletado_em', null)
            .order('nome', { ascending: true }),
        ])

        if (sessaoRes.data) {
          setConfig({
            auto_criar_pre_oportunidade: sessaoRes.data.auto_criar_pre_oportunidade ?? false,
            funil_destino_id: sessaoRes.data.funil_destino_id ?? null,
            session_name: sessaoRes.data.session_name,
            webhook_url: sessaoRes.data.webhook_url ?? null,
          })
        }

        if (funisRes.data) {
          setFunis(funisRes.data)
        }
      } catch (err) {
        console.error('[WhatsAppPipelineConfig] Error loading:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessaoId])

  /** Configure webhook on WAHA server via waha-proxy */
  const configureWebhook = async (sName: string) => {
    try {
      console.log('[WhatsAppPipelineConfig] Configuring webhook for session:', sName)
      const { data, error } = await supabase.functions.invoke('waha-proxy', {
        body: { action: 'configurar_webhook', session_name: sName },
      })

      if (error) {
        console.error('[WhatsAppPipelineConfig] Webhook config error:', error)
        return false
      }

      console.log('[WhatsAppPipelineConfig] Webhook configured:', data)
      return true
    } catch (err) {
      console.error('[WhatsAppPipelineConfig] Webhook config failed:', err)
      return false
    }
  }

  const handleToggle = async (enabled: boolean) => {
    if (!config) return
    setSaving(true)
    try {
      const newConfig = { ...config, auto_criar_pre_oportunidade: enabled }

      // If enabling, ensure a pipeline is selected
      if (enabled && !newConfig.funil_destino_id && funis.length > 0) {
        newConfig.funil_destino_id = funis[0].id
      }

      const { error } = await supabase
        .from('sessoes_whatsapp')
        .update({
          auto_criar_pre_oportunidade: newConfig.auto_criar_pre_oportunidade,
          funil_destino_id: newConfig.funil_destino_id,
        })
        .eq('id', sessaoId)

      if (error) throw error

      // If enabling, also configure the webhook on WAHA
      if (enabled) {
        const sName = sessionName || config.session_name
        const webhookOk = await configureWebhook(sName)
        if (!webhookOk) {
          toast.warning('Configuração salva, mas houve erro ao configurar webhook no WAHA')
        }
      }

      setConfig(newConfig)
      toast.success(enabled ? 'Solicitações automáticas ativadas' : 'Solicitações automáticas desativadas')
      onUpdate?.()
    } catch (err) {
      console.error('[WhatsAppPipelineConfig] Error saving toggle:', err)
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const handlePipelineChange = async (funilId: string) => {
    if (!config) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('sessoes_whatsapp')
        .update({
          funil_destino_id: funilId,
        })
        .eq('id', sessaoId)

      if (error) throw error

      setConfig({ ...config, funil_destino_id: funilId })
      toast.success('Pipeline atualizada')
      onUpdate?.()
    } catch (err) {
      console.error('[WhatsAppPipelineConfig] Error saving pipeline:', err)
      toast.error('Erro ao salvar pipeline')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Carregando configurações...</span>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex items-start gap-2">
        <MessageSquarePlus className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={`auto-preop-${sessaoId}`}
              className="text-xs font-medium text-foreground cursor-pointer"
            >
              Criar solicitações automaticamente
            </label>
            <button
              id={`auto-preop-${sessaoId}`}
              role="switch"
              aria-checked={config.auto_criar_pre_oportunidade}
              onClick={() => handleToggle(!config.auto_criar_pre_oportunidade)}
              disabled={saving}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                disabled:opacity-50
                ${config.auto_criar_pre_oportunidade ? 'bg-primary' : 'bg-input'}
              `}
            >
              <span
                className={`
                  inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm
                  ${config.auto_criar_pre_oportunidade ? 'translate-x-4' : 'translate-x-0.5'}
                `}
              />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Ao receber mensagens novas, cria uma solicitação na coluna "Solicitações" do Kanban
          </p>
        </div>
      </div>

      {config.auto_criar_pre_oportunidade && (
        <div className="pl-6">
          <label className="text-xs font-medium text-foreground block mb-1.5">
            Pipeline de destino
          </label>
          <div className="relative">
            <select
              value={config.funil_destino_id || ''}
              onChange={(e) => handlePipelineChange(e.target.value)}
              disabled={saving || funis.length === 0}
              className="
                w-full h-8 pl-3 pr-8 text-xs rounded-md border border-input bg-background
                text-foreground appearance-none
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {funis.length === 0 ? (
                <option value="">Nenhuma pipeline disponível</option>
              ) : (
                funis.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  )
}
