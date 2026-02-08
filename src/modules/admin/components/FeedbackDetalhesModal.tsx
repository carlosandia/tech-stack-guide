/**
 * AIDEV-NOTE: Modal de detalhes do feedback (PRD-15)
 * Super Admin - visualizar detalhes e resolver feedback
 */

import { useResolverFeedback } from '@/modules/feedback/hooks/useFeedback'
import type { FeedbackComDetalhes } from '@/modules/feedback/services/feedback.api'
import {
  X,
  Bug,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react'

interface FeedbackDetalhesModalProps {
  feedback: FeedbackComDetalhes
  open: boolean
  onClose: () => void
}

function TipoBadge({ tipo }: { tipo: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
    bug: { bg: 'bg-red-50', text: 'text-red-800', icon: Bug, label: 'Bug' },
    sugestao: { bg: 'bg-violet-50', text: 'text-violet-800', icon: Lightbulb, label: 'Sugestão' },
    duvida: { bg: 'bg-blue-50', text: 'text-blue-800', icon: HelpCircle, label: 'Dúvida' },
  }
  const c = config[tipo] || config.duvida
  const Icon = c.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {c.label}
    </span>
  )
}

function formatDateFull(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function roleLabel(role: string) {
  if (role === 'admin') return 'Admin'
  if (role === 'member') return 'Membro'
  return role
}

export function FeedbackDetalhesModal({ feedback, open, onClose }: FeedbackDetalhesModalProps) {
  const resolver = useResolverFeedback()
  const isResolvido = feedback.status === 'resolvido'

  if (!open) return null

  const handleResolver = async () => {
    await resolver.mutateAsync(feedback.id)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[500] bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[501] flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg border border-border w-full max-w-lg max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Detalhes do Feedback</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Conteudo */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Empresa */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Empresa</label>
              <p className="text-sm text-foreground mt-0.5">{feedback.organizacao?.nome || '—'}</p>
            </div>

            {/* Usuario */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Usuário</label>
              <div className="mt-0.5">
                <p className="text-sm font-medium text-foreground">{feedback.usuario?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {feedback.usuario?.email} · {roleLabel(feedback.usuario?.role)}
                </p>
              </div>
            </div>

            {/* Tipo + Data */}
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <div className="mt-1"><TipoBadge tipo={feedback.tipo} /></div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data</label>
                <p className="text-sm text-foreground mt-0.5">{formatDateFull(feedback.criado_em)}</p>
              </div>
            </div>

            {/* Descricao */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              <div className="mt-1 p-3 bg-muted/50 rounded-md max-h-48 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap">{feedback.descricao}</p>
              </div>
            </div>

            {/* Status / Resolucao */}
            {isResolvido && (
              <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Resolvido</span>
                </div>
                {feedback.resolvido_por_usuario && (
                  <p className="text-xs text-emerald-700">
                    Por {feedback.resolvido_por_usuario.nome}
                    {feedback.resolvido_em && ` em ${formatDateFull(feedback.resolvido_em)}`}
                  </p>
                )}
              </div>
            )}

            {!isResolvido && (
              <div className="p-3 bg-amber-50 rounded-md border border-amber-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Aguardando resolução</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Fechar
            </button>
            {!isResolvido && (
              <button
                onClick={handleResolver}
                disabled={resolver.isPending}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {resolver.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <CheckCircle2 className="w-4 h-4" />
                Marcar como Resolvido
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default FeedbackDetalhesModal
