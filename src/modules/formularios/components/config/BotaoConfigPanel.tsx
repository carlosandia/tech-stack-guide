/**
 * AIDEV-NOTE: Painel compacto com abas Estilo/Configuração para botões
 * Renderizado no EstiloPopover quando selectedStyleElement é 'botao' ou 'botao_whatsapp'
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
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { ConfigBotoes } from './ConfigBotoesEnvioForm'
import type { EstiloBotao } from '../../services/formularios.api'
import { useQueryClient } from '@tanstack/react-query'

type TabType = 'estilo' | 'config'

const CONFIG_PADRAO: ConfigBotoes = {
  tipo_botao: 'enviar',
  enviar_cria_oportunidade: true,
  enviar_notifica_email: false,
  enviar_email_destino: '',
  whatsapp_numero: '',
  whatsapp_cria_oportunidade: false,
  whatsapp_notifica_email: false,
  whatsapp_email_destino: '',
  whatsapp_mensagem_template: '',
}

interface Props {
  formularioId: string
  tipo: 'botao' | 'botao_whatsapp'
  estiloBotao: EstiloBotao
  onChangeEstilo: (v: EstiloBotao) => void
  onConfigChange?: (config: ConfigBotoes) => void
}

export function BotaoConfigPanel({ formularioId, tipo, estiloBotao, onChangeEstilo, onConfigChange }: Props) {
  const [tab, setTab] = useState<TabType>('estilo')
  const [config, setConfig] = useState<ConfigBotoes>(CONFIG_PADRAO)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const queryClient = useQueryClient()

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

  const updateConfig = (key: keyof ConfigBotoes, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const saveConfig = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('formularios')
      .update({ config_botoes: config as any })
      .eq('id', formularioId)

    setSaving(false)
    if (error) {
      toast.error('Erro ao salvar configuração')
    } else {
      toast.success('Configuração salva')
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId] })
      onConfigChange?.(config)
    }
  }

  const updateEstilo = (key: keyof EstiloBotao, val: string) => {
    onChangeEstilo({ ...estiloBotao, [key]: val })
  }

  const isWhatsApp = tipo === 'botao_whatsapp'

  return (
    <div className="space-y-3">
      {/* Tab toggle */}
      <div className="flex border border-border rounded-md overflow-hidden">
        <button
          type="button"
          className={cn(
            'flex-1 text-xs py-1.5 font-medium transition-colors',
            tab === 'estilo' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setTab('estilo')}
        >
          Estilo
        </button>
        <button
          type="button"
          className={cn(
            'flex-1 text-xs py-1.5 font-medium transition-colors',
            tab === 'config' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setTab('config')}
        >
          Configuração
        </button>
      </div>

      {/* Estilo tab */}
      {tab === 'estilo' && (
        <div className="space-y-3">
          {isWhatsApp ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Texto do Botão</Label>
                <Input
                  value={estiloBotao.whatsapp_texto || 'Enviar via WhatsApp'}
                  onChange={(e) => updateEstilo('whatsapp_texto', e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cor de Fundo</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={estiloBotao.whatsapp_background || '#25D366'}
                    onChange={(e) => updateEstilo('whatsapp_background', e.target.value)}
                    className="w-8 h-8 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={estiloBotao.whatsapp_background || '#25D366'}
                    onChange={(e) => updateEstilo('whatsapp_background', e.target.value)}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cor do Texto</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={estiloBotao.whatsapp_texto_cor || '#FFFFFF'}
                    onChange={(e) => updateEstilo('whatsapp_texto_cor', e.target.value)}
                    className="w-8 h-8 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={estiloBotao.whatsapp_texto_cor || '#FFFFFF'}
                    onChange={(e) => updateEstilo('whatsapp_texto_cor', e.target.value)}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Borda Arredondada</Label>
                <Input
                  value={estiloBotao.whatsapp_border_radius || '6px'}
                  onChange={(e) => updateEstilo('whatsapp_border_radius', e.target.value)}
                  className="text-xs"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Texto do Botão</Label>
                <Input
                  value={estiloBotao.texto || 'Enviar'}
                  onChange={(e) => updateEstilo('texto', e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cor do Texto</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={estiloBotao.texto_cor || '#FFFFFF'}
                    onChange={(e) => updateEstilo('texto_cor', e.target.value)}
                    className="w-8 h-8 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={estiloBotao.texto_cor || '#FFFFFF'}
                    onChange={(e) => updateEstilo('texto_cor', e.target.value)}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cor de Fundo</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={estiloBotao.background_color || '#3B82F6'}
                    onChange={(e) => updateEstilo('background_color', e.target.value)}
                    className="w-8 h-8 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={estiloBotao.background_color || '#3B82F6'}
                    onChange={(e) => updateEstilo('background_color', e.target.value)}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cor de Hover</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={estiloBotao.hover_background || '#2563EB'}
                    onChange={(e) => updateEstilo('hover_background', e.target.value)}
                    className="w-8 h-8 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={estiloBotao.hover_background || '#2563EB'}
                    onChange={(e) => updateEstilo('hover_background', e.target.value)}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Borda Arredondada</Label>
                <Input
                  value={estiloBotao.border_radius || '6px'}
                  onChange={(e) => updateEstilo('border_radius', e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Largura</Label>
                <Select value={estiloBotao.largura || 'full'} onValueChange={(v) => updateEstilo('largura', v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Largura Total</SelectItem>
                    <SelectItem value="auto">Automática</SelectItem>
                    <SelectItem value="50%">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tamanho</Label>
                <Select value={estiloBotao.tamanho || 'md'} onValueChange={(v) => updateEstilo('tamanho', v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Pequeno</SelectItem>
                    <SelectItem value="md">Médio</SelectItem>
                    <SelectItem value="lg">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      )}

      {/* Config tab */}
      {tab === 'config' && loaded && (
        <div className="space-y-3">
          {/* Tipo botão */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de Botão</Label>
            <Select value={config.tipo_botao} onValueChange={(v) => updateConfig('tipo_botao', v)}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="enviar">Apenas Enviar</SelectItem>
                <SelectItem value="whatsapp">Apenas WhatsApp</SelectItem>
                <SelectItem value="ambos">Ambos (Enviar + WhatsApp)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enviar config */}
          {(config.tipo_botao === 'enviar' || config.tipo_botao === 'ambos') && !isWhatsApp && (
            <div className="space-y-2 p-2 rounded border border-border bg-muted/30">
              <p className="text-xs font-medium flex items-center gap-1.5">
                <Send className="w-3 h-3" /> Enviar
              </p>
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Criar oportunidade</Label>
                <Switch
                  checked={config.enviar_cria_oportunidade}
                  onCheckedChange={(v) => updateConfig('enviar_cria_oportunidade', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Notificar e-mail</Label>
                <Switch
                  checked={config.enviar_notifica_email}
                  onCheckedChange={(v) => updateConfig('enviar_notifica_email', v)}
                />
              </div>
              {config.enviar_notifica_email && (
                <Input
                  value={config.enviar_email_destino}
                  onChange={(e) => updateConfig('enviar_email_destino', e.target.value)}
                  placeholder="email@empresa.com"
                  className="text-xs"
                  type="email"
                />
              )}
            </div>
          )}

          {/* WhatsApp config */}
          {(config.tipo_botao === 'whatsapp' || config.tipo_botao === 'ambos') && isWhatsApp && (
            <div className="space-y-2 p-2 rounded border border-border bg-muted/30">
              <p className="text-xs font-medium flex items-center gap-1.5">
                <WhatsAppIcon size={12} /> WhatsApp
              </p>
              <div className="space-y-1">
                <Label className="text-[11px]">Número (com DDI)</Label>
                <Input
                  value={config.whatsapp_numero}
                  onChange={(e) => updateConfig('whatsapp_numero', e.target.value)}
                  placeholder="5511999999999"
                  className="text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Criar oportunidade</Label>
                <Switch
                  checked={config.whatsapp_cria_oportunidade}
                  onCheckedChange={(v) => updateConfig('whatsapp_cria_oportunidade', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Notificar e-mail</Label>
                <Switch
                  checked={config.whatsapp_notifica_email}
                  onCheckedChange={(v) => updateConfig('whatsapp_notifica_email', v)}
                />
              </div>
              {config.whatsapp_notifica_email && (
                <Input
                  value={config.whatsapp_email_destino}
                  onChange={(e) => updateConfig('whatsapp_email_destino', e.target.value)}
                  placeholder="email@empresa.com"
                  className="text-xs"
                  type="email"
                />
              )}
              <div className="space-y-1">
                <Label className="text-[11px]">Template mensagem</Label>
                <Textarea
                  value={config.whatsapp_mensagem_template}
                  onChange={(e) => updateConfig('whatsapp_mensagem_template', e.target.value)}
                  placeholder="Deixe vazio para auto-gerar"
                  className="text-xs font-mono"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Show general config for opposite button type */}
          {isWhatsApp && (config.tipo_botao === 'enviar' || config.tipo_botao === 'ambos') && (
            <p className="text-[10px] text-muted-foreground">Clique no pincel do botão Enviar para configurá-lo.</p>
          )}
          {!isWhatsApp && (config.tipo_botao === 'whatsapp' || config.tipo_botao === 'ambos') && (
            <p className="text-[10px] text-muted-foreground">Clique no pincel do botão WhatsApp para configurá-lo.</p>
          )}

          <Button size="sm" className="w-full text-xs" onClick={saveConfig} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Salvar Configuração
          </Button>
        </div>
      )}
    </div>
  )
}
