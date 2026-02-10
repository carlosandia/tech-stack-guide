/**
 * AIDEV-NOTE: Formulário de configuração do Popup
 * Gatilho, atraso, scroll, overlay, animação, posição
 * + Ações avançadas de marketing: frequência, segmentação, agendamento
 */

import { useState, useEffect } from 'react'
import { Loader2, Clock, Target, Calendar, X as XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useConfigPopup, useSalvarConfigPopup } from '../../hooks/useFormularioConfig'
import type { ConfigPopup } from '../../services/formularios.api'
import { PopupLayoutSelector, type PopupTemplate } from './PopupLayoutSelector'

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

const FREQUENCIAS = [
  { value: 'sempre', label: 'Sempre' },
  { value: 'uma_vez', label: 'Uma vez por visitante' },
  { value: 'uma_vez_por_dia', label: 'Uma vez por dia' },
  { value: 'uma_vez_por_semana', label: 'Uma vez por semana' },
  { value: 'personalizado', label: 'Personalizado (max exibições)' },
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
    popup_imagem_url: null,
    popup_imagem_link: null,
    popup_imagem_posicao: 'so_campos',
    // Avançado
    frequencia_exibicao: 'uma_vez',
    max_exibicoes: null,
    paginas_alvo: [],
    paginas_excluidas: [],
    utm_filtro: null,
    mostrar_botao_fechar: true,
    delay_botao_fechar: 0,
    ativo_a_partir_de: null,
    ativo_ate: null,
  })

  // Local state for textarea-based arrays
  const [paginasAlvoText, setPaginasAlvoText] = useState('')
  const [paginasExcluidasText, setPaginasExcluidasText] = useState('')
  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')

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
        popup_imagem_url: config.popup_imagem_url || null,
        popup_imagem_link: (config as any).popup_imagem_link || null,
        popup_imagem_posicao: config.popup_imagem_posicao || 'so_campos',
        frequencia_exibicao: config.frequencia_exibicao || 'uma_vez',
        max_exibicoes: config.max_exibicoes ?? null,
        paginas_alvo: config.paginas_alvo || [],
        paginas_excluidas: config.paginas_excluidas || [],
        utm_filtro: config.utm_filtro || null,
        mostrar_botao_fechar: config.mostrar_botao_fechar ?? true,
        delay_botao_fechar: config.delay_botao_fechar ?? 0,
        ativo_a_partir_de: config.ativo_a_partir_de || null,
        ativo_ate: config.ativo_ate || null,
      })
      setPaginasAlvoText((config.paginas_alvo || []).join('\n'))
      setPaginasExcluidasText((config.paginas_excluidas || []).join('\n'))
      const utm = config.utm_filtro as Record<string, string> | null
      setUtmSource(utm?.utm_source || '')
      setUtmMedium(utm?.utm_medium || '')
      setUtmCampaign(utm?.utm_campaign || '')
    }
  }, [config])

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  const update = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }))

  const handleSave = () => {
    const paginasAlvo = paginasAlvoText.split('\n').map(s => s.trim()).filter(Boolean)
    const paginasExcluidas = paginasExcluidasText.split('\n').map(s => s.trim()).filter(Boolean)
    const utmFiltro = (utmSource || utmMedium || utmCampaign)
      ? { utm_source: utmSource || undefined, utm_medium: utmMedium || undefined, utm_campaign: utmCampaign || undefined }
      : null

    salvar.mutate({
      ...form,
      paginas_alvo: paginasAlvo,
      paginas_excluidas: paginasExcluidas,
      utm_filtro: utmFiltro as any,
    })
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-foreground">Configuração do Popup</h4>

      {/* Layout selector */}
      <PopupLayoutSelector
        formularioId={formularioId}
        template={(form.popup_imagem_posicao as PopupTemplate) || 'so_campos'}
        imagemUrl={form.popup_imagem_url || null}
        imagemLink={(form as any).popup_imagem_link || null}
        onChangeTemplate={(t) => update('popup_imagem_posicao', t)}
        onChangeImagemUrl={(url) => update('popup_imagem_url', url)}
        onChangeImagemLink={(link) => update('popup_imagem_link', link)}
      />

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

      {/* ====== AÇÕES AVANÇADAS DE MARKETING ====== */}

      {/* Frequência de Exibição */}
      <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-foreground">Frequência de Exibição</p>
        </div>

        <div className="space-y-1.5">
          <Select value={form.frequencia_exibicao || 'uma_vez'} onValueChange={(v) => update('frequencia_exibicao', v)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQUENCIAS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {form.frequencia_exibicao === 'personalizado' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Máximo de Exibições</Label>
            <Input
              type="number"
              min={1}
              value={form.max_exibicoes ?? ''}
              onChange={(e) => update('max_exibicoes', e.target.value ? Number(e.target.value) : null)}
              placeholder="Ex: 3"
              className="text-xs"
            />
          </div>
        )}
      </div>

      {/* Botão Fechar */}
      <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
        <div className="flex items-center gap-2">
          <XIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-foreground">Botão Fechar</p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="popup-btn-fechar" className="text-xs cursor-pointer">Mostrar botão de fechar (X)</Label>
          <Switch
            id="popup-btn-fechar"
            checked={form.mostrar_botao_fechar ?? true}
            onCheckedChange={(v) => update('mostrar_botao_fechar', v)}
          />
        </div>

        {form.mostrar_botao_fechar !== false && (
          <div className="space-y-1.5">
            <Label className="text-xs">Delay para exibir botão (segundos)</Label>
            <Input
              type="number"
              min={0}
              value={form.delay_botao_fechar ?? 0}
              onChange={(e) => update('delay_botao_fechar', Number(e.target.value))}
              className="text-xs"
            />
            <p className="text-[10px] text-muted-foreground">0 = imediato. Ideal para forçar leitura antes de permitir fechar.</p>
          </div>
        )}
      </div>

      {/* Segmentação */}
      <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-foreground">Segmentação</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Páginas Alvo (uma URL por linha)</Label>
          <Textarea
            value={paginasAlvoText}
            onChange={(e) => setPaginasAlvoText(e.target.value)}
            rows={3}
            placeholder={"/landing-page\n/produtos\n/precos"}
            className="text-xs"
          />
          <p className="text-[10px] text-muted-foreground">Se vazio, aparece em todas as páginas.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Páginas Excluídas (uma URL por linha)</Label>
          <Textarea
            value={paginasExcluidasText}
            onChange={(e) => setPaginasExcluidasText(e.target.value)}
            rows={2}
            placeholder={"/checkout\n/obrigado"}
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground mt-2">Filtro UTM</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">Source</Label>
              <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="google" className="text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Medium</Label>
              <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="cpc" className="text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Campaign</Label>
              <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="black-friday" className="text-xs" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Se vazio, aparece para todos os visitantes.</p>
        </div>
      </div>

      {/* Agendamento */}
      <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-foreground">Agendamento</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Ativo a partir de</Label>
            <Input
              type="datetime-local"
              value={form.ativo_a_partir_de ? form.ativo_a_partir_de.slice(0, 16) : ''}
              onChange={(e) => update('ativo_a_partir_de', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ativo até</Label>
            <Input
              type="datetime-local"
              value={form.ativo_ate ? form.ativo_ate.slice(0, 16) : ''}
              onChange={(e) => update('ativo_ate', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="text-xs"
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Se vazio, o popup fica sempre ativo (sem restrição de data).</p>
      </div>

      <Button onClick={handleSave} disabled={salvar.isPending} className="w-full" size="sm">
        {salvar.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Popup'}
      </Button>
    </div>
  )
}
