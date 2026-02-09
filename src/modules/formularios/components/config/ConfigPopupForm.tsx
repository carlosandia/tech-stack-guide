/**
 * AIDEV-NOTE: Formulário de configuração do Popup
 * Gatilho, atraso, scroll, overlay, animação, posição
 */

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useConfigPopup, useSalvarConfigPopup } from '../../hooks/useFormularioConfig'
import type { ConfigPopup } from '../../services/formularios.api'

const GATILHOS = [
  { value: 'intencao_saida', label: 'Intenção de saída' },
  { value: 'tempo', label: 'Tempo na página' },
  { value: 'scroll', label: 'Porcentagem de scroll' },
  { value: 'clique', label: 'Clique em elemento' },
]

const ANIMACOES = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide_up', label: 'Slide de baixo' },
  { value: 'slide_down', label: 'Slide de cima' },
  { value: 'scale', label: 'Scale' },
  { value: 'none', label: 'Nenhuma' },
]

const POSICOES = [
  { value: 'centro', label: 'Centro' },
  { value: 'topo', label: 'Topo' },
  { value: 'inferior_direito', label: 'Inferior Direito' },
  { value: 'inferior_esquerdo', label: 'Inferior Esquerdo' },
  { value: 'lateral_direita', label: 'Lateral Direita' },
]

interface Props {
  formularioId: string
}

export function ConfigPopupForm({ formularioId }: Props) {
  const { data: config, isLoading } = useConfigPopup(formularioId)
  const salvar = useSalvarConfigPopup(formularioId)

  const [form, setForm] = useState<Partial<ConfigPopup>>({
    tipo_gatilho: 'intencao_saida',
    atraso_segundos: 0,
    porcentagem_scroll: 50,
    seletor_elemento_clique: '',
    mostrar_uma_vez_sessao: true,
    dias_expiracao_cookie: 30,
    mostrar_mobile: true,
    cor_fundo_overlay: 'rgba(0, 0, 0, 0.5)',
    clique_overlay_fecha: true,
    tipo_animacao: 'fade',
    duracao_animacao_ms: 300,
    posicao: 'centro',
  })

  useEffect(() => {
    if (config) {
      setForm({
        tipo_gatilho: config.tipo_gatilho,
        atraso_segundos: config.atraso_segundos,
        porcentagem_scroll: config.porcentagem_scroll,
        seletor_elemento_clique: config.seletor_elemento_clique || '',
        mostrar_uma_vez_sessao: config.mostrar_uma_vez_sessao,
        dias_expiracao_cookie: config.dias_expiracao_cookie,
        mostrar_mobile: config.mostrar_mobile,
        cor_fundo_overlay: config.cor_fundo_overlay,
        clique_overlay_fecha: config.clique_overlay_fecha,
        tipo_animacao: config.tipo_animacao,
        duracao_animacao_ms: config.duracao_animacao_ms,
        posicao: config.posicao,
      })
    }
  }, [config])

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  const update = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-foreground">Configuração do Popup</h4>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de Gatilho</Label>
          <Select value={form.tipo_gatilho} onValueChange={(v) => update('tipo_gatilho', v)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GATILHOS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {form.tipo_gatilho === 'tempo' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Atraso (segundos)</Label>
            <Input type="number" value={form.atraso_segundos} onChange={(e) => update('atraso_segundos', Number(e.target.value))} className="text-xs" />
          </div>
        )}

        {form.tipo_gatilho === 'scroll' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Porcentagem de Scroll (%)</Label>
            <Input type="number" min={0} max={100} value={form.porcentagem_scroll} onChange={(e) => update('porcentagem_scroll', Number(e.target.value))} className="text-xs" />
          </div>
        )}

        {form.tipo_gatilho === 'clique' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Seletor CSS do Elemento</Label>
            <Input value={form.seletor_elemento_clique || ''} onChange={(e) => update('seletor_elemento_clique', e.target.value)} placeholder="#meu-botao" className="text-xs" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Posição</Label>
          <Select value={form.posicao} onValueChange={(v) => update('posicao', v)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {POSICOES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Animação</Label>
          <Select value={form.tipo_animacao} onValueChange={(v) => update('tipo_animacao', v)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ANIMACOES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Duração da Animação (ms)</Label>
          <Input type="number" value={form.duracao_animacao_ms} onChange={(e) => update('duracao_animacao_ms', Number(e.target.value))} className="text-xs" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Cor do Overlay</Label>
          <Input value={form.cor_fundo_overlay || ''} onChange={(e) => update('cor_fundo_overlay', e.target.value)} placeholder="rgba(0,0,0,0.5)" className="text-xs" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Expiração do Cookie (dias)</Label>
          <Input type="number" value={form.dias_expiracao_cookie} onChange={(e) => update('dias_expiracao_cookie', Number(e.target.value))} className="text-xs" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="popup-uma-vez" checked={form.mostrar_uma_vez_sessao} onChange={(e) => update('mostrar_uma_vez_sessao', e.target.checked)} className="rounded border-input" />
            <Label htmlFor="popup-uma-vez" className="text-xs cursor-pointer">Mostrar apenas uma vez por sessão</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="popup-mobile" checked={form.mostrar_mobile} onChange={(e) => update('mostrar_mobile', e.target.checked)} className="rounded border-input" />
            <Label htmlFor="popup-mobile" className="text-xs cursor-pointer">Mostrar em dispositivos móveis</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="popup-overlay-fecha" checked={form.clique_overlay_fecha} onChange={(e) => update('clique_overlay_fecha', e.target.checked)} className="rounded border-input" />
            <Label htmlFor="popup-overlay-fecha" className="text-xs cursor-pointer">Clicar no overlay fecha o popup</Label>
          </div>
        </div>
      </div>

      <Button onClick={() => salvar.mutate(form)} disabled={salvar.isPending} className="w-full" size="sm">
        {salvar.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Popup'}
      </Button>
    </div>
  )
}
