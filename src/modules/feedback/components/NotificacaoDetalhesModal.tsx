/**
 * AIDEV-NOTE: Modal genérico para detalhes de notificação
 * Exibe informações expandidas baseado no tipo da notificação
 */

import { X, CheckCircle2, Info, Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Notificacao } from '../services/notificacoes.api'

interface NotificacaoDetalhesModalProps {
  notificacao: Notificacao
  open: boolean
  onClose: () => void
}

function getIconForTipo(tipo: string) {
  switch (tipo) {
    case 'feedback_resolvido':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    case 'tarefa_atribuida':
      return <Bell className="w-5 h-5 text-primary" />
    default:
      return <Info className="w-5 h-5 text-primary" />
  }
}

function getTipoLabel(tipo: string) {
  switch (tipo) {
    case 'feedback_resolvido': return 'Feedback Resolvido'
    case 'tarefa_atribuida': return 'Tarefa Atribuída'
    case 'oportunidade_ganha': return 'Oportunidade Ganha'
    case 'mensagem_recebida': return 'Mensagem Recebida'
    case 'sistema': return 'Sistema'
    default: return 'Notificação'
  }
}

export function NotificacaoDetalhesModal({ notificacao, open, onClose }: NotificacaoDetalhesModalProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[500] bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[501] flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg border border-border w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              {getIconForTipo(notificacao.tipo)}
              <h2 className="text-base font-semibold text-foreground">{getTipoLabel(notificacao.tipo)}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-4">
            {/* Título */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Título</label>
              <p className="text-sm font-medium text-foreground mt-0.5">{notificacao.titulo}</p>
            </div>

            {/* Mensagem */}
            {notificacao.mensagem && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Detalhes</label>
                <div className="mt-1 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{notificacao.mensagem}</p>
                </div>
              </div>
            )}

            {/* Data */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Recebida</label>
              <p className="text-sm text-foreground mt-0.5">
                {formatDistanceToNow(new Date(notificacao.criado_em), { addSuffix: true, locale: ptBR })}
                {' · '}
                {new Date(notificacao.criado_em).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>

            {/* Status */}
            <div className={`p-3 rounded-md border ${notificacao.lida ? 'bg-muted/30 border-border' : 'bg-primary/5 border-primary/20'}`}>
              <div className="flex items-center gap-2">
                {notificacao.lida ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Lida{notificacao.lida_em && ` em ${new Date(notificacao.lida_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs text-primary font-medium">Não lida</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t border-border">
            {notificacao.link && (
              <a
                href={notificacao.link}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center mr-auto"
              >
                Ver detalhes
              </a>
            )}
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotificacaoDetalhesModal
