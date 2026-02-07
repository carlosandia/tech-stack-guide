/**
 * AIDEV-NOTE: Modal para criar/editar etapa do funil
 * Conforme PRD-07 RF-04
 */

import { useState } from 'react'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'
import { Layers } from 'lucide-react'
import type { EtapaFunil } from '../../services/pipeline-config.api'

interface Props {
  etapa: EtapaFunil | null
  onClose: () => void
  onSave: (payload: { nome: string; cor: string; probabilidade: number }) => Promise<void>
  loading: boolean
}

const CORES = [
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#EF4444', '#F97316', '#F59E0B', '#22C55E',
  '#14B8A6', '#06B6D4', '#6B7280', '#1F2937',
]

export function EtapaFormModal({ etapa, onClose, onSave, loading }: Props) {
  const [nome, setNome] = useState(etapa?.nome || '')
  const [cor, setCor] = useState(etapa?.cor || '#3B82F6')
  const [probabilidade, setProbabilidade] = useState(etapa?.probabilidade ?? 50)

  const isEdit = !!etapa

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    await onSave({ nome: nome.trim(), cor, probabilidade })
  }

  return (
    <ModalBase
      onClose={onClose}
      title={isEdit ? 'Editar Etapa' : 'Nova Etapa'}
      description={isEdit ? 'Atualize as configurações da etapa' : 'Defina nome, cor e probabilidade'}
      icon={Layers}
      variant={isEdit ? 'edit' : 'create'}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:bg-accent rounded-md transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!nome.trim() || loading}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Etapa'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
        {/* Nome */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nome da Etapa *</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Qualificação, Proposta, Negociação..."
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
            required
          />
        </div>

        {/* Cor */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Cor</label>
          <div className="flex flex-wrap gap-2">
            {CORES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                className={`w-8 h-8 rounded-md border-2 transition-all duration-200 ${
                  cor === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Probabilidade */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Probabilidade de Conversão
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={probabilidade}
              onChange={e => setProbabilidade(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-sm font-medium text-foreground w-10 text-right">
              {probabilidade}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Usado para calcular o forecast do funil
          </p>
        </div>
      </form>
    </ModalBase>
  )
}
