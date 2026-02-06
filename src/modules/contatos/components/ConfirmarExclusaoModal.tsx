/**
 * AIDEV-NOTE: Modal de confirmação de exclusão de contato
 * Suporta modo normal (confirmar exclusão) e modo bloqueado (vínculos impedem exclusão)
 * Conforme PRD-06 RF-014 e Design System
 */

import { X, AlertTriangle, Link2 } from 'lucide-react'

interface Vinculo {
  tipo: string
  nome: string
  id: string
}

interface ConfirmarExclusaoModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  titulo?: string
  mensagem?: string
  erro?: string | null
  bloqueado?: boolean
  vinculos?: Vinculo[]
}

export function ConfirmarExclusaoModal({
  open,
  onClose,
  onConfirm,
  loading,
  titulo = 'Excluir Contato',
  mensagem = 'Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.',
  erro,
  bloqueado = false,
  vinculos = [],
}: ConfirmarExclusaoModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            bloqueado ? 'bg-amber-100' : 'bg-destructive/10'
          }`}>
            {bloqueado
              ? <Link2 className="w-5 h-5 text-amber-600" />
              : <AlertTriangle className="w-5 h-5 text-destructive" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {bloqueado ? 'Exclusão bloqueada' : titulo}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {bloqueado
                ? 'Este contato possui vínculos ativos que impedem a exclusão.'
                : mensagem}
            </p>
          </div>
        </div>

        {bloqueado && vinculos.length > 0 && (
          <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
              Vínculos encontrados ({vinculos.length})
            </p>
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {vinculos.map((v) => (
                <div key={v.id} className="flex items-center gap-2 py-1">
                  <span className="text-xs text-amber-600 font-medium capitalize">{v.tipo}</span>
                  <span className="text-sm text-amber-800">{v.nome}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-2">
              Remova os vínculos antes de excluir este contato.
            </p>
          </div>
        )}

        {erro && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{erro}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          {bloqueado ? (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Entendi
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
