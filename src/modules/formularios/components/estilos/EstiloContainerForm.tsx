/**
 * AIDEV-NOTE: Formulário de configuração visual do container
 * Cor de fundo, border-radius, padding, sombra, max-width, font
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EstiloContainer } from '../../services/formularios.api'

const SOMBRAS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'sm', label: 'Suave' },
  { value: 'md', label: 'Média' },
  { value: 'lg', label: 'Grande' },
  { value: 'xl', label: 'Extra Grande' },
]

const FONTES = [
  { value: 'Inter', label: 'Inter' },
  { value: 'system-ui', label: 'Sistema' },
  { value: 'Georgia', label: 'Georgia (Serif)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
]

interface Props {
  value: EstiloContainer
  onChange: (v: EstiloContainer) => void
}

export function EstiloContainerForm({ value, onChange }: Props) {
  const update = (key: keyof EstiloContainer, val: string) => {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-4">

      <div className="space-y-3">
      <div className="space-y-1.5">
          <Label className="text-xs">Cor de Fundo</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.background_color === 'transparent' ? '#FFFFFF' : (value.background_color || '#FFFFFF')}
              onChange={(e) => update('background_color', e.target.value)}
              className="w-8 h-8 rounded border border-input cursor-pointer"
              disabled={value.background_color === 'transparent'}
            />
            <Input
              value={value.background_color || '#FFFFFF'}
              onChange={(e) => update('background_color', e.target.value)}
              placeholder="#FFFFFF ou transparent"
              className="flex-1 text-xs"
            />
            <Button
              type="button"
              variant={value.background_color === 'transparent' ? 'default' : 'outline'}
              size="sm"
              className="text-xs px-2 h-8 shrink-0"
              onClick={() => update('background_color', value.background_color === 'transparent' ? '#FFFFFF' : 'transparent')}
            >
              Transparente
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Largura Máxima</Label>
          <Input
            value={value.max_width || '600px'}
            onChange={(e) => update('max_width', e.target.value)}
            placeholder="600px"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Padding</Label>
          <Input
            value={value.padding || '24px'}
            onChange={(e) => update('padding', e.target.value)}
            placeholder="24px"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Borda Arredondada</Label>
          <Input
            value={value.border_radius || '8px'}
            onChange={(e) => update('border_radius', e.target.value)}
            placeholder="8px"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Sombra</Label>
          <Select value={value.sombra || 'md'} onValueChange={(v) => update('sombra', v)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOMBRAS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Fonte</Label>
          <Select value={value.font_family || 'Inter'} onValueChange={(v) => update('font_family', v)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTES.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
