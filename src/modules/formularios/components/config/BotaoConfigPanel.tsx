/**
 * AIDEV-NOTE: Painel compacto com abas Estilo/Configuração para botões
 * Renderizado no EstiloPopover quando selectedStyleElement é 'botao' ou 'botao_whatsapp'
 * Inclui pipeline selector ao criar oportunidade, formatação de fonte, SMTP info
 */

import { useState, useEffect, useRef } from 'react'
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
import { Send, Bold, Italic, Underline, Mail, MessageCircle } from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { ConfigBotoes } from './ConfigBotoesEnvioForm'
import type { EstiloBotao } from '../../services/formularios.api'
import { useQueryClient } from '@tanstack/react-query'

type TabType = 'estilo' | 'config' | 'pos_envio'

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

interface FunilOption {
  id: string
  nome: string
}

interface SmtpInfo {
  email: string
  status: string
}

interface WahaInfo {
  phone_number: string | null
  phone_name: string | null
  status: string
}

interface Props {
  formularioId: string
  tipo: 'botao' | 'botao_whatsapp'
  estiloBotao: EstiloBotao
  onChangeEstilo: (v: EstiloBotao) => void
  onConfigChange?: (config: ConfigBotoes) => void
  onSaveEstilos?: () => void
  isSavingEstilos?: boolean
  onRegisterSave?: (saveFn: () => Promise<void>) => void
}

