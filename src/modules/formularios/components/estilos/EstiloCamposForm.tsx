/**
 * AIDEV-NOTE: Formulário de configuração visual dos campos/inputs
 * Layout compacto em grid 2 colunas, seguindo padrão do EstiloBotaoForm
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
  const update = (key: keyof EstiloCampos, val: string) => {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-3">

      {/* Label */}
      <SectionLabel>Label</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <ColorField
          label="Cor"
          value={value.label_cor || '#374151'}
          onChange={(v) => update('label_cor', v)}
        />
        <SmallInput
          label="Tamanho"
          value={value.label_tamanho || '14px'}
          onChange={(v) => update('label_tamanho', v)}
          placeholder="14px"
        />
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">Peso</Label>
        <select
          value={value.label_font_weight || '500'}
          onChange={(e) => update('label_font_weight', e.target.value)}
          className="w-full h-7 text-xs px-2 rounded-md border border-input bg-background mt-1"
        >
          <option value="normal">Normal</option>
          <option value="500">Médio</option>
          <option value="600">Semibold</option>
          <option value="700">Bold</option>
        </select>
      </div>

      {/* Cores do Input */}
      <SectionLabel>Cores do Input</SectionLabel>
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
        label="Placeholder"
        value={value.input_placeholder_cor || '#9CA3AF'}
        onChange={(v) => update('input_placeholder_cor', v)}
      />

      {/* Borda */}
      <SectionLabel>Borda do Input</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <SmallInput
          label="Arredondamento"
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
          <Label className="text-[10px] text-muted-foreground">Estilo</Label>
          <select
            value={value.input_border_style || 'solid'}
            onChange={(e) => update('input_border_style', e.target.value)}
            className="w-full h-7 text-xs px-2 rounded-md border border-input bg-background"
          >
            <option value="solid">Sólido</option>
            <option value="dashed">Tracejado</option>
            <option value="dotted">Pontilhado</option>
          </select>
        </div>
        <ColorField
          label="Cor"
          value={value.input_border_color || '#D1D5DB'}
          onChange={(v) => update('input_border_color', v)}
        />
      </div>

      {/* Dimensões */}
      <SectionLabel>Dimensões</SectionLabel>
      <SmallInput
        label="Altura do Input"
        value={value.input_height || '40px'}
        onChange={(v) => update('input_height', v)}
        placeholder="40px"
      />

      {/* Foco */}
      <SectionLabel>Foco</SectionLabel>
      <ColorField
        label="Cor do Ring"
        value={value.input_focus_color || '#3B82F6'}
        onChange={(v) => update('input_focus_color', v)}
      />

      {/* Erro */}
      <SectionLabel>Erro</SectionLabel>
      <ColorField
        label="Cor de Erro"
        value={value.erro_cor || '#EF4444'}
        onChange={(v) => update('erro_cor', v)}
      />

      {/* Espaçamento */}
      <SectionLabel>Espaçamento</SectionLabel>
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
