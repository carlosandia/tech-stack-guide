import { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useCampos } from '../hooks/useCampos'
import { CamposList } from '../components/campos/CamposList'
import { CampoFormModal } from '../components/campos/CampoFormModal'
import { entidadeOptions } from '../schemas/campos.schema'
import type { Entidade, CampoCustomizado } from '../services/configuracoes.api'

/**
 * AIDEV-NOTE: Página de Campos Personalizados
 * Conforme PRD-05 - Seção 3.1.1
 * Tabs por entidade, listagem com campos do sistema bloqueados
 */

export function CamposPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [entidadeAtiva, setEntidadeAtiva] = useState<Entidade>('pessoa')
  const [modalOpen, setModalOpen] = useState(false)
  const [campoEditando, setCampoEditando] = useState<CampoCustomizado | null>(null)

  const { data, isLoading, error } = useCampos(entidadeAtiva)

  // Injetar ações no toolbar
  useEffect(() => {
    setSubtitle('Gerencie os campos personalizados por entidade')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setCampoEditando(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Campo</span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleEdit = (campo: CampoCustomizado) => {
    if (!isAdmin) return
    setCampoEditando(campo)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setCampoEditando(null)
  }

  return (
    <div className="space-y-6">
      {/* Tabs de entidade */}
      <div className="flex items-center gap-1 border-b border-border">
        {entidadeOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setEntidadeAtiva(opt.value as Entidade)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
              entidadeAtiva === opt.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">Erro ao carregar campos</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Verifique sua conexão'}
          </p>
        </div>
      ) : (
        <CamposList
          campos={data?.campos || []}
          isAdmin={isAdmin}
          onEdit={handleEdit}
        />
      )}

      {/* Modal */}
      {modalOpen && (
        <CampoFormModal
          entidade={entidadeAtiva}
          campo={campoEditando}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
