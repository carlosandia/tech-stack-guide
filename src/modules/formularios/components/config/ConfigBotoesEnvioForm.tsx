/**
 * AIDEV-NOTE: Configuração dos botões de envio do formulário
 * Permite escolher entre botão Enviar, WhatsApp ou ambos
 * Cada botão tem configs de criar oportunidade, notificar email, etc.
 */

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface ConfigBotoes {
  tipo_botao: 'enviar' | 'whatsapp' | 'ambos'
  enviar_cria_oportunidade: boolean
  enviar_notifica_email: boolean
  enviar_email_destino: string
  enviar_notifica_whatsapp: boolean
  enviar_whatsapp_destino: string
  enviar_url_redirecionamento: string
  enviar_funil_id: string
  whatsapp_numero: string
  whatsapp_cria_oportunidade: boolean
  whatsapp_notifica_email: boolean
  whatsapp_email_destino: string
  whatsapp_notifica_whatsapp: boolean
  whatsapp_whatsapp_destino: string
  whatsapp_mensagem_template: string
  whatsapp_funil_id: string
}

const CONFIG_PADRAO: ConfigBotoes = {
  tipo_botao: 'enviar',
  enviar_cria_oportunidade: true,
  enviar_notifica_email: false,
  enviar_email_destino: '',
  enviar_notifica_whatsapp: false,
  enviar_whatsapp_destino: '',
  enviar_url_redirecionamento: '',
  enviar_funil_id: '',
  whatsapp_numero: '',
  whatsapp_cria_oportunidade: false,
  whatsapp_notifica_email: false,
  whatsapp_email_destino: '',
  whatsapp_notifica_whatsapp: false,
  whatsapp_whatsapp_destino: '',
  whatsapp_mensagem_template: '',
  whatsapp_funil_id: '',
}

interface Props {
  formularioId: string
}

export function ConfigBotoesEnvioForm({ formularioId }: Props) {
  const [config, setConfig] = useState<ConfigBotoes>(CONFIG_PADRAO)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('formularios')
        .select('config_botoes')
        .eq('id', formularioId)
        .single()

      if (data?.config_botoes && typeof data.config_botoes === 'object') {
        setConfig({ ...CONFIG_PADRAO, ...(data.config_botoes as Partial<ConfigBotoes>) })
      }
      setLoaded(true)
    }
    load()
  }, [formularioId])

  const update = (key: keyof ConfigBotoes, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('formularios')
      .update({ config_botoes: config as any })
      .eq('id', formularioId)

    setSaving(false)
    if (error) {
      toast.error('Erro ao salvar configuração')
    } else {
      toast.success('Configuração de botões salva')
    }
  }

  if (!loaded) return null

  const showEnviar = config.tipo_botao === 'enviar' || config.tipo_botao === 'ambos'
  const showWhatsApp = config.tipo_botao === 'whatsapp' || config.tipo_botao === 'ambos'

  return (
    <div className="space-y-5">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Send className="w-4 h-4" />
        Botões de Envio
      </h4>

      {/* Tipo do botão */}
      <div className="space-y-1.5">
        <Label className="text-xs">Tipo de Botão</Label>
        <Select value={config.tipo_botao} onValueChange={(v) => update('tipo_botao', v)}>
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enviar">Apenas Enviar</SelectItem>
            <SelectItem value="whatsapp">Apenas WhatsApp</SelectItem>
            <SelectItem value="ambos">Ambos (Enviar + WhatsApp)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Seção Enviar */}
      {showEnviar && (
        <div className="space-y-3 p-3 rounded-md border border-border bg-muted/30">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> Botão Enviar
          </p>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Criar oportunidade automaticamente</Label>
            <Switch
              checked={config.enviar_cria_oportunidade}
              onCheckedChange={(v) => update('enviar_cria_oportunidade', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Notificar por e-mail</Label>
            <Switch
              checked={config.enviar_notifica_email}
              onCheckedChange={(v) => update('enviar_notifica_email', v)}
            />
          </div>

          {config.enviar_notifica_email && (
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail de destino</Label>
              <Input
                value={config.enviar_email_destino}
                onChange={(e) => update('enviar_email_destino', e.target.value)}
                placeholder="email@empresa.com"
                className="text-xs"
                type="email"
              />
            </div>
          )}
        </div>
      )}

      {/* Seção WhatsApp */}
      {showWhatsApp && (
        <div className="space-y-3 p-3 rounded-md border border-border bg-muted/30">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <WhatsAppIcon size={14} /> Botão WhatsApp
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs">Número do WhatsApp (com DDI)</Label>
            <Input
              value={config.whatsapp_numero}
              onChange={(e) => update('whatsapp_numero', e.target.value)}
              placeholder="5511999999999"
              className="text-xs"
            />
            <p className="text-[10px] text-muted-foreground">Ex: 5511999999999 (sem +, espaços ou traços)</p>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Criar oportunidade automaticamente</Label>
            <Switch
              checked={config.whatsapp_cria_oportunidade}
              onCheckedChange={(v) => update('whatsapp_cria_oportunidade', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Notificar por e-mail</Label>
            <Switch
              checked={config.whatsapp_notifica_email}
              onCheckedChange={(v) => update('whatsapp_notifica_email', v)}
            />
          </div>

          {config.whatsapp_notifica_email && (
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail de destino</Label>
              <Input
                value={config.whatsapp_email_destino}
                onChange={(e) => update('whatsapp_email_destino', e.target.value)}
                placeholder="email@empresa.com"
                className="text-xs"
                type="email"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Template da mensagem (opcional)</Label>
            <Textarea
              value={config.whatsapp_mensagem_template}
              onChange={(e) => update('whatsapp_mensagem_template', e.target.value)}
              placeholder={"Deixe vazio para auto-gerar.\nOu use variáveis: {{campo_label}}"}
              className="text-xs font-mono"
              rows={4}
            />
            <p className="text-[10px] text-muted-foreground">
              Se vazio, será gerado automaticamente com todos os campos preenchidos.
            </p>
          </div>
        </div>
      )}

      <Button size="sm" className="w-full text-xs" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
        Salvar Configuração de Botões
      </Button>
    </div>
  )
}
