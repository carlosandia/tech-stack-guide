/**
 * AIDEV-NOTE: Configurações gerais do formulário (nome, descrição, status, slug)
 * Exibido na aba "Geral" do EditorTabsConfig para todos os tipos
 */

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAtualizarFormulario } from '../../hooks/useFormularios'
import { StatusFormularioOptions } from '../../schemas/formulario.schema'
import type { Formulario } from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200)
}

export function ConfigGeralForm({ formulario }: Props) {
  const atualizar = useAtualizarFormulario()
  const [slugValue, setSlugValue] = useState(formulario.slug)
  const [slugDirty, setSlugDirty] = useState(false)

  const handleUpdate = (field: string, value: string) => {
    atualizar.mutate({ id: formulario.id, payload: { [field]: value } as any })
  }

  const handleSlugChange = (raw: string) => {
    const sanitized = sanitizeSlug(raw)
    setSlugValue(sanitized)
    setSlugDirty(sanitized !== formulario.slug)
  }

  const handleSlugBlur = () => {
    if (slugDirty && slugValue && slugValue !== formulario.slug) {
      handleUpdate('slug', slugValue)
      setSlugDirty(false)
    }
  }

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-card">
      <h4 className="text-sm font-semibold text-foreground">Informações Gerais</h4>

      <div className="space-y-1.5">
        <Label className="text-xs">Nome do Formulário</Label>
        <Input
          defaultValue={formulario.nome}
          onBlur={(e) => handleUpdate('nome', e.target.value)}
          className="text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Descrição</Label>
        <Textarea
          defaultValue={formulario.descricao || ''}
          onBlur={(e) => handleUpdate('descricao', e.target.value)}
          rows={3}
          className="text-xs"
          placeholder="Descreva o objetivo deste formulário..."
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Slug (URL)</Label>
        <Input
          value={slugValue}
          onChange={(e) => handleSlugChange(e.target.value)}
          onBlur={handleSlugBlur}
          className="text-xs font-mono"
          placeholder="meu-formulario"
        />
        {slugDirty && (
          <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Alterar o slug invalidará scripts embed e links existentes.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select
          defaultValue={formulario.status}
          onValueChange={(v) => handleUpdate('status', v)}
        >
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {StatusFormularioOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
