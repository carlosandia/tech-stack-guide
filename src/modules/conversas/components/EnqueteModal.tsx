/**
 * AIDEV-NOTE: Modal de criação de enquete para WhatsApp (PRD-09)
 * Pergunta + opções (min 2, max 12) + checkbox múltiplas respostas
 */

import { useState, useCallback } from 'react'
import { X, Plus, Trash2, BarChart3, Send } from 'lucide-react'

interface EnqueteModalProps {
  onSend: (data: { pergunta: string; opcoes: string[]; multiplas: boolean }) => void
  onClose: () => void
}

export function EnqueteModal({ onSend, onClose }: EnqueteModalProps) {
  const [pergunta, setPergunta] = useState('')
  const [opcoes, setOpcoes] = useState(['', ''])
  const [multiplas, setMultiplas] = useState(false)

  const handleAddOpcao = useCallback(() => {
    if (opcoes.length >= 12) return
    setOpcoes(prev => [...prev, ''])
  }, [opcoes.length])

  const handleRemoveOpcao = useCallback((idx: number) => {
    if (opcoes.length <= 2) return
    setOpcoes(prev => prev.filter((_, i) => i !== idx))
  }, [opcoes.length])

  const handleOpcaoChange = useCallback((idx: number, value: string) => {
    setOpcoes(prev => prev.map((o, i) => i === idx ? value : o))
  }, [])

  const opcoesPreenchidas = opcoes.filter(o => o.trim().length > 0)
  const isValid = pergunta.trim().length > 0 && opcoesPreenchidas.length >= 2

  const handleSubmit = useCallback(() => {
    if (!isValid) return
    onSend({
      pergunta: pergunta.trim(),
      opcoes: opcoesPreenchidas,
      multiplas,
    })
  }, [isValid, pergunta, opcoesPreenchidas, multiplas, onSend])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[400] bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10%] z-[401] mx-auto max-w-md bg-background rounded-lg shadow-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#16A34A20' }}>
            <BarChart3 className="w-4 h-4" style={{ color: '#16A34A' }} />
          </div>
          <h3 className="text-sm font-semibold text-foreground flex-1">Criar Enquete</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Question */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Pergunta *</label>
            <input
              type="text"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              placeholder="Digite a pergunta da enquete..."
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
              maxLength={255}
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Opções ({opcoesPreenchidas.length}/12) *
            </label>
            <div className="space-y-2">
              {opcoes.map((opcao, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 text-center">{idx + 1}</span>
                  <input
                    type="text"
                    value={opcao}
                    onChange={(e) => handleOpcaoChange(idx, e.target.value)}
                    placeholder={`Opção ${idx + 1}`}
                    className="flex-1 px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    maxLength={100}
                  />
                  {opcoes.length > 2 && (
                    <button
                      onClick={() => handleRemoveOpcao(idx)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {opcoes.length < 12 && (
              <button
                onClick={handleAddOpcao}
                className="flex items-center gap-1.5 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar opção
              </button>
            )}
          </div>

          {/* Multiple answers toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={multiplas}
              onChange={(e) => setMultiplas(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-xs text-foreground">Permitir múltiplas respostas</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            Enviar Enquete
          </button>
        </div>
      </div>
    </>
  )
}
