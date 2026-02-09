/**
 * AIDEV-NOTE: Configuração de etapas para formulários multi-step
 * CRUD de etapas com título, descrição, botões de navegação
 */

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useEtapasFormulario,
  useCriarEtapa,
  useAtualizarEtapa,
  useExcluirEtapa,
} from '../../hooks/useFormularioConfig'
import type { EtapaFormulario } from '../../services/formularios.api'

interface Props {
  formularioId: string
}

export function ConfigEtapasForm({ formularioId }: Props) {
  const { data: etapas = [], isLoading } = useEtapasFormulario(formularioId)
  const criar = useCriarEtapa(formularioId)
  const atualizar = useAtualizarEtapa(formularioId)
  const excluir = useExcluirEtapa(formularioId)

  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAddEtapa = () => {
    criar.mutate({
      indice_etapa: etapas.length + 1,
      titulo_etapa: `Etapa ${etapas.length + 1}`,
      texto_botao_proximo: 'Próximo',
      texto_botao_anterior: 'Anterior',
      validar_antes_avancar: true,
    })
  }

  const handleUpdate = (etapaId: string, field: string, value: unknown) => {
    atualizar.mutate({ etapaId, payload: { [field]: value } as Partial<EtapaFormulario> })
  }

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Etapas do Formulário</h4>
        <Button variant="outline" size="sm" onClick={handleAddEtapa} disabled={criar.isPending}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Adicionar Etapa
        </Button>
      </div>

      {etapas.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma etapa configurada. Adicione etapas para criar um formulário multi-step.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {etapas.map((etapa) => (
            <EtapaCard
              key={etapa.id}
              etapa={etapa}
              isEditing={editingId === etapa.id}
              onToggleEdit={() => setEditingId(editingId === etapa.id ? null : etapa.id)}
              onUpdate={(field, value) => handleUpdate(etapa.id, field, value)}
              onRemove={() => excluir.mutate(etapa.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EtapaCard({
  etapa,
  isEditing,
  onToggleEdit,
  onUpdate,
  onRemove,
}: {
  etapa: EtapaFormulario
  isEditing: boolean
  onToggleEdit: () => void
  onUpdate: (field: string, value: unknown) => void
  onRemove: () => void
}) {
  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggleEdit}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
          {etapa.indice_etapa}
        </span>
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {etapa.titulo_etapa || `Etapa ${etapa.indice_etapa}`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Expandable content */}
      {isEditing && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border">
          <div className="space-y-1.5">
            <Label className="text-xs">Título da Etapa</Label>
            <Input
              defaultValue={etapa.titulo_etapa || ''}
              onBlur={(e) => onUpdate('titulo_etapa', e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Textarea
              defaultValue={etapa.descricao_etapa || ''}
              onBlur={(e) => onUpdate('descricao_etapa', e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Botão "Próximo"</Label>
              <Input
                defaultValue={etapa.texto_botao_proximo || 'Próximo'}
                onBlur={(e) => onUpdate('texto_botao_proximo', e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Botão "Anterior"</Label>
              <Input
                defaultValue={etapa.texto_botao_anterior || 'Anterior'}
                onBlur={(e) => onUpdate('texto_botao_anterior', e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`validar-${etapa.id}`}
              defaultChecked={etapa.validar_antes_avancar}
              onChange={(e) => onUpdate('validar_antes_avancar', e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor={`validar-${etapa.id}`} className="text-xs cursor-pointer">
              Validar campos antes de avançar
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}
