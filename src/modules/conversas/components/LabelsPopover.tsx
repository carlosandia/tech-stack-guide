/**
 * AIDEV-NOTE: Popover para gerenciar etiquetas de uma conversa
 * Lista todas labels disponíveis com checkbox para vincular/desvincular
 */

import { useState, useEffect } from 'react'
import { RefreshCw, Tag } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLabels, useLabelsConversa, useSincronizarLabels, useAplicarLabels } from '../hooks/useWhatsAppLabels'
import { LabelBadge } from './LabelBadge'
import { toast } from 'sonner'

interface LabelsPopoverProps {
  conversaId: string
  chatId: string
  sessionName: string
  children: React.ReactNode
}

export function LabelsPopover({ conversaId, chatId, sessionName, children }: LabelsPopoverProps) {
  const { data: allLabels = [], isLoading: loadingLabels } = useLabels()
  const { data: conversaLabels = [] } = useLabelsConversa(conversaId)
  const sincronizar = useSincronizarLabels()
  const aplicar = useAplicarLabels()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [autoSyncDone, setAutoSyncDone] = useState(false)

  // AIDEV-NOTE: Auto-sync labels ao abrir popover quando lista está vazia
  useEffect(() => {
    if (open && !loadingLabels && allLabels.length === 0 && !autoSyncDone && sessionName && !sincronizar.isPending) {
      setAutoSyncDone(true)
      sincronizar.mutate(sessionName)
    }
  }, [open, loadingLabels, allLabels.length, autoSyncDone, sessionName, sincronizar])

  // Sync selected from conversaLabels
  useEffect(() => {
    const ids = new Set(conversaLabels.map(cl => cl.whatsapp_labels.waha_label_id))
    setSelectedIds(ids)
  }, [conversaLabels])

  const handleToggle = async (wahaLabelId: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(wahaLabelId)) {
      newSet.delete(wahaLabelId)
    } else {
      newSet.add(wahaLabelId)
    }
    setSelectedIds(newSet)

    try {
      await aplicar.mutateAsync({
        sessionName,
        chatId,
        wahaLabelIds: Array.from(newSet),
      })
    } catch {
      toast.error('Erro ao aplicar etiquetas')
      // Revert
      setSelectedIds(new Set(conversaLabels.map(cl => cl.whatsapp_labels.waha_label_id)))
    }
  }

  const handleSincronizar = async () => {
    try {
      await sincronizar.mutateAsync(sessionName)
      toast.success('Etiquetas sincronizadas')
    } catch {
      toast.error('Erro ao sincronizar etiquetas')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start" sideOffset={8}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Etiquetas</span>
          </div>
          <button
            onClick={handleSincronizar}
            disabled={sincronizar.isPending}
            className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-50"
            title="Sincronizar etiquetas do WhatsApp"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${sincronizar.isPending ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto p-1.5">
          {loadingLabels ? (
            <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
          ) : allLabels.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">Nenhuma etiqueta encontrada</p>
              <button
                onClick={handleSincronizar}
                className="text-xs text-primary hover:underline mt-1"
              >
                Sincronizar do WhatsApp
              </button>
            </div>
          ) : (
            allLabels.map((label) => {
              const isSelected = selectedIds.has(label.waha_label_id)
              return (
                <button
                  key={label.id}
                  onClick={() => handleToggle(label.waha_label_id)}
                  disabled={aplicar.isPending}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent transition-colors text-left disabled:opacity-50"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </div>
                  <LabelBadge nome={label.nome} corHex={label.cor_hex} />
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
