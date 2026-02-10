/**
 * AIDEV-NOTE: Popover para gerenciar membros vinculados à pipeline
 * Exibido no header da PipelineConfigPage
 */

import { useState, useRef, useEffect } from 'react'
import { Users, Loader2, Check } from 'lucide-react'
import { useMembrosPipeline } from '../../hooks/usePipelineConfig'
import { negociosApi } from '../../services/negocios.api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface Props {
  funilId: string
}

export function GerenciarMembrosPipeline({ funilId }: Props) {
  const [open, setOpen] = useState(false)
  const [todosMembros, setTodosMembros] = useState<Array<{ id: string; nome: string; sobrenome?: string | null }>>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: membrosVinculados, isLoading } = useMembrosPipeline(funilId)

  // Carregar todos os membros do tenant ao abrir
  useEffect(() => {
    if (!open) return
    setLoading(true)
    negociosApi.listarMembros().then(m => {
      setTodosMembros(m)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [open])

  // Click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const vinculadosIds = new Set((membrosVinculados || []).map(m => m.usuario_id))
  const totalVinculados = vinculadosIds.size

  const handleToggle = async (userId: string) => {
    try {
      if (vinculadosIds.has(userId)) {
        // Remover
        const vinculo = membrosVinculados?.find(m => m.usuario_id === userId)
        if (vinculo) {
          await supabase.from('funis_membros').delete().eq('id', vinculo.id)
        }
      } else {
        // Adicionar
        await negociosApi.adicionarMembrosFunil(funilId, [userId])
      }
      qc.invalidateQueries({ queryKey: ['pipeline-config', 'membros', funilId] })
    } catch {
      toast.error('Erro ao atualizar membro')
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent border border-border transition-all duration-200"
        title="Gerenciar membros"
      >
        <Users className="w-3.5 h-3.5" />
        <span>{totalVinculados} membro{totalVinculados !== 1 ? 's' : ''}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-card border border-border rounded-lg shadow-lg z-[60] animate-enter">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground">Membros da Pipeline</span>
          </div>

          <div className="max-h-[280px] overflow-y-auto py-1">
            {(loading || isLoading) ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : todosMembros.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum membro encontrado</p>
            ) : (
              todosMembros.map(m => {
                const isVinculado = vinculadosIds.has(m.id)
                return (
                  <button
                    key={m.id}
                    onClick={() => handleToggle(m.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isVinculado ? 'bg-primary border-primary' : 'border-input'
                    }`}>
                      {isVinculado && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="truncate">{[m.nome, m.sobrenome].filter(Boolean).join(' ')}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
