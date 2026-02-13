/**
 * AIDEV-NOTE: Tab de Compartilhamento do editor
 * Link direto, Embed code, QR Code, edição de slug
 */

import { useState } from 'react'
import { AlertTriangle, Check, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LinkDiretoCard } from '../compartilhar/LinkDiretoCard'
import { EmbedCodeCard } from '../compartilhar/EmbedCodeCard'
import { QRCodeCard } from '../compartilhar/QRCodeCard'
import { SubmissoesList } from '../submissoes/SubmissoesList'
import { useAtualizarFormulario } from '../../hooks/useFormularios'
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

export function EditorTabsCompartilhar({ formulario }: Props) {
  const baseUrl = window.location.origin
  const atualizar = useAtualizarFormulario()
  const [editingSlug, setEditingSlug] = useState(false)
  const [slugValue, setSlugValue] = useState(formulario.slug)

  const handleSaveSlug = () => {
    const sanitized = sanitizeSlug(slugValue)
    if (sanitized && sanitized !== formulario.slug) {
      atualizar.mutate({ id: formulario.id, payload: { slug: sanitized } as any })
    }
    setSlugValue(sanitized || formulario.slug)
    setEditingSlug(false)
  }

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 space-y-6">
      {/* Slug editor */}
      <div className="border border-border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Slug do Formulário</h3>
          {!editingSlug && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setEditingSlug(true)}>
              <Pencil className="w-3 h-3" /> Editar
            </Button>
          )}
        </div>
        {editingSlug ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={slugValue}
                onChange={(e) => setSlugValue(sanitizeSlug(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSlug()}
                className="text-xs font-mono flex-1"
                autoFocus
              />
              <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSaveSlug}>
                <Check className="w-3 h-3" /> Salvar
              </Button>
            </div>
            <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Alterar o slug invalidará scripts embed e links já compartilhados. Atualize-os após a mudança.
            </p>
          </div>
        ) : (
          <p className="text-xs font-mono text-muted-foreground bg-muted rounded-md px-3 py-2">{formulario.slug}</p>
        )}
      </div>

      {/* Compartilhamento */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Compartilhar</h2>
        <div className="space-y-4">
          <LinkDiretoCard slug={formulario.slug} baseUrl={baseUrl} />
          <EmbedCodeCard slug={formulario.slug} baseUrl={baseUrl} />
          <QRCodeCard slug={formulario.slug} baseUrl={baseUrl} />
        </div>
      </div>

      {/* Submissões */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Submissões</h2>
        <SubmissoesList formularioId={formulario.id} />
      </div>
    </div>
  )
}
