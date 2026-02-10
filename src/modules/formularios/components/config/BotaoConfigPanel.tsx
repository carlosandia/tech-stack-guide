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
import { Bold, Italic, Underline, Mail, MessageCircle } from 'lucide-react'
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

  /** Color picker row helper */
  const renderColorRow = (label: string, key: keyof EstiloBotao, defaultVal: string) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={(estiloBotao[key] as string) || defaultVal} onChange={(e) => updateEstilo(key, e.target.value)} className="w-7 h-7 rounded border border-input cursor-pointer flex-shrink-0" />
        <Input value={(estiloBotao[key] as string) || defaultVal} onChange={(e) => updateEstilo(key, e.target.value)} className="flex-1 text-xs" />
      </div>
    </div>
  )

  /** Renders compact style controls for Enviar button */
  const renderEstiloEnviar = () => (
    <>
      {/* Texto */}
      <div className="space-y-1">
        <Label className="text-xs">Texto do Botão</Label>
        <Input value={estiloBotao.texto || 'Enviar'} onChange={(e) => updateEstilo('texto', e.target.value)} className="text-xs" />
      </div>

      {/* Cores - 2 colunas */}
      <div className="grid grid-cols-2 gap-2">
        {renderColorRow('Cor de Fundo', 'background_color', '#3B82F6')}
        {renderColorRow('Cor de Hover', 'hover_background', '#2563EB')}
      </div>
      {renderColorRow('Cor do Texto', 'texto_cor', '#FFFFFF')}

      {/* Dimensões - 2 colunas */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Largura</Label>
          <Select value={estiloBotao.largura || 'full'} onValueChange={(v) => updateEstilo('largura', v)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full">100%</SelectItem>
              <SelectItem value="50%">50%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Altura</Label>
          <Input value={estiloBotao.altura || ''} onChange={(e) => updateEstilo('altura', e.target.value)} placeholder="Auto" className="text-xs" />
        </div>
      </div>

      {/* Tipografia */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Tamanho</Label>
          <Input value={estiloBotao.font_size || '14px'} onChange={(e) => updateEstilo('font_size', e.target.value)} className="text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Peso</Label>
          <Select value={(estiloBotao.font_weight as string) || '600'} onValueChange={(v) => updateEstilo('font_weight', v)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="400">Normal</SelectItem>
              <SelectItem value="500">Medium</SelectItem>
              <SelectItem value="600">Semibold</SelectItem>
              <SelectItem value="700">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {[
          { key: 'font_bold' as keyof EstiloBotao, icon: Bold },
          { key: 'font_italic' as keyof EstiloBotao, icon: Italic },
          { key: 'font_underline' as keyof EstiloBotao, icon: Underline },
        ].map(({ key, icon: Icon }) => (
          <button key={key} type="button" onClick={() => updateEstilo(key, !estiloBotao[key])} className={cn('p-1.5 rounded border transition-colors', estiloBotao[key] ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted')}>
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      {/* Borda */}
      <div className="space-y-1.5">
        <Label className="text-xs">Borda</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input value={estiloBotao.border_radius || '6px'} onChange={(e) => updateEstilo('border_radius', e.target.value)} placeholder="Raio" className="text-xs" title="Borda arredondada" />
          <Input value={(estiloBotao.border_width as string) || '0px'} onChange={(e) => updateEstilo('border_width', e.target.value)} placeholder="Espessura" className="text-xs" title="Espessura" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={(estiloBotao.border_style as string) || 'solid'} onValueChange={(v) => updateEstilo('border_style', v)}>
            <SelectTrigger className="text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Sólida</SelectItem>
              <SelectItem value="dashed">Tracejada</SelectItem>
              <SelectItem value="dotted">Pontilhada</SelectItem>
              <SelectItem value="none">Nenhuma</SelectItem>
            </SelectContent>
          </Select>
          <input type="color" value={(estiloBotao.border_color as string) || '#000000'} onChange={(e) => updateEstilo('border_color', e.target.value)} className="w-7 h-7 rounded border border-input cursor-pointer flex-shrink-0" />
        </div>
      </div>

      {/* Espaçamento */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Padding</Label>
          <Input value={(estiloBotao.padding as string) || ''} onChange={(e) => updateEstilo('padding', e.target.value)} placeholder="8px 16px" className="text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Margin</Label>
          <Input value={(estiloBotao.margin as string) || ''} onChange={(e) => updateEstilo('margin', e.target.value)} placeholder="0px" className="text-xs" />
        </div>
      </div>
    </>
  )

  /** Renders compact style controls for WhatsApp button */
  const renderEstiloWhatsApp = () => (
    <>
      {/* Texto */}
      <div className="space-y-1">
        <Label className="text-xs">Texto do Botão</Label>
        <Input value={estiloBotao.whatsapp_texto || 'Enviar via WhatsApp'} onChange={(e) => updateEstilo('whatsapp_texto', e.target.value)} className="text-xs" />
      </div>

      {/* Cores */}
      <div className="grid grid-cols-2 gap-2">
        {renderColorRow('Cor de Fundo', 'whatsapp_background', '#25D366')}
        {renderColorRow('Cor do Texto', 'whatsapp_texto_cor', '#FFFFFF')}
      </div>

      {/* Dimensões */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Largura</Label>
          <Select value={estiloBotao.whatsapp_largura || 'full'} onValueChange={(v) => updateEstilo('whatsapp_largura', v)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full">100%</SelectItem>
              <SelectItem value="50%">50%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Altura</Label>
          <Input value={estiloBotao.whatsapp_altura || ''} onChange={(e) => updateEstilo('whatsapp_altura', e.target.value)} placeholder="Auto" className="text-xs" />
        </div>
      </div>

      {/* Tipografia */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Tamanho</Label>
          <Input value={estiloBotao.whatsapp_font_size || '14px'} onChange={(e) => updateEstilo('whatsapp_font_size', e.target.value)} className="text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Peso</Label>
          <Select value={(estiloBotao.whatsapp_font_weight as string) || '600'} onValueChange={(v) => updateEstilo('whatsapp_font_weight', v)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="400">Normal</SelectItem>
              <SelectItem value="500">Medium</SelectItem>
              <SelectItem value="600">Semibold</SelectItem>
              <SelectItem value="700">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {[
          { key: 'whatsapp_font_bold' as keyof EstiloBotao, icon: Bold },
          { key: 'whatsapp_font_italic' as keyof EstiloBotao, icon: Italic },
          { key: 'whatsapp_font_underline' as keyof EstiloBotao, icon: Underline },
        ].map(({ key, icon: Icon }) => (
          <button key={key} type="button" onClick={() => updateEstilo(key, !estiloBotao[key])} className={cn('p-1.5 rounded border transition-colors', estiloBotao[key] ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted')}>
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      {/* Borda */}
      <div className="space-y-1.5">
        <Label className="text-xs">Borda</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input value={estiloBotao.whatsapp_border_radius || '6px'} onChange={(e) => updateEstilo('whatsapp_border_radius', e.target.value)} placeholder="Raio" className="text-xs" />
          <Input value={(estiloBotao.whatsapp_border_width as string) || '0px'} onChange={(e) => updateEstilo('whatsapp_border_width', e.target.value)} placeholder="Espessura" className="text-xs" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={(estiloBotao.whatsapp_border_style as string) || 'solid'} onValueChange={(v) => updateEstilo('whatsapp_border_style', v)}>
            <SelectTrigger className="text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Sólida</SelectItem>
              <SelectItem value="dashed">Tracejada</SelectItem>
              <SelectItem value="dotted">Pontilhada</SelectItem>
              <SelectItem value="none">Nenhuma</SelectItem>
            </SelectContent>
          </Select>
          <input type="color" value={(estiloBotao.whatsapp_border_color as string) || '#000000'} onChange={(e) => updateEstilo('whatsapp_border_color', e.target.value)} className="w-7 h-7 rounded border border-input cursor-pointer flex-shrink-0" />
        </div>
      </div>

      {/* Espaçamento */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Padding</Label>
          <Input value={(estiloBotao.whatsapp_padding as string) || ''} onChange={(e) => updateEstilo('whatsapp_padding', e.target.value)} placeholder="8px 16px" className="text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Margin</Label>
          <Input value={(estiloBotao.whatsapp_margin as string) || ''} onChange={(e) => updateEstilo('whatsapp_margin', e.target.value)} placeholder="0px" className="text-xs" />
        </div>
      </div>
    </>
  )

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
          {isWhatsApp ? renderEstiloWhatsApp() : renderEstiloEnviar()}
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

          {/* AIDEV-NOTE: Ações globais (criar oportunidade, notificar) aparecem uma única vez */}
          <div className="space-y-2 p-2 rounded border border-border bg-muted/30">
            <p className="text-xs font-medium">Ações ao Submeter</p>
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

          {/* WhatsApp-specific config (número e template) */}
          {(config.tipo_botao === 'whatsapp' || config.tipo_botao === 'ambos') && (
            <div className="space-y-2 p-2 rounded border border-border bg-muted/30">
              <p className="text-xs font-medium flex items-center gap-1.5">
                <WhatsAppIcon size={12} /> Configuração WhatsApp
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
