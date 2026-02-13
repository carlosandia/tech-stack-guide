/**
 * AIDEV-NOTE: Seção de contatos bloqueados para pré-oportunidades
 * Exibida na página de Conexões (PRD-08)
 */

import { useState } from 'react'
import { ShieldX, Unlock, Loader2, Search } from 'lucide-react'
import { useBloqueadosPreOp, useDesbloquearPreOp } from '@/modules/negocios/hooks/usePreOportunidades'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ContatosBloqueadosSection() {
  const { data: bloqueados, isLoading } = useBloqueadosPreOp()
  const desbloquear = useDesbloquearPreOp()
  const [busca, setBusca] = useState('')

  const handleDesbloquear = async (id: string) => {
    try {
      await desbloquear.mutateAsync(id)
      toast.success('Contato desbloqueado')
    } catch {
      toast.error('Erro ao desbloquear')
    }
  }

  const filtrados = (bloqueados || []).filter(b =>
    !busca ||
    b.phone_number?.includes(busca) ||
    b.phone_name?.toLowerCase().includes(busca.toLowerCase()) ||
    b.motivo?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-muted/50 border border-border rounded-lg p-4">
        <ShieldX className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Contatos Bloqueados</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Números bloqueados não geram novas solicitações (pré-oportunidades) no Kanban.
            Mensagens continuam sendo salvas nas conversas normalmente.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !bloqueados?.length ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Nenhum contato bloqueado
        </div>
      ) : (
        <>
          {bloqueados.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por número, nome ou motivo..."
                className="w-full text-sm bg-background border border-input rounded-md pl-9 pr-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div className="space-y-2">
            {filtrados.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {b.phone_name || b.phone_number}
                  </p>
                  {b.phone_name && (
                    <p className="text-xs text-muted-foreground">{b.phone_number}</p>
                  )}
                  {b.motivo && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Motivo: {b.motivo}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bloqueado em {format(new Date(b.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <button
                  onClick={() => handleDesbloquear(b.id)}
                  disabled={desbloquear.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  {desbloquear.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  Desbloquear
                </button>
              </div>
            ))}
          </div>

          {busca && filtrados.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Nenhum resultado para "{busca}"
            </div>
          )}
        </>
      )}
    </div>
  )
}