export function BotaoConfigPanel({ formularioId, tipo, estiloBotao, onChangeEstilo, onConfigChange, onRegisterSave }: Props) {
  const [tab, setTab] = useState<TabType>('estilo')
  const [config, setConfig] = useState<ConfigBotoes>(CONFIG_PADRAO)
  const [loaded, setLoaded] = useState(false)
  const [funis, setFunis] = useState<FunilOption[]>([])
  const [smtpInfo, setSmtpInfo] = useState<SmtpInfo | null>(null)
  const [wahaInfo, setWahaInfo] = useState<WahaInfo | null>(null)
  const [posEnvio, setPosEnvio] = useState({
    mensagem_sucesso: 'Formulário enviado com sucesso! Entraremos em contato em breve.',
    mensagem_erro: 'Ocorreu um erro ao enviar. Tente novamente.',
    tipo_acao_sucesso: 'mensagem' as 'mensagem' | 'redirecionar' | 'ambos',
    url_redirecionamento: '',
    tempo_redirecionamento: 3,
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('formularios')
        .select('config_botoes, config_pos_envio')
        .eq('id', formularioId)
        .single()

      if (data?.config_botoes && typeof data.config_botoes === 'object') {
        setConfig({ ...CONFIG_PADRAO, ...(data.config_botoes as Partial<ConfigBotoes>) })
      }
      if (data?.config_pos_envio && typeof data.config_pos_envio === 'object') {
        setPosEnvio(prev => ({ ...prev, ...(data.config_pos_envio as any) }))
      }
      setLoaded(true)
    }
    load()
  }, [formularioId])

  // Load pipelines for oportunidade selection
  useEffect(() => {
    async function loadFunis() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // AIDEV-NOTE: Busca organizacao_id via tabela usuarios (não user_metadata)
      const { data: usr } = await supabase
        .from('usuarios')
        .select('organizacao_id')
        .eq('auth_id', user.id)
        .maybeSingle()
      if (!usr?.organizacao_id) return

      const { data } = await supabase
        .from('funis')
        .select('id, nome')
        .eq('organizacao_id', usr.organizacao_id)
        .is('deletado_em', null)
        .eq('arquivado', false)
        .order('nome')

      if (data) setFunis(data)
    }
    loadFunis()
  }, [])

  // Load SMTP info for email notification
  useEffect(() => {
    async function loadSmtp() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usr } = await supabase
        .from('usuarios')
        .select('organizacao_id')
        .eq('auth_id', user.id)
        .maybeSingle()
      if (!usr?.organizacao_id) return

      const { data } = await supabase
        .from('conexoes_email')
        .select('email, status')
        .eq('organizacao_id', usr.organizacao_id)
        .in('status', ['conectado', 'ativo'])
        .limit(1)
        .maybeSingle()

      if (data) setSmtpInfo(data)
    }
    loadSmtp()
  }, [])

  // Load WhatsApp WAHA session info
  useEffect(() => {
    async function loadWaha() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usr } = await supabase
        .from('usuarios')
        .select('organizacao_id')
        .eq('auth_id', user.id)
        .maybeSingle()
      if (!usr?.organizacao_id) return

      const { data } = await supabase
        .from('sessoes_whatsapp')
        .select('phone_number, phone_name, status')
        .eq('organizacao_id', usr.organizacao_id)
        .eq('status', 'connected')
        .limit(1)
        .maybeSingle()

      if (data) setWahaInfo(data)
    }
    loadWaha()
  }, [])

  const updateConfig = (key: keyof ConfigBotoes, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const saveConfig = async () => {
    const { error } = await supabase
      .from('formularios')
      .update({ config_botoes: config as any, config_pos_envio: posEnvio as any })
      .eq('id', formularioId)

    if (error) {
      toast.error('Erro ao salvar configuração')
    } else {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId] })
      onConfigChange?.(config)
    }
  }

  // Register save function for parent to call
  useEffect(() => {
    onRegisterSave?.(saveConfig)
  })

  // AIDEV-NOTE: Auto-save config/posEnvio com debounce de 1s
  const configDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const configInitialized = useRef(false)

  useEffect(() => {
    if (!loaded) return
    if (!configInitialized.current) {
      configInitialized.current = true
      return
    }
    if (configDebounceRef.current) clearTimeout(configDebounceRef.current)
    configDebounceRef.current = setTimeout(() => {
      saveConfig()
    }, 1000)
    return () => {
      if (configDebounceRef.current) clearTimeout(configDebounceRef.current)
    }
  }, [config, posEnvio, loaded])

  const updatePosEnvio = (key: string, value: unknown) => {
    setPosEnvio(prev => ({ ...prev, [key]: value }))
  }

  const updateEstilo = (key: keyof EstiloBotao, val: string | boolean) => {
    onChangeEstilo({ ...estiloBotao, [key]: val })
  }

  const isWhatsApp = tipo === 'botao_whatsapp'

  /** Renders font formatting controls (bold, italic, underline) */
  const renderFontFormatting = (prefix: '' | 'whatsapp_') => {
    const boldKey = `${prefix}font_bold` as keyof EstiloBotao
    const italicKey = `${prefix}font_italic` as keyof EstiloBotao
    const underlineKey = `${prefix}font_underline` as keyof EstiloBotao
    const weightKey = `${prefix}font_weight` as keyof EstiloBotao

    return (
      <div className="space-y-1.5">
        <Label className="text-xs">Formatação</Label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => updateEstilo(boldKey, !estiloBotao[boldKey])}
            className={cn(
              'p-1.5 rounded border transition-colors',
              estiloBotao[boldKey] ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
            )}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => updateEstilo(italicKey, !estiloBotao[italicKey])}
            className={cn(
              'p-1.5 rounded border transition-colors',
              estiloBotao[italicKey] ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
            )}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => updateEstilo(underlineKey, !estiloBotao[underlineKey])}
            className={cn(
              'p-1.5 rounded border transition-colors',
              estiloBotao[underlineKey] ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
            )}
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mt-1.5">
          <Label className="text-xs">Peso da Fonte</Label>
          <Select value={(estiloBotao[weightKey] as string) || '600'} onValueChange={(v) => updateEstilo(weightKey, v)}>
            <SelectTrigger className="text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="300">Light (300)</SelectItem>
              <SelectItem value="400">Normal (400)</SelectItem>
              <SelectItem value="500">Medium (500)</SelectItem>
              <SelectItem value="600">Semibold (600)</SelectItem>
              <SelectItem value="700">Bold (700)</SelectItem>
              <SelectItem value="800">Extra Bold (800)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  /** Renders border, padding, margin controls */
  const renderBorderAndSpacing = (prefix: '' | 'whatsapp_') => {
    const bwKey = `${prefix}border_width` as keyof EstiloBotao
    const bcKey = `${prefix}border_color` as keyof EstiloBotao
    const bsKey = `${prefix}border_style` as keyof EstiloBotao
    const padKey = `${prefix}padding` as keyof EstiloBotao
    const marKey = `${prefix}margin` as keyof EstiloBotao

    return (
      <>
        {/* Border */}
        <div className="space-y-1.5">
          <Label className="text-xs">Borda</Label>
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <Input
                value={(estiloBotao[bwKey] as string) || '0px'}
                onChange={(e) => updateEstilo(bwKey, e.target.value)}
                placeholder="0px"
                className="text-xs"
                title="Espessura"
              />
            </div>
            <div>
              <Select value={(estiloBotao[bsKey] as string) || 'solid'} onValueChange={(v) => updateEstilo(bsKey, v)}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólida</SelectItem>
                  <SelectItem value="dashed">Tracejada</SelectItem>
                  <SelectItem value="dotted">Pontilhada</SelectItem>
                  <SelectItem value="none">Nenhuma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={(estiloBotao[bcKey] as string) || '#000000'}
                onChange={(e) => updateEstilo(bcKey, e.target.value)}
                className="w-7 h-7 rounded border border-input cursor-pointer flex-shrink-0"
              />
            </div>
          </div>
        </div>
        {/* Padding & Margin */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Padding</Label>
            <Input
              value={(estiloBotao[padKey] as string) || ''}
              onChange={(e) => updateEstilo(padKey, e.target.value)}
              placeholder="8px 16px"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Margin</Label>
            <Input
              value={(estiloBotao[marKey] as string) || ''}
              onChange={(e) => updateEstilo(marKey, e.target.value)}
              placeholder="0px"
              className="text-xs"
            />
          </div>
        </div>
      </>
    )
  }

  /** Renders pipeline selector for oportunidade creation */
  const renderPipelineSelector = (funilKey: 'enviar_funil_id' | 'whatsapp_funil_id') => {
    if (funis.length === 0) return (
      <p className="text-[10px] text-muted-foreground">Nenhuma pipeline encontrada</p>
    )
    return (
      <div className="space-y-1">
        <Label className="text-[11px]">Pipeline de destino</Label>
        <Select
          value={(config as any)[funilKey] || 'nenhum'}
          onValueChange={(v) => updateConfig(funilKey as any, v === 'nenhum' ? '' : v)}
        >
          <SelectTrigger className="text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhum">Selecione a pipeline...</SelectItem>
            {funis.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">Será criado na primeira etapa (Novos Negócios)</p>
      </div>
    )
  }

  /** Renders SMTP info when email notification is enabled */
  const renderSmtpInfo = () => {
    if (!smtpInfo) return (
      <p className="text-[10px] text-amber-600">⚠ Nenhum e-mail SMTP configurado. Configure em Configurações → Conexões.</p>
    )
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Mail className="w-3 h-3" />
        <span>Enviando via: <strong>{smtpInfo.email}</strong></span>
      </div>
    )
  }

  /** Renders WAHA WhatsApp info when whatsapp notification is enabled */
  const renderWahaInfo = () => {
    if (!wahaInfo) return (
      <p className="text-[10px] text-amber-600">⚠ Nenhuma conexão WhatsApp ativa. Configure em Configurações → Conexões.</p>
    )
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <MessageCircle className="w-3 h-3" />
        <span>Enviando via: <strong>{wahaInfo.phone_number || wahaInfo.phone_name || 'Conectado'}</strong></span>
      </div>
    )
  }

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
        <button
          type="button"
          className={cn(
            'flex-1 text-xs py-1.5 font-medium transition-colors',
            tab === 'pos_envio' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setTab('pos_envio')}
        >
          Pós-Envio
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
              <div className="space-y-1.5">
                <Label className="text-xs">Largura</Label>
                <Select value={estiloBotao.whatsapp_largura || 'full'} onValueChange={(v) => updateEstilo('whatsapp_largura', v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Largura Total</SelectItem>
                    <SelectItem value="auto">Automática</SelectItem>
                    <SelectItem value="50%">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Altura</Label>
                <Input
                  value={estiloBotao.whatsapp_altura || ''}
                  onChange={(e) => updateEstilo('whatsapp_altura', e.target.value)}
                  placeholder="Ex: 48px (vazio = automático)"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tamanho da Fonte</Label>
                <Input
                  value={estiloBotao.whatsapp_font_size || '14px'}
                  onChange={(e) => updateEstilo('whatsapp_font_size', e.target.value)}
                  placeholder="14px"
                  className="text-xs"
                />
              </div>
              {renderFontFormatting('whatsapp_')}
              {renderBorderAndSpacing('whatsapp_')}
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
                <Label className="text-xs">Altura</Label>
                <Input
                  value={estiloBotao.altura || ''}
                  onChange={(e) => updateEstilo('altura', e.target.value)}
                  placeholder="Ex: 48px (vazio = automático)"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tamanho da Fonte</Label>
                <Input
                  value={estiloBotao.font_size || '14px'}
                  onChange={(e) => updateEstilo('font_size', e.target.value)}
                  placeholder="14px"
                  className="text-xs"
                />
              </div>
              {renderFontFormatting('')}
              {renderBorderAndSpacing('')}
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
          {(config.tipo_botao === 'enviar' || config.tipo_botao === 'ambos') && (
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
              {config.enviar_cria_oportunidade && renderPipelineSelector('enviar_funil_id')}
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Notificar e-mail</Label>
                <Switch
                  checked={config.enviar_notifica_email}
                  onCheckedChange={(v) => updateConfig('enviar_notifica_email', v)}
                />
              </div>
              {config.enviar_notifica_email && (
                <>
                  <Input
                    value={config.enviar_email_destino}
                    onChange={(e) => updateConfig('enviar_email_destino', e.target.value)}
                    placeholder="email@empresa.com"
                    className="text-xs"
                    type="email"
                  />
               {renderSmtpInfo()}
                </>
              )}
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Notificar WhatsApp</Label>
                <Switch
                  checked={config.enviar_notifica_whatsapp}
                  onCheckedChange={(v) => updateConfig('enviar_notifica_whatsapp', v)}
                />
              </div>
              {config.enviar_notifica_whatsapp && (
                <>
                  <Input
                    value={config.enviar_whatsapp_destino}
                    onChange={(e) => updateConfig('enviar_whatsapp_destino', e.target.value)}
                    placeholder="5511999999999"
                    className="text-xs"
                  />
                  {renderWahaInfo()}
                </>
              )}
            </div>
          )}

          {/* WhatsApp config */}
          {(config.tipo_botao === 'whatsapp' || config.tipo_botao === 'ambos') && (
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
              {config.whatsapp_cria_oportunidade && renderPipelineSelector('whatsapp_funil_id')}
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Notificar e-mail</Label>
                <Switch
                  checked={config.whatsapp_notifica_email}
                  onCheckedChange={(v) => updateConfig('whatsapp_notifica_email', v)}
                />
              </div>
              {config.whatsapp_notifica_email && (
                <>
                  <Input
                    value={config.whatsapp_email_destino}
                    onChange={(e) => updateConfig('whatsapp_email_destino', e.target.value)}
                    placeholder="email@empresa.com"
                    className="text-xs"
                    type="email"
                  />
                  {renderSmtpInfo()}
                </>
              )}
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Notificar WhatsApp</Label>
                <Switch
                  checked={config.whatsapp_notifica_whatsapp}
                  onCheckedChange={(v) => updateConfig('whatsapp_notifica_whatsapp', v)}
                />
              </div>
              {config.whatsapp_notifica_whatsapp && (
                <>
                  <Input
                    value={config.whatsapp_whatsapp_destino}
                    onChange={(e) => updateConfig('whatsapp_whatsapp_destino', e.target.value)}
                    placeholder="5511999999999"
                    className="text-xs"
                  />
                  {renderWahaInfo()}
                </>
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

        </div>
      )}

      {/* Pós-Envio tab */}
      {tab === 'pos_envio' && loaded && (
        <div className="space-y-3">
          {isWhatsApp && (
            <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded">
              ℹ O botão WhatsApp redireciona automaticamente para o WhatsApp com os campos formatados. As configurações abaixo se aplicam apenas ao botão <strong>Enviar</strong>.
            </p>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Mensagem de Sucesso</Label>
            <Textarea
              value={posEnvio.mensagem_sucesso}
              onChange={(e) => updatePosEnvio('mensagem_sucesso', e.target.value)}
              placeholder="Formulário enviado com sucesso!"
              className="text-xs"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Mensagem de Erro</Label>
            <Textarea
              value={posEnvio.mensagem_erro}
              onChange={(e) => updatePosEnvio('mensagem_erro', e.target.value)}
              placeholder="Ocorreu um erro ao enviar."
              className="text-xs"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Ação após envio bem-sucedido</Label>
            <Select value={posEnvio.tipo_acao_sucesso} onValueChange={(v) => updatePosEnvio('tipo_acao_sucesso', v)}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensagem">Mostrar mensagem</SelectItem>
                <SelectItem value="redirecionar">Redirecionar para URL</SelectItem>
                <SelectItem value="ambos">Mensagem + Redirecionar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(posEnvio.tipo_acao_sucesso === 'redirecionar' || posEnvio.tipo_acao_sucesso === 'ambos') && (
            <div className="space-y-1.5">
              <Label className="text-xs">URL de Redirecionamento</Label>
              <Input
                value={posEnvio.url_redirecionamento}
                onChange={(e) => updatePosEnvio('url_redirecionamento', e.target.value)}
                placeholder="https://seusite.com/obrigado"
                className="text-xs"
                type="url"
              />
            </div>
          )}

          {posEnvio.tipo_acao_sucesso === 'ambos' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Tempo antes de redirecionar (s)</Label>
              <Input
                value={posEnvio.tempo_redirecionamento}
                onChange={(e) => updatePosEnvio('tempo_redirecionamento', Number(e.target.value) || 3)}
                className="text-xs"
                type="number"
                min={1}
                max={30}
              />
            </div>
          )}

        </div>
      )}
    </div>
  )
}
