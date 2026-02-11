/**
 * AIDEV-NOTE: Card de automação para listagem (PRD-12)
 * Conforme Design System - Card com toggle, info de trigger e estatísticas
 */

import { Pencil, Trash2, ToggleLeft, ToggleRight, Zap, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TRIGGER_TIPOS } from '../schemas/automacoes.schema'
import type { Automacao } from '../schemas/automacoes.schema'

interface AutomacaoCardProps {
  automacao: Automacao
  onEdit: (id: string) => void
  onToggle: (id: string, ativo: boolean) => void
  onDelete: (id: string) => void
  isAdmin: boolean
}

export function AutomacaoCard({ automacao, onEdit, onToggle, onDelete, isAdmin }: AutomacaoCardProps) {
  const triggerInfo = TRIGGER_TIPOS.find(t => t.tipo === automacao.trigger_tipo)

  return (
    <div
      className={`flex items-center justify-between px-4 py-3.5 rounded-lg border transition-all duration-200 ${
        automacao.ativo
          ? 'border-primary/30 bg-primary/[0.02] hover:bg-primary/[0.04]'
          : 'border-border/50 bg-card hover:bg-accent/30 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Toggle */}
        {isAdmin && (
          <button
            onClick={() => onToggle(automacao.id, !automacao.ativo)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            title={automacao.ativo ? 'Desativar' : 'Ativar'}
          >
            {automacao.ativo ? (
              <ToggleRight className="w-5 h-5 text-primary" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Ícone */}
        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
          automacao.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          <Zap className="w-4 h-4" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{automacao.nome}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {triggerInfo?.label || automacao.trigger_tipo}
            </span>
            <span className="text-xs text-muted-foreground/50">•</span>
            <span className="text-xs text-muted-foreground">
              {automacao.acoes.length} {automacao.acoes.length === 1 ? 'ação' : 'ações'}
            </span>
            {automacao.condicoes.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground/50">•</span>
                <span className="text-xs text-muted-foreground">
                  {automacao.condicoes.length} {automacao.condicoes.length === 1 ? 'condição' : 'condições'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats + Actions */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        {/* Estatísticas */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mr-2">
          <div className="flex items-center gap-1" title="Total de execuções">
            <Activity className="w-3.5 h-3.5" />
            <span>{automacao.total_execucoes}</span>
          </div>
          {automacao.ultima_execucao_em && (
            <span title="Última execução">
              {formatDistanceToNow(new Date(automacao.ultima_execucao_em), { addSuffix: true, locale: ptBR })}
            </span>
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(automacao.id)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(automacao.id)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
