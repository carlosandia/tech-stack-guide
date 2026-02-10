/**
 * AIDEV-NOTE: Configuração avançada de etapas para formulários multi-step
 * Inclui config global (progresso, navegação, marketing) + CRUD de etapas
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, GripVertical, Loader2, ChevronDown, BarChart3, Hash, Circle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  useEtapasFormulario,
  useCriarEtapa,
  useAtualizarEtapa,
  useExcluirEtapa,
} from '../../hooks/useFormularioConfig'
import { useFormulario, useAtualizarFormulario } from '../../hooks/useFormularios'
import { useCamposFormulario } from '../../hooks/useFormularioCampos'
import type { EtapaFormulario, MultiStepConfig } from '../../services/formularios.api'

interface Props {
  formularioId: string
}

const PROGRESS_TYPES = [
  { value: 'barra', label: 'Barra', icon: BarChart3 },
  { value: 'numeros', label: 'Números', icon: Hash },
  { value: 'dots', label: 'Dots', icon: Circle },
  { value: 'icones', label: 'Ícones', icon: Sparkles },
] as const

export function ConfigEtapasForm({ formularioId }: Props) {
  const { data: etapas = [], isLoading } = useEtapasFormulario(formularioId)
  const { data: formulario } = useFormulario(formularioId)
  const { data: campos = [] } = useCamposFormulario(formularioId)
  const criar = useCriarEtapa(formularioId)
  const atualizar = useAtualizarEtapa(formularioId)
  const excluir = useExcluirEtapa(formularioId)
  const atualizarFormulario = useAtualizarFormulario()

  const [editingId, setEditingId] = useState<string | null>(null)

  const multiStepConfig: MultiStepConfig = (formulario?.multi_step_config as MultiStepConfig) || {}

  const updateGlobalConfig = useCallback(
    (field: keyof MultiStepConfig, value: unknown) => {
      const newConfig = { ...multiStepConfig, [field]: value }
      atualizarFormulario.mutate({ id: formularioId, payload: { multi_step_config: newConfig as any } })
    },
    [multiStepConfig, formularioId, atualizarFormulario]
  )

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
    <div className="space-y-6">
      {/* Config Global do Multi-step */}
      {formulario?.tipo === 'multi_step' && (
        <div className="space-y-4 border border-border rounded-lg p-4 bg-card">
          <h4 className="text-sm font-semibold text-foreground">Configurações Globais</h4>

          {/* Tipo de progresso */}
          <div className="space-y-1.5">
            <Label className="text-xs">Indicador de Progresso</Label>
            <div className="grid grid-cols-4 gap-2">
              {PROGRESS_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateGlobalConfig('tipo_progresso', value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors',
                    multiStepConfig.tipo_progresso === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Navegação */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Permitir voltar</Label>
              <Switch
                checked={multiStepConfig.permitir_voltar ?? true}
                onCheckedChange={(v) => updateGlobalConfig('permitir_voltar', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Permitir pular</Label>
              <Switch
                checked={multiStepConfig.permitir_pular ?? false}
                onCheckedChange={(v) => updateGlobalConfig('permitir_pular', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Validar por etapa</Label>
              <Switch
                checked={multiStepConfig.validar_por_etapa ?? true}
                onCheckedChange={(v) => updateGlobalConfig('validar_por_etapa', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Salvar rascunho</Label>
              <Switch
                checked={multiStepConfig.salvar_rascunho ?? false}
                onCheckedChange={(v) => updateGlobalConfig('salvar_rascunho', v)}
              />
            </div>
          </div>

          {/* Marketing */}
          <div className="border-t border-border pt-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marketing</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Auto-save entre etapas</Label>
                <Switch
                  checked={multiStepConfig.auto_save ?? false}
                  onCheckedChange={(v) => updateGlobalConfig('auto_save', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Lead scoring por etapa</Label>
                <Switch
                  checked={multiStepConfig.lead_scoring_por_etapa ?? false}
                  onCheckedChange={(v) => updateGlobalConfig('lead_scoring_por_etapa', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Trackear abandono</Label>
                <Switch
                  checked={multiStepConfig.trackear_abandono ?? true}
                  onCheckedChange={(v) => updateGlobalConfig('trackear_abandono', v)}
                />
              </div>
            </div>
          </div>

          {/* Texto botão final */}
          <div className="space-y-1.5">
            <Label className="text-xs">Texto do Botão Final</Label>
            <Input
              defaultValue={multiStepConfig.texto_botao_final || 'Enviar'}
              onBlur={(e) => updateGlobalConfig('texto_botao_final', e.target.value)}
              className="text-xs"
              placeholder="Enviar"
            />
          </div>
        </div>
      )}

      {/* Etapas */}
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
            {etapas.map((etapa) => {
              const camposEtapa = campos.filter((c) => c.etapa_numero === etapa.indice_etapa)
              return (
                <EtapaCard
                  key={etapa.id}
                  etapa={etapa}
                  camposCount={camposEtapa.length}
                  camposNomes={camposEtapa.map((c) => c.label).slice(0, 4)}
                  isEditing={editingId === etapa.id}
                  onToggleEdit={() => setEditingId(editingId === etapa.id ? null : etapa.id)}
                  onUpdate={(field, value) => handleUpdate(etapa.id, field, value)}
                  onRemove={() => excluir.mutate(etapa.id)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EtapaCard({
  etapa,
  camposCount,
  camposNomes,
  isEditing,
  onToggleEdit,
  onUpdate,
  onRemove,
}: {
  etapa: EtapaFormulario
  camposCount: number
  camposNomes: string[]
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
        <span className="text-[10px] text-muted-foreground">
          {camposCount} {camposCount === 1 ? 'campo' : 'campos'}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isEditing && "rotate-180")} />
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

          <div className="flex items-center justify-between">
            <Label htmlFor={`validar-${etapa.id}`} className="text-xs cursor-pointer">
              Validar campos antes de avançar
            </Label>
            <Switch
              id={`validar-${etapa.id}`}
              checked={etapa.validar_antes_avancar}
              onCheckedChange={(v) => onUpdate('validar_antes_avancar', v)}
            />
          </div>

          {/* Campos vinculados */}
          {camposNomes.length > 0 && (
            <div className="space-y-1.5 border-t border-border pt-2">
              <Label className="text-xs text-muted-foreground">Campos vinculados</Label>
              <div className="flex flex-wrap gap-1">
                {camposNomes.map((nome, i) => (
                  <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {nome}
                  </span>
                ))}
                {camposCount > 4 && (
                  <span className="text-[10px] text-muted-foreground">+{camposCount - 4}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
