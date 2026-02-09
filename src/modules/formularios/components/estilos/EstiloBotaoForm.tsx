/**
 * AIDEV-NOTE: Formulário de configuração visual do botão de submit
 * Texto, cores, tamanho, largura, border-radius
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EstiloBotao } from '../../services/formularios.api'

export interface EstiloBotaoWhatsApp {
  whatsapp_texto?: string
  whatsapp_background?: string
}

const LARGURAS = [
  { value: 'full', label: 'Largura Total' },
  { value: 'auto', label: 'Automática' },
  { value: '50%', label: '50%' },
]

const TAMANHOS = [
  { value: 'sm', label: 'Pequeno' },
  { value: 'md', label: 'Médio' },
  { value: 'lg', label: 'Grande' },
]

interface Props {
  value: EstiloBotao
  onChange: (v: EstiloBotao) => void
}

export function EstiloBotaoForm({ value, onChange }: Props) {
  const update = (key: keyof EstiloBotao, val: string) => {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-foreground">Botão</h4>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Texto do Botão</Label>
          <Input
            value={value.texto || 'Enviar'}
            onChange={(e) => update('texto', e.target.value)}
            placeholder="Enviar"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Cor do Texto</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.texto_cor || '#FFFFFF'}
              onChange={(e) => update('texto_cor', e.target.value)}
              className="w-8 h-8 rounded border border-input cursor-pointer"
            />
            <Input
              value={value.texto_cor || '#FFFFFF'}
              onChange={(e) => update('texto_cor', e.target.value)}
              className="flex-1 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Cor de Fundo</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.background_color || '#3B82F6'}
              onChange={(e) => update('background_color', e.target.value)}
              className="w-8 h-8 rounded border border-input cursor-pointer"
            />
            <Input
              value={value.background_color || '#3B82F6'}
              onChange={(e) => update('background_color', e.target.value)}
              className="flex-1 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Cor de Hover</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.hover_background || '#2563EB'}
              onChange={(e) => update('hover_background', e.target.value)}
              className="w-8 h-8 rounded border border-input cursor-pointer"
            />
            <Input
              value={value.hover_background || '#2563EB'}
              onChange={(e) => update('hover_background', e.target.value)}
              className="flex-1 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Borda Arredondada</Label>
          <Input
            value={value.border_radius || '6px'}
            onChange={(e) => update('border_radius', e.target.value)}
            placeholder="6px"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Largura</Label>
          <Select value={value.largura || 'full'} onValueChange={(v) => update('largura', v)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LARGURAS.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Tamanho</Label>
          <Select value={value.tamanho || 'md'} onValueChange={(v) => update('tamanho', v)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAMANHOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
