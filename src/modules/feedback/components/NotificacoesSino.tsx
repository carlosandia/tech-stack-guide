/**
 * AIDEV-NOTE: Sino de Notificacoes no header (PRD-15)
 * Badge com contagem + dropdown com ultimas notificacoes
 * Clicar em uma notificacao abre modal com detalhes completos
 */

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import {
  useNotificacoes,
  useContagemNaoLidas,
  useMarcarLida,
  useMarcarTodasLidas,
} from '../hooks/useNotificacoes'
import {
  Bell,
  CheckCircle2,
  Info,
  Loader2,
  Inbox,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { NotificacaoDetalhesModal } from './NotificacaoDetalhesModal'
import type { Notificacao } from '../services/notificacoes.api'

function getIconForTipo(tipo: string) {
  switch (tipo) {
    case 'feedback_resolvido':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
    default:
      return <Info className="w-4 h-4 text-primary flex-shrink-0" />
  }
}

export function NotificacoesSino() {
  const { role } = useAuth()
  const [open, setOpen] = useState(false)
  const [selectedNotificacao, setSelectedNotificacao] = useState<Notificacao | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: notificacoes, isLoading } = useNotificacoes(5)
  const { data: naoLidas } = useContagemNaoLidas()
  const marcarLida = useMarcarLida()
  const marcarTodasLidas = useMarcarTodasLidas()

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Visível para admin, member e super_admin
  if (!role) return null

  const count = naoLidas || 0
  const displayCount = count > 9 ? '9+' : count

  const handleClickNotificacao = (n: Notificacao) => {
    if (!n.lida) marcarLida.mutate(n.id)
    setOpen(false)
    setSelectedNotificacao(n)
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Botao sino */}
        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
              {displayCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-1 w-80 bg-background rounded-lg shadow-lg border border-border z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h4 className="text-sm font-semibold text-foreground">Notificações</h4>
                {count > 0 && (
                  <button
                    onClick={() => {
                      marcarTodasLidas.mutate()
                      setOpen(false)
                    }}
                    disabled={marcarTodasLidas.isPending}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {/* Lista */}
              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !notificacoes || notificacoes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Inbox className="w-8 h-8 mb-1.5" />
                    <p className="text-xs">Nenhuma notificação</p>
                  </div>
                ) : (
                  notificacoes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleClickNotificacao(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border last:border-0 ${
                        !n.lida ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Icone */}
                      <div className="mt-0.5">{getIconForTipo(n.tipo)}</div>

                      {/* Conteudo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{n.titulo}</p>
                          {!n.lida && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        {n.mensagem && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{n.mensagem}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.criado_em), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de detalhes */}
      {selectedNotificacao && (
        <NotificacaoDetalhesModal
          notificacao={selectedNotificacao}
          open={!!selectedNotificacao}
          onClose={() => setSelectedNotificacao(null)}
        />
      )}
    </>
  )
}

export default NotificacoesSino
