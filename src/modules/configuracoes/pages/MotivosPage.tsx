/**
 * AIDEV-NOTE: Página de Motivos de Resultado
 * Conforme PRD-05 - Motivos de Ganho/Perda
 * Tabs: Ganho | Perda
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, Trophy, XCircle, Pencil, Lock } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useMotivos } from '../hooks/useMotivos'
import { MotivoFormModal } from '../components/motivos/MotivoFormModal'
import type { MotivoResultado, TipoMotivo } from '../services/configuracoes.api'

export function MotivosPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [tipoAtivo, setTipoAtivo] = useState<TipoMotivo>('ganho')
  const [modalOpen, setModalOpen] = useState(false)
  const [motivoEditando, setMotivoEditando] = useState<MotivoResultado | null>(null)

  const { data, isLoading, error } = useMotivos(tipoAtivo)

  // Injetar ações no toolbar
  useEffect(() => {
    setSubtitle('Gerencie motivos de ganho e perda de negócios')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setMotivoEditando(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Motivo</span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleEdit = (motivo: MotivoResultado) => {
    if (!isAdmin) return
    setMotivoEditando(motivo)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setMotivoEditando(null)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setTipoAtivo('ganho')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            tipoAtivo === 'ganho'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Ganho
        </button>
        <button
          onClick={() => setTipoAtivo('perda')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            tipoAtivo === 'perda'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <XCircle className="w-4 h-4" />
          Perda
        </button>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">Erro ao carregar motivos</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Verifique sua conexão'}
          </p>
        </div>
      ) : (
        <MotivosList
          motivos={data?.motivos || []}
          isAdmin={isAdmin}
          onEdit={handleEdit}
        />
      )}

      {/* Modal */}
      {modalOpen && (
        <MotivoFormModal
          tipo={tipoAtivo}
          motivo={motivoEditando}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

// =====================================================
// Sub-componente
// =====================================================

function MotivosList({ motivos, isAdmin, onEdit }: {
  motivos: MotivoResultado[]
  isAdmin: boolean
  onEdit: (m: MotivoResultado) => void
}) {
  if (motivos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <Trophy className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhum motivo encontrado</p>
        {isAdmin && (
          <p className="text-xs text-muted-foreground mt-1">
            Clique em &quot;Novo Motivo&quot; para adicionar
          </p>
        )}
      </div>
    )
  }

  // Separar padrão e customizados
  const padrao = motivos.filter(m => m.padrao)
  const custom = motivos.filter(m => !m.padrao)

  return (
    <div className="space-y-1">
      {/* Motivos Padrão */}
      {padrao.map(motivo => (
        <div
          key={motivo.id}
          className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/30 border border-border/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: motivo.cor }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">{motivo.nome}</span>
              </div>
              {motivo.descricao && (
                <p className="text-xs text-muted-foreground truncate">{motivo.descricao}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border">
              <Lock className="w-3 h-3 inline mr-1" />
              Padrão
            </span>
            {isAdmin && (
              <button
                onClick={() => onEdit(motivo)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                title="Editar motivo"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Separador */}
      {padrao.length > 0 && custom.length > 0 && (
        <div className="border-t border-border my-3" />
      )}

      {/* Motivos Custom */}
      {custom.map(motivo => (
        <div
          key={motivo.id}
          className={`flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-all duration-200 ${
            !motivo.ativo ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: motivo.cor }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">{motivo.nome}</span>
                {!motivo.ativo && (
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">Inativo</span>
                )}
              </div>
              {motivo.descricao && (
                <p className="text-xs text-muted-foreground truncate">{motivo.descricao}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={() => onEdit(motivo)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                title="Editar motivo"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
