/**
 * AIDEV-NOTE: Configuração de notificações e redirecionamento pós-envio
 * Mensagem de sucesso/erro, redirecionamento para página específica
 */

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface ConfigPosEnvio {
  mensagem_sucesso: string
  mensagem_erro: string
  tipo_acao_sucesso: 'mensagem' | 'redirecionar' | 'ambos'
  url_redirecionamento: string
  tempo_redirecionamento: number
}

const CONFIG_PADRAO: ConfigPosEnvio = {
  mensagem_sucesso: 'Formulário enviado com sucesso! Entraremos em contato em breve.',
  mensagem_erro: 'Ocorreu um erro ao enviar. Tente novamente.',
  tipo_acao_sucesso: 'mensagem',
  url_redirecionamento: '',
  tempo_redirecionamento: 3,
}

interface Props {
  formularioId: string
}

export function ConfigPosEnvioForm({ formularioId }: Props) {
  const [config, setConfig] = useState<ConfigPosEnvio>(CONFIG_PADRAO)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('formularios')
        .select('config_pos_envio')
        .eq('id', formularioId)
        .single()

      if (data?.config_pos_envio && typeof data.config_pos_envio === 'object') {
        setConfig({ ...CONFIG_PADRAO, ...(data.config_pos_envio as Partial<ConfigPosEnvio>) })
      }
      setLoaded(true)
    }
    load()
  }, [formularioId])

  const update = (key: keyof ConfigPosEnvio, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('formularios')
      .update({ config_pos_envio: config as any })
      .eq('id', formularioId)

    setSaving(false)
    if (error) {
      toast.error('Erro ao salvar configuração')
    } else {
      toast.success('Configuração pós-envio salva')
    }
  }

  if (!loaded) return null

  const showRedirect = config.tipo_acao_sucesso === 'redirecionar' || config.tipo_acao_sucesso === 'ambos'
  const showTempo = config.tipo_acao_sucesso === 'ambos'

  return (
    <div className="space-y-5">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <CheckCircle className="w-4 h-4" />
        Pós-Envio
      </h4>

      {/* Mensagem de sucesso */}
      <div className="space-y-1.5">
        <Label className="text-xs">Mensagem de Sucesso</Label>
        <Textarea
          value={config.mensagem_sucesso}
          onChange={(e) => update('mensagem_sucesso', e.target.value)}
          placeholder="Formulário enviado com sucesso!"
          className="text-xs"
          rows={2}
        />
      </div>

      {/* Mensagem de erro */}
      <div className="space-y-1.5">
        <Label className="text-xs">Mensagem de Erro</Label>
        <Textarea
          value={config.mensagem_erro}
          onChange={(e) => update('mensagem_erro', e.target.value)}
          placeholder="Ocorreu um erro ao enviar."
          className="text-xs"
          rows={2}
        />
      </div>

      {/* Ação após envio */}
      <div className="space-y-1.5">
        <Label className="text-xs">Ação após envio bem-sucedido</Label>
        <Select value={config.tipo_acao_sucesso} onValueChange={(v) => update('tipo_acao_sucesso', v)}>
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensagem">Mostrar mensagem</SelectItem>
            <SelectItem value="redirecionar">Redirecionar para URL</SelectItem>
            <SelectItem value="ambos">Mensagem + Redirecionar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* URL de redirecionamento */}
      {showRedirect && (
        <div className="space-y-1.5">
          <Label className="text-xs">URL de Redirecionamento</Label>
          <Input
            value={config.url_redirecionamento}
            onChange={(e) => update('url_redirecionamento', e.target.value)}
            placeholder="https://seusite.com/obrigado"
            className="text-xs"
            type="url"
          />
        </div>
      )}

      {/* Tempo antes de redirecionar */}
      {showTempo && (
        <div className="space-y-1.5">
          <Label className="text-xs">Tempo antes de redirecionar (segundos)</Label>
          <Input
            value={config.tempo_redirecionamento}
            onChange={(e) => update('tempo_redirecionamento', Number(e.target.value) || 3)}
            className="text-xs"
            type="number"
            min={1}
            max={30}
          />
        </div>
      )}

      <Button size="sm" className="w-full text-xs" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
        Salvar Configuração Pós-Envio
      </Button>
    </div>
  )
}
