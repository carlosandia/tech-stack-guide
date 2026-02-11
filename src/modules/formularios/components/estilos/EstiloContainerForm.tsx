/**
 * AIDEV-NOTE: Formulário de configuração visual do container
 * Cor de fundo, padding por lado, borda (espessura, cor, raio), sombra, max-width, font
 * Suporta overrides responsivos para padding e max-width
 */

import { useState } from 'react'
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
import { ResponsiveField } from './ResponsiveField'
import type { DeviceType } from './DeviceSwitcher'

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pt-2 border-t border-border">
      {children}
    </p>
  )
}

export function EstiloContainerForm({ value, onChange }: Props) {
  const [device, setDevice] = useState<DeviceType>('desktop')

  const update = (key: keyof EstiloContainer, val: string) => {
    onChange({ ...value, [key]: val })
  }

  const getKey = (base: string): keyof EstiloContainer => {
    if (device === 'desktop') return base as keyof EstiloContainer
    return `${base}_${device}` as keyof EstiloContainer
  }

  const getVal = (base: string, fallback: string): string => {
    if (device === 'desktop') return (value[base as keyof EstiloContainer] as string) || fallback
    const override = value[`${base}_${device}` as keyof EstiloContainer] as string | undefined
    return override || ''
  }

  const getPlaceholder = (base: string, fallback: string): string => {
    if (device === 'desktop') return fallback
    return (value[base as keyof EstiloContainer] as string) || fallback
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">

        {/* Cor de Fundo */}
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
              placeholder="#FFFFFF"
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

        {/* Responsive: Largura Máxima */}
        <ResponsiveField
          label="Largura Máxima"
          device={device}
          onDeviceChange={setDevice}
          desktopValue={value.max_width || '600px'}
          tabletValue={value.max_width_tablet}
          mobileValue={value.max_width_mobile}
        >
          <Input
            value={getVal('max_width', '600px')}
            onChange={(e) => update(getKey('max_width'), e.target.value)}
            placeholder={getPlaceholder('max_width', '600px')}
            className="text-xs"
          />
        </ResponsiveField>

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

        {/* Responsive: Padding */}
        <SectionLabel>Espaçamento Interno (Padding)</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {(['padding_top', 'padding_bottom', 'padding_left', 'padding_right'] as const).map((field) => {
            const labels: Record<string, string> = {
              padding_top: 'Topo',
              padding_bottom: 'Baixo',
              padding_left: 'Esquerda',
              padding_right: 'Direita',
            }
            return (
              <ResponsiveField
                key={field}
                label={labels[field]}
                device={device}
                onDeviceChange={setDevice}
                desktopValue={value[field] || '24'}
                tabletValue={value[`${field}_tablet` as keyof EstiloContainer] as string | undefined}
                mobileValue={value[`${field}_mobile` as keyof EstiloContainer] as string | undefined}
              >
                <Input
                  value={getVal(field, '24')}
                  onChange={(e) => update(getKey(field), e.target.value)}
                  placeholder={getPlaceholder(field, '24')}
                  className="text-xs"
                />
              </ResponsiveField>
            )
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">Valores em px (ex: 0, 10, 24)</p>

        {/* Borda */}
        <SectionLabel>Borda</SectionLabel>
        <div className="space-y-1.5">
          <Label className="text-xs">Espessura</Label>
          <Input
            value={value.border_width || '0'}
            onChange={(e) => update('border_width', e.target.value)}
            placeholder="0"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Cor da Borda</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.border_color || '#D1D5DB'}
              onChange={(e) => update('border_color', e.target.value)}
              className="w-8 h-8 rounded border border-input cursor-pointer"
            />
            <Input
              value={value.border_color || '#D1D5DB'}
              onChange={(e) => update('border_color', e.target.value)}
              className="flex-1 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Arredondamento</Label>
          <Input
            value={value.border_radius || '8px'}
            onChange={(e) => update('border_radius', e.target.value)}
            placeholder="8px"
            className="text-xs"
          />
        </div>

        {/* Sombra */}
        <SectionLabel>Sombra</SectionLabel>
        <div className="space-y-1.5">
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
      </div>
    </div>
  )
}
