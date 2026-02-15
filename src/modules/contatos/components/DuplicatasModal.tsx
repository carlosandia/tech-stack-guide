/**
 * AIDEV-NOTE: Modal de Detecção e Mesclagem de Duplicatas
 * Conforme PRD-06 RF-007 - Admin Only
 */

import { useState, forwardRef } from 'react'
import { X, GitMerge, XCircle } from 'lucide-react'
import { useDuplicatas, useMesclarContatos } from '../hooks/useContatos'

interface DuplicatasModalProps {
  open: boolean
  onClose: () => void
}

interface DuplicataGrupo {
  campo: string
  valor: string
  contatos: Array<{
    id: string
    nome?: string
    sobrenome?: string
    email?: string
    telefone?: string
    criado_em: string
  }>
}

export const DuplicatasModal = forwardRef<HTMLDivElement, DuplicatasModalProps>(function DuplicatasModal({ open, onClose }, _ref) {
  const { data, isLoading } = useDuplicatas()
  const mesclar = useMesclarContatos()
  const [selectedPrincipal, setSelectedPrincipal] = useState<Record<number, string>>({})

  if (!open) return null

  const grupos: DuplicataGrupo[] = data?.duplicatas || []

  const handleMesclar = (grupoIdx: number, grupo: DuplicataGrupo) => {
    const principalId = selectedPrincipal[grupoIdx]
    if (!principalId) return

    const outroContato = grupo.contatos.find(c => c.id !== principalId)
    if (!outroContato) return

    mesclar.mutate({
      contato_manter_id: principalId,
      contato_mesclar_id: outroContato.id,
    })
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Possíveis Duplicatas</h3>
            <p className="text-sm text-muted-foreground">
              {grupos.length > 0 ? `Encontramos ${grupos.length} grupo(s) de possíveis duplicatas` : 'Analisando base de contatos...'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-md transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground text-sm">Buscando duplicatas...</div>
            </div>
          ) : grupos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <span className="text-xl">✓</span>
              </div>
              <p className="text-sm font-medium text-foreground">Base limpa!</p>
              <p className="text-xs text-muted-foreground mt-1">Nenhuma duplicata detectada</p>
            </div>
          ) : (
            grupos.map((grupo, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Grupo {idx + 1}</span>
                  <span className="text-xs text-muted-foreground">— {grupo.campo}: {grupo.valor}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {grupo.contatos.map((contato) => (
                    <button
                      key={contato.id}
                      type="button"
                      onClick={() => setSelectedPrincipal({ ...selectedPrincipal, [idx]: contato.id })}
                      className={`text-left p-3 rounded-md border transition-colors ${
                        selectedPrincipal[idx] === contato.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">
                        {[contato.nome, contato.sobrenome].filter(Boolean).join(' ') || 'Sem nome'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{contato.email || '—'}</p>
                      <p className="text-xs text-muted-foreground">{contato.telefone || '—'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Criado: {new Date(contato.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                      <span className={`inline-block mt-1.5 text-xs font-medium ${
                        selectedPrincipal[idx] === contato.id ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {selectedPrincipal[idx] === contato.id ? '● Manter este' : '○ Mesclar neste'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleMesclar(idx, grupo)}
                    disabled={!selectedPrincipal[idx] || mesclar.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    Mesclar Selecionados
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
                    <XCircle className="w-3.5 h-3.5" />
                    Não são duplicatas
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
})
DuplicatasModal.displayName = 'DuplicatasModal'
