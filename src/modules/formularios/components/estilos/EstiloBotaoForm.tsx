/**
 * AIDEV-NOTE: Formulário de configuração visual do botão de submit
 * Texto, cores, altura, largura, border-radius, formatação de fonte
 * Labels user-friendly sem termos técnicos
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Bold, Italic, Underline } from 'lucide-react'
import { cn } from '@/lib/utils'
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

interface Props {
  value: EstiloBotao
  onChange: (v: EstiloBotao) => void
}

export function EstiloBotaoForm({ value, onChange }: Props) {
  const update = (key: keyof EstiloBotao, val: string | boolean) => {
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
          <Label className="text-xs">Cor ao Passar o Mouse</Label>
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

        <div className="grid grid-cols-2 gap-2">
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
            <Label className="text-xs">Altura</Label>
            <Input
              value={value.altura || ''}
              onChange={(e) => update('altura', e.target.value)}
              placeholder="Auto"
              className="text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Tamanho da Fonte</Label>
            <Input
              value={value.font_size || '14px'}
              onChange={(e) => update('font_size', e.target.value)}
              placeholder="14px"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cantos Arredondados</Label>
            <Input
              value={value.border_radius || '6px'}
              onChange={(e) => update('border_radius', e.target.value)}
              placeholder="6px"
              className="text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Estilo do Texto</Label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => update('font_bold', !value.font_bold)}
              className={cn(
                'p-1.5 rounded border transition-colors',
                value.font_bold ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
              )}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => update('font_italic', !value.font_italic)}
              className={cn(
                'p-1.5 rounded border transition-colors',
                value.font_italic ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
              )}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => update('font_underline', !value.font_underline)}
              className={cn(
                'p-1.5 rounded border transition-colors',
                value.font_underline ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
              )}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
