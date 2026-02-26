/**
 * AIDEV-NOTE: Componente de visualizações salvas do dashboard.
 * Permite criar, aplicar e excluir combinações de filtros com nome personalizado.
 */

import { useState } from 'react'
import { Bookmark, Trash2, Check, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  useDashboardVisualizacoes,
  type VisualizacaoFiltros,
  type VisualizacaoDashboard,
} from '../../hooks/useDashboardVisualizacoes'
import type { DashboardDisplayConfig } from '../../hooks/useDashboardDisplay'

interface DashboardVisualizacoesProps {
  filtrosAtuais: VisualizacaoFiltros
  configExibicaoAtual: DashboardDisplayConfig
  onAplicar: (v: VisualizacaoDashboard) => void
}

export default function DashboardVisualizacoes({
  filtrosAtuais,
  configExibicaoAtual,
  onAplicar,
}: DashboardVisualizacoesProps) {
  const { visualizacoes, salvar, excluir, isSaving } = useDashboardVisualizacoes()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [open, setOpen] = useState(false)

  const handleSalvar = () => {
    if (!nome.trim()) return
    salvar(
      {
        nome: nome.trim(),
        filtros: filtrosAtuais,
        config_exibicao: configExibicaoAtual,
      },
      {
        onSuccess: () => {
          setNome('')
          setShowForm(false)
        },
      }
    )
  }

  const handleAplicar = (v: VisualizacaoDashboard) => {
    onAplicar(v)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          title="Visualizações salvas"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Visualizações</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground">Visualizações Salvas</p>

          {/* Lista */}
          {visualizacoes.length === 0 && !showForm && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Nenhuma visualização salva
            </p>
          )}

          <div className="max-h-48 overflow-y-auto space-y-1">
            {visualizacoes.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group cursor-pointer"
                onClick={() => handleAplicar(v)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Check className="w-3 h-3 text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-xs text-foreground truncate">{v.nome}</span>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    excluir(v.id)
                  }}
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Formulário de criação */}
          {showForm ? (
            <div className="flex items-center gap-2">
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da visualização"
                className="h-8 text-xs"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSalvar()}
              />
              <Button
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleSalvar}
                disabled={isSaving || !nome.trim()}
              >
                Salvar
              </Button>
            </div>
          ) : (
            <button
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors w-full py-1"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Salvar visualização atual
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
