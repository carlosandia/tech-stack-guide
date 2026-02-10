/**
 * AIDEV-NOTE: Formulário de configuração visual dos campos
 * Organizado em seções: Labels, Inputs, Borda, Cores, Espaçamento
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { EstiloCampos } from '../../services/formularios.api'

interface Props {
  value: EstiloCampos
  onChange: (v: EstiloCampos) => void
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-input cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs"
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

export function EstiloCamposForm({ value, onChange }: Props) {
  const update = (key: keyof EstiloCampos, val: string) => {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">

        {/* Label */}
        <SectionLabel>Label</SectionLabel>
        <ColorField
          label="Cor"
          value={value.label_cor || '#374151'}
          onChange={(v) => update('label_cor', v)}
        />
        <div className="space-y-1.5">
          <Label className="text-xs">Tamanho</Label>
          <Input
            value={value.label_tamanho || '14px'}
            onChange={(e) => update('label_tamanho', e.target.value)}
            placeholder="14px"
            className="text-xs"
          />
        </div>

        {/* Input */}
        <SectionLabel>Input</SectionLabel>
        <ColorField
          label="Fundo"
          value={value.input_background || '#F9FAFB'}
          onChange={(v) => update('input_background', v)}
        />
        <ColorField
          label="Cor do Texto"
          value={value.input_texto_cor || '#1F2937'}
          onChange={(v) => update('input_texto_cor', v)}
        />
        <ColorField
          label="Cor do Placeholder"
          value={value.input_placeholder_cor || '#9CA3AF'}
          onChange={(v) => update('input_placeholder_cor', v)}
        />

        {/* Borda */}
        <SectionLabel>Borda do Input</SectionLabel>
        <ColorField
          label="Cor"
          value={value.input_border_color || '#D1D5DB'}
          onChange={(v) => update('input_border_color', v)}
        />
        <div className="space-y-1.5">
          <Label className="text-xs">Espessura</Label>
          <Input
            value={value.input_border_width || '1'}
            onChange={(e) => update('input_border_width', e.target.value)}
            placeholder="1"
            className="text-xs"
          />
          <p className="text-[10px] text-muted-foreground">Valor em px (ex: 0, 1, 2)</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Arredondamento</Label>
          <Input
            value={value.input_border_radius || '6px'}
            onChange={(e) => update('input_border_radius', e.target.value)}
            placeholder="6px"
            className="text-xs"
          />
        </div>

        {/* Outros */}
        <SectionLabel>Outros</SectionLabel>
        <ColorField
          label="Cor de Erro"
          value={value.erro_cor || '#EF4444'}
          onChange={(v) => update('erro_cor', v)}
        />
        <div className="space-y-1.5">
          <Label className="text-xs">Espaçamento entre Campos</Label>
          <Input
            value={value.gap || '12px'}
            onChange={(e) => update('gap', e.target.value)}
            placeholder="12px"
            className="text-xs"
          />
          <p className="text-[10px] text-muted-foreground">Distância vertical entre campos (ex: 8px, 12px, 16px, 24px)</p>
        </div>
      </div>
    </div>
  )
}
