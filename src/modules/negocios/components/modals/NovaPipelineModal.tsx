/**
 * AIDEV-NOTE: Modal para criar nova pipeline
 * Usa ModalBase (size="sm")
 */

import { useState } from 'react'
import { Loader2, Layers } from 'lucide-react'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'

interface NovaPipelineModalProps {
  onClose: () => void
  onSubmit: (data: { nome: string; descricao?: string; cor?: string }) => Promise<void>
  loading: boolean
}

const CORES_PIPELINE = [
  '#3B82F6', '#22C55E', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
]

export function NovaPipelineModal({ onClose, onSubmit, loading }: NovaPipelineModalProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [cor, setCor] = useState('#3B82F6')

  const handleSubmit = async () => {
    if (!nome.trim() || nome.trim().length < 3) return
    await onSubmit({ nome: nome.trim(), descricao: descricao.trim() || undefined, cor })
  }

  return (
    <ModalBase
      onClose={onClose}
      title="Nova Pipeline"
      description="Crie um pipeline de vendas com etapas padrão"
      icon={Layers}
      variant="create"
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !nome.trim() || nome.trim().length < 3}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar Pipeline
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Nome <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Pipeline Comercial"
            className="w-full h-10 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
            maxLength={255}
          />
          {nome.length > 0 && nome.trim().length < 3 && (
            <p className="text-xs text-destructive mt-1">Mínimo 3 caracteres</p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição opcional..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground resize-none"
          />
        </div>

        {/* Cor */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Cor
          </label>
          <div className="flex gap-2 flex-wrap">
            {CORES_PIPELINE.map(c => (
              <button
                key={c}
                onClick={() => setCor(c)}
                className={`
                  w-8 h-8 rounded-full transition-all duration-200
                  ${cor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}
                `}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Info: etapas padrão */}
        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-xs text-muted-foreground">
            O pipeline será criado com 6 etapas padrão: Novos Negócios, Qualificação, Proposta, Negociação, Ganho e Perdido.
            Você pode personalizá-las depois em Configurações.
          </p>
        </div>
      </div>
    </ModalBase>
  )
}
