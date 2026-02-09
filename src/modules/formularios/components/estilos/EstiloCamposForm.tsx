/**
 * AIDEV-NOTE: Formulário de configuração visual dos campos
 * Cores de label, input, placeholder, borda, erro
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

export function EstiloCamposForm({ value, onChange }: Props) {
  const update = (key: keyof EstiloCampos, val: string) => {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-foreground">Campos</h4>

      <div className="space-y-3">
        <ColorField
          label="Cor do Label"
          value={value.label_cor || '#374151'}
          onChange={(v) => update('label_cor', v)}
        />

        <div className="space-y-1.5">
          <Label className="text-xs">Tamanho do Label</Label>
          <Input
            value={value.label_tamanho || '14px'}
            onChange={(e) => update('label_tamanho', e.target.value)}
            placeholder="14px"
            className="text-xs"
          />
        </div>

        <ColorField
          label="Fundo do Input"
          value={value.input_background || '#F9FAFB'}
          onChange={(v) => update('input_background', v)}
        />

        <ColorField
          label="Borda do Input"
          value={value.input_border_color || '#D1D5DB'}
          onChange={(v) => update('input_border_color', v)}
        />

        <div className="space-y-1.5">
          <Label className="text-xs">Borda Arredondada</Label>
          <Input
            value={value.input_border_radius || '6px'}
            onChange={(e) => update('input_border_radius', e.target.value)}
            placeholder="6px"
            className="text-xs"
          />
        </div>

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

        <ColorField
          label="Cor de Erro"
          value={value.erro_cor || '#EF4444'}
          onChange={(v) => update('erro_cor', v)}
        />
      </div>
    </div>
  )
}
