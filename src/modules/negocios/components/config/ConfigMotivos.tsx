/**
 * AIDEV-NOTE: Aba Motivos da configuração de pipeline
 * Conforme PRD-07 RF-09 - Motivos ganho/perda
 */

import { useState } from 'react'
import { Plus, Trash2, Search, CheckCircle2, XCircle, Info } from 'lucide-react'
import { useMotivosVinculados, useMotivosDisponiveis, useVincularMotivo, useDesvincularMotivo } from '../../hooks/usePipelineConfig'
import { useAtualizarPipeline } from '../../hooks/usePipelineConfig'

interface Props {
  funilId: string
  exigirMotivo: boolean
}

export function ConfigMotivos({ funilId, exigirMotivo }: Props) {
  const { data: vinculados, isLoading } = useMotivosVinculados(funilId)
  const { data: disponiveis } = useMotivosDisponiveis()
  const vincular = useVincularMotivo(funilId)
  const desvincular = useDesvincularMotivo(funilId)
  const atualizarPipeline = useAtualizarPipeline(funilId)

  const [showAdd, setShowAdd] = useState<'ganho' | 'perda' | null>(null)
  const [busca, setBusca] = useState('')

  const vinculadosIds = new Set((vinculados || []).map(v => v.motivo_id))

  const motivosGanho = (vinculados || []).filter(v => v.motivo?.tipo === 'ganho')
  const motivosPerda = (vinculados || []).filter(v => v.motivo?.tipo === 'perda')

  const motivosFiltrados = (tipo: string) =>
    (disponiveis || [])
      .filter(m => m.tipo === tipo)
      .filter(m => !vinculadosIds.has(m.id))
      .filter(m => !busca || m.nome.toLowerCase().includes(busca.toLowerCase()))

  const handleToggleExigir = () => {
    atualizarPipeline.mutate({ exigir_motivo_resultado: !exigirMotivo })
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Motivos de Resultado</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure os motivos de ganho e perda para esta pipeline
        </p>
      </div>

      {/* Toggle exigir motivo */}
      <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-card">
        <div>
          <div className="text-sm font-medium text-foreground">Exigir motivo ao fechar</div>
          <div className="text-xs text-muted-foreground">
            Ao mover para "Ganho" ou "Perdido", será obrigatório informar o motivo
          </div>
        </div>
        <button
          onClick={handleToggleExigir}
          className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-all duration-200 ${
            exigirMotivo ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
              exigirMotivo ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Grid: Ganho / Perda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Motivos de Ganho */}
        <div className="border border-border rounded-lg bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h4 className="text-sm font-medium text-foreground">Motivos de Ganho</h4>
            <span className="text-xs text-muted-foreground ml-auto">
              {motivosGanho.length} adicionados
            </span>
          </div>

          <div className="space-y-1">
            {motivosGanho.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nenhum motivo de ganho</p>
            ) : (
              motivosGanho.map(v => (
                <div key={v.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                  <span className="text-sm text-foreground flex-1">{v.motivo?.nome}</span>
                  <button
                    onClick={() => desvincular.mutate(v.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive transition-all duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => { setShowAdd(showAdd === 'ganho' ? null : 'ganho'); setBusca('') }}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>

          {showAdd === 'ganho' && (
            <AddMotivoPanel
              tipo="ganho"
              motivos={motivosFiltrados('ganho')}
              busca={busca}
              onBuscaChange={setBusca}
              onVincular={(id) => { vincular.mutate(id); setShowAdd(null) }}
              onClose={() => setShowAdd(null)}
            />
          )}
        </div>

        {/* Motivos de Perda */}
        <div className="border border-border rounded-lg bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <h4 className="text-sm font-medium text-foreground">Motivos de Perda</h4>
            <span className="text-xs text-muted-foreground ml-auto">
              {motivosPerda.length} adicionados
            </span>
          </div>

          <div className="space-y-1">
            {motivosPerda.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nenhum motivo de perda</p>
            ) : (
              motivosPerda.map(v => (
                <div key={v.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                  <span className="text-sm text-foreground flex-1">{v.motivo?.nome}</span>
                  <button
                    onClick={() => desvincular.mutate(v.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive transition-all duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => { setShowAdd(showAdd === 'perda' ? null : 'perda'); setBusca('') }}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>

          {showAdd === 'perda' && (
            <AddMotivoPanel
              tipo="perda"
              motivos={motivosFiltrados('perda')}
              busca={busca}
              onBuscaChange={setBusca}
              onVincular={(id) => { vincular.mutate(id); setShowAdd(null) }}
              onClose={() => setShowAdd(null)}
            />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-foreground">
          Motivos são gerenciados globalmente em <strong>Configurações &gt; Motivos</strong> e ajudam a identificar padrões de ganho/perda entre todas as pipelines.
        </p>
      </div>
    </div>
  )
}

// Sub-component
function AddMotivoPanel({
  tipo,
  motivos,
  busca,
  onBuscaChange,
  onVincular,
  onClose,
}: {
  tipo: string
  motivos: Array<{ id: string; nome: string }>
  busca: string
  onBuscaChange: (v: string) => void
  onVincular: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="border border-border rounded-md p-2 space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={busca}
          onChange={e => onBuscaChange(e.target.value)}
          placeholder="Buscar motivos..."
          className="w-full pl-7 pr-3 py-1.5 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="max-h-32 overflow-y-auto space-y-0.5">
        {motivos.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nenhum motivo de {tipo} disponível
          </p>
        ) : (
          motivos.map(m => (
            <button
              key={m.id}
              onClick={() => onVincular(m.id)}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left text-sm transition-all duration-200"
            >
              <span className="flex-1 text-foreground">{m.nome}</span>
              <Plus className="w-3.5 h-3.5 text-primary" />
            </button>
          ))
        )}
      </div>

      <button onClick={onClose} className="text-xs text-muted-foreground hover:underline">
        Cancelar
      </button>
    </div>
  )
}
