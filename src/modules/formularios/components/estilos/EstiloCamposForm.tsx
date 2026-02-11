/**
 * AIDEV-NOTE: Formulário de configuração visual dos campos/inputs
 * Layout compacto em grid 2 colunas, seguindo padrão do EstiloBotaoForm
 * Suporta overrides responsivos para input_height e label_tamanho
 */

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { EstiloCampos } from '../../services/formularios.api'
import { ResponsiveField } from './ResponsiveField'
import type { DeviceType } from './DeviceSwitcher'

interface Props {
  value: EstiloCampos
  onChange: (v: EstiloCampos) => void
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded border border-input cursor-pointer shrink-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-7 text-xs px-2"
        />
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pt-2 border-t border-border">
      {children}
    </p>
  )
}

function SmallInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-7 text-xs px-2"
      />
    </div>
  )
}

export function EstiloCamposForm({ value, onChange }: Props) {
  const [device, setDevice] = useState<DeviceType>('desktop')

  const update = (key: keyof EstiloCampos, val: string) => {
    onChange({ ...value, [key]: val })
  }

  const getKey = (base: string): keyof EstiloCampos => {
    if (device === 'desktop') return base as keyof EstiloCampos
    return `${base}_${device}` as keyof EstiloCampos
  }

  const getVal = (base: string, fallback: string): string => {
    if (device === 'desktop') return (value[base as keyof EstiloCampos] as string) || fallback
    const override = value[`${base}_${device}` as keyof EstiloCampos] as string | undefined
    return override || ''
  }

  const getPlaceholder = (base: string, fallback: string): string => {
    if (device === 'desktop') return fallback
    return (value[base as keyof EstiloCampos] as string) || fallback
  }

  return (
    <div className="space-y-3">

      {/* Título do campo */}
      <SectionLabel>Título do Campo</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <ColorField
          label="Cor do Título"
          value={value.label_cor || '#374151'}
          onChange={(v) => update('label_cor', v)}
        />
        {/* Responsive: Tamanho da Fonte do Label */}
        <ResponsiveField
          label="Tamanho da Fonte"
          device={device}
          onDeviceChange={setDevice}
          desktopValue={value.label_tamanho || '14px'}
          tabletValue={value.label_tamanho_tablet}
          mobileValue={value.label_tamanho_mobile}
        >
          <Input
            value={getVal('label_tamanho', '14px')}
            onChange={(e) => update(getKey('label_tamanho'), e.target.value)}
            placeholder={getPlaceholder('label_tamanho', '14px')}
            className="h-7 text-xs px-2"
          />
        </ResponsiveField>
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">Peso da Fonte</Label>
        <select
          value={value.label_font_weight || '500'}
          onChange={(e) => update('label_font_weight', e.target.value)}
          className="w-full h-7 text-xs px-2 rounded-md border border-input bg-background mt-1"
        >
          <option value="normal">Normal</option>
          <option value="500">Médio</option>
          <option value="600">Semibold</option>
          <option value="700">Negrito</option>
        </select>
      </div>

      {/* Cores do campo de entrada */}
      <SectionLabel>Cores do Campo</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <ColorField
          label="Fundo"
          value={value.input_background || '#F9FAFB'}
          onChange={(v) => update('input_background', v)}
        />
        <ColorField
          label="Texto"
          value={value.input_texto_cor || '#1F2937'}
          onChange={(v) => update('input_texto_cor', v)}
        />
      </div>
      <ColorField
        label="Texto de Exemplo"
        value={value.input_placeholder_cor || '#9CA3AF'}
        onChange={(v) => update('input_placeholder_cor', v)}
      />

      {/* Borda */}
      <SectionLabel>Borda do Campo</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <SmallInput
          label="Cantos"
          value={value.input_border_radius || '6px'}
          onChange={(v) => update('input_border_radius', v)}
          placeholder="6px"
        />
        <SmallInput
          label="Espessura"
          value={value.input_border_width || '1'}
          onChange={(v) => update('input_border_width', v)}
          placeholder="1"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Tipo de Linha</Label>
          <select
            value={value.input_border_style || 'solid'}
            onChange={(e) => update('input_border_style', e.target.value)}
            className="w-full h-7 text-xs px-2 rounded-md border border-input bg-background"
          >
            <option value="solid">Sólida</option>
            <option value="dashed">Tracejada</option>
            <option value="dotted">Pontilhada</option>
          </select>
        </div>
        <ColorField
          label="Cor da Borda"
          value={value.input_border_color || '#D1D5DB'}
          onChange={(v) => update('input_border_color', v)}
        />
      </div>

      {/* Responsive: Tamanho / Altura */}
      <SectionLabel>Tamanho</SectionLabel>
      <ResponsiveField
        label="Altura do Campo"
        device={device}
        onDeviceChange={setDevice}
        desktopValue={value.input_height || '40px'}
        tabletValue={value.input_height_tablet}
        mobileValue={value.input_height_mobile}
      >
        <Input
          value={getVal('input_height', '40px')}
          onChange={(e) => update(getKey('input_height'), e.target.value)}
          placeholder={getPlaceholder('input_height', '40px')}
          className="h-7 text-xs px-2"
        />
      </ResponsiveField>

      {/* Destaque ao clicar */}
      <SectionLabel>Destaque ao Clicar</SectionLabel>
      <ColorField
        label="Cor do Contorno"
        value={value.input_focus_color || '#3B82F6'}
        onChange={(v) => update('input_focus_color', v)}
      />

      {/* Mensagem de erro */}
      <SectionLabel>Mensagem de Erro</SectionLabel>
      <ColorField
        label="Cor do Erro"
        value={value.erro_cor || '#EF4444'}
        onChange={(v) => update('erro_cor', v)}
      />

      {/* Espaçamento */}
      <SectionLabel>Espaçamento entre Campos</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <SmallInput
          label="Topo"
          value={value.gap_top || '12'}
          onChange={(v) => update('gap_top', v)}
          placeholder="12"
        />
        <SmallInput
          label="Baixo"
          value={value.gap_bottom || '0'}
          onChange={(v) => update('gap_bottom', v)}
          placeholder="0"
        />
        <SmallInput
          label="Esquerda"
          value={value.gap_left || '0'}
          onChange={(v) => update('gap_left', v)}
          placeholder="0"
        />
        <SmallInput
          label="Direita"
          value={value.gap_right || '0'}
          onChange={(v) => update('gap_right', v)}
          placeholder="0"
        />
      </div>
      <p className="text-[10px] text-muted-foreground">Valores em px</p>
    </div>
  )
}
